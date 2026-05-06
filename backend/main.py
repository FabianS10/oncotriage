"""
OncoTriage Backend — Eagle Reaper
F.A.S.C. Machine Learning Solutions S.A.S.

Endpoints:
  POST /predict  → MC Dropout inference + triage
  POST /heatmap  → Grad-CAM activation map (base64 PNG)
  GET  /health   → system status
  GET  /         → root
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import base64
import io
import os
import gdown

try:
    from model import OncoTriageModel
    CUSTOM_MODEL = True
except ImportError:
    CUSTOM_MODEL = False

# ── Infrastructure ─────────────────────────────────────────────────────────────
GDRIVE_ID  = os.getenv("GDRIVE_ID", "1Mx5pN-2jpGvye2BZ0Dq4XByCR4mDJ68t")
MODEL_PATH = "oncotriage_model.pth"
device     = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model      = None

# Hook storage for Grad-CAM
_gradients  = None
_activations = None

app = FastAPI(title="OncoTriage API — Eagle Reaper · F.A.S.C. ML Solutions")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Model ──────────────────────────────────────────────────────────────────────
def build_fallback_model() -> nn.Module:
    """
    ResNet-50 fallback when custom model file not found.
    Grad-CAM hooks attached to layer4 (last conv block).
    """
    from torchvision.models import resnet50, ResNet50_Weights
    m = resnet50(weights=ResNet50_Weights.DEFAULT)
    m.fc = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(m.fc.in_features, 2),
    )
    return m


def _grad_hook(grad):
    global _gradients
    _gradients = grad


# ── Drive download ─────────────────────────────────────────────────────────────
def download_weights():
    if os.path.exists(MODEL_PATH):
        print("🧠 Weights already cached — skipping download.")
        return True
    print(f"🚀 Downloading model weights (ID: {GDRIVE_ID})...")
    try:
        gdown.download(f"https://drive.google.com/uc?id={GDRIVE_ID}", MODEL_PATH, quiet=False)
        return os.path.exists(MODEL_PATH)
    except Exception as e:
        print(f"⚠ Drive download failed: {e}")
        return False


# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def load_model_on_startup():
    global model
    weights_ok = download_weights()

    if CUSTOM_MODEL:
        m = OncoTriageModel()
        if weights_ok:
            try:
                ck = torch.load(MODEL_PATH, map_location=device, weights_only=True)
                m.load_state_dict(ck if not isinstance(ck, dict) else ck.get("state_dict", ck), strict=False)
                print("✅ Custom OncoTriageModel weights loaded")
            except Exception as e:
                print(f"⚠ Could not load weights ({e}) — using random init")
    else:
        m = build_fallback_model()
        if weights_ok:
            try:
                ck = torch.load(MODEL_PATH, map_location=device, weights_only=True)
                sd = ck.get("state_dict", ck)
                # Strip common wrapper prefixes
                cleaned = {k.replace("resnet.","").replace("model.","").replace("module.",""): v for k,v in sd.items()}
                m.load_state_dict(cleaned, strict=False)
                print("✅ ResNet-50 weights loaded")
            except Exception as e:
                print(f"⚠ Fallback model using ImageNet weights only ({e})")
        else:
            print("⚠ No weights file — using ImageNet pre-trained ResNet-50")

    m.to(device).eval()
    model = m
    print(f"🦅 Eagle Reaper ONLINE on {device}")


# ── Preprocessing ──────────────────────────────────────────────────────────────
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

preprocess_384 = transforms.Compose([
    transforms.Resize((384, 384)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def decode_b64_image(b64: str) -> Image.Image:
    data = b64.split(",")[-1]
    return Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")


# ── MC Dropout inference ───────────────────────────────────────────────────────
def mc_dropout_inference(tensor: torch.Tensor, n_samples: int = 50):
    """
    Activate dropout at inference, run N forward passes.
    Works with both custom OncoTriageModel and ResNet-50 fallback.
    """
    # Try custom model's built-in method first
    if CUSTOM_MODEL and hasattr(model, "predict_with_uncertainty"):
        with torch.no_grad():
            mean_out, uncertainty = model.predict_with_uncertainty(tensor, n_iter=n_samples)
        prob = float(mean_out[0][1].item())
        unc  = float(uncertainty[0][1].item())
        return prob, unc

    # Generic MC Dropout: model.train() + freeze BN
    model.train()
    for m in model.modules():
        if isinstance(m, (nn.BatchNorm1d, nn.BatchNorm2d, nn.BatchNorm3d)):
            m.eval()

    probs = []
    with torch.no_grad():
        for _ in range(n_samples):
            out = model(tensor)
            p   = torch.softmax(out, dim=1)[0][1].item()
            probs.append(p)

    model.eval()
    arr = np.array(probs)
    return float(arr.mean()), float(arr.std())


# ── Grad-CAM ───────────────────────────────────────────────────────────────────
def generate_gradcam(tensor: torch.Tensor, original_img: Image.Image) -> str:
    """
    Grad-CAM: backprop gradients through the last convolutional layer.
    Returns base64 PNG with heatmap overlaid on the original image.
    """
    global _gradients, _activations

    model.eval()
    tensor = tensor.clone().requires_grad_(True)

    # Find last conv layer and register hooks
    last_conv = None
    for name, module in model.named_modules():
        if isinstance(module, nn.Conv2d):
            last_conv = module

    if last_conv is None:
        raise ValueError("No Conv2d layer found in model")

    activation_store = {}

    def fwd_hook(module, inp, out):
        activation_store['act'] = out
        out.register_hook(lambda g: activation_store.update({'grad': g}))

    handle = last_conv.register_forward_hook(fwd_hook)

    # Forward pass
    output = model(tensor)
    model.zero_grad()

    # Backprop on the positive class
    score = output[0, 1] if output.shape[1] > 1 else output[0, 0]
    score.backward()

    handle.remove()

    acts = activation_store.get('act')
    grads = activation_store.get('grad')

    if acts is None or grads is None:
        raise ValueError("Grad-CAM hooks did not capture gradients")

    # Compute weighted activation map
    weights = grads.detach().mean(dim=[2, 3], keepdim=True)
    cam     = (weights * acts.detach()).sum(dim=1).squeeze()
    cam     = torch.relu(cam).cpu().numpy()

    # Normalise
    cam -= cam.min()
    if cam.max() > 0:
        cam /= cam.max()

    # Resize to image size
    import cv2
    IMG_OUT = 224
    cam_r   = cv2.resize(cam, (IMG_OUT, IMG_OUT))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_r), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    # Blend with original
    orig = np.array(original_img.resize((IMG_OUT, IMG_OUT))).astype(np.float32)
    overlay = np.clip(0.55 * orig + 0.45 * heatmap.astype(np.float32), 0, 255).astype(np.uint8)

    buf = io.BytesIO()
    Image.fromarray(overlay).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ── Triage helper ──────────────────────────────────────────────────────────────
def compute_triage(prob: float, unc: float, settings: dict = None) -> dict:
    """
    4-tier triage matching frontend TRIAGE_CONFIG keys:
    URGENT | HIGH | REVIEW | NORMAL
    """
    t_urgent = float((settings or {}).get("threshold_urgent", 0.85))
    t_high   = float((settings or {}).get("threshold_high",   0.60))
    t_review = float((settings or {}).get("threshold_review", 0.15))

    if unc > t_review:
        tier = "REVIEW"
    elif prob >= t_urgent:
        tier = "URGENT"
    elif prob >= t_high:
        tier = "HIGH"
    elif prob >= 0.40:
        tier = "REVIEW"
    else:
        tier = "NORMAL"

    R = round(0.7 * prob + 0.3 * unc, 4)

    action = {
        "URGENT": "Revisión especialista inmediata requerida",
        "HIGH":   "Consulta oncológica prioritaria — 7 días",
        "REVIEW": "Revisión radiológica manual obligatoria",
        "NORMAL": "Seguimiento rutinario — sin acción inmediata",
    }[tier]

    return {"tier": tier, "risk_score": R, "action": action}


# ── Schemas ────────────────────────────────────────────────────────────────────
class InferenceRequest(BaseModel):
    image_base64: str
    mc_samples:   int  = 50

class HeatmapRequest(BaseModel):
    image_base64: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/predict")
async def predict(request: InferenceRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no cargado.")
    try:
        img    = decode_b64_image(request.image_base64)
        tensor = preprocess(img).unsqueeze(0).to(device)

        prob, unc = mc_dropout_inference(tensor, request.mc_samples)
        triage    = compute_triage(prob, unc)

        return {
            "success":     True,
            "probability": round(prob, 4),
            "uncertainty": round(unc,  4),
            "risk_score":  triage["risk_score"],
            "status":      triage["tier"],        # URGENT | HIGH | REVIEW | NORMAL
            "label":       "NODULE" if prob > 0.5 else "NORMAL",
            "action":      triage["action"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en inferencia: {str(e)}")


@app.post("/heatmap")
async def heatmap(request: HeatmapRequest):
    """
    Generate Grad-CAM activation heatmap.
    Returns base64 PNG with overlay.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no cargado.")
    try:
        img     = decode_b64_image(request.image_base64)
        tensor  = preprocess(img).unsqueeze(0).to(device)
        cam_b64 = generate_gradcam(tensor, img)
        return {"success": True, "heatmap_base64": cam_b64}
    except ImportError:
        raise HTTPException(status_code=503, detail="opencv-python no instalado — pip install opencv-python-headless")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM error: {str(e)}")


@app.get("/health")
def health():
    return {
        "status":       "online",
        "model_active": model is not None,
        "device":       str(device),
        "endpoints":    ["/predict", "/heatmap", "/health"],
    }


@app.get("/")
def root():
    return {
        "service": "Eagle Reaper OncoTriage API",
        "company": "F.A.S.C. Machine Learning Solutions S.A.S.",
        "model":   "ResNet-50 / EfficientNet-B4 + MC Dropout",
    }
