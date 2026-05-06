# predict.py
import sys
import json
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import transforms
from model import OncoTriageModel

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_engine(model_path: str = "oncotriage_model.pth") -> OncoTriageModel:
    model = OncoTriageModel().to(device)
    state_dict = torch.load(model_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    return model

def activate_mc_dropout(model: nn.Module):
    model.train()
    for m in model.modules():
        if isinstance(m, (nn.BatchNorm1d, nn.BatchNorm2d)):
            m.eval()

GLOBAL_MODEL = load_engine()

def get_prediction(image_path: str, n_samples: int = 50) -> dict:
    
    activate_mc_dropout(GLOBAL_MODEL)

    transform = transforms.Compose([
        transforms.Resize((384, 384)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    probs = []
    with torch.no_grad():
        for _ in range(n_samples):
            output = GLOBAL_MODEL(tensor)
            prob = torch.softmax(output, dim=1)[0][1].item()
            probs.append(prob)

    GLOBAL_MODEL.eval()
    mean_prob = float(np.mean(probs))
    uncertainty = float(np.std(probs))

    result = {
        "probability": round(mean_prob, 4),
        "uncertainty": round(uncertainty, 4),
        "label": "NODULE" if mean_prob > 0.5 else "NORMAL",
        "device": str(device),
    }

    print(json.dumps(result))
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        n_samples = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        get_prediction(img_path, n_samples)
    else:
        print(json.dumps({"error": "No image path provided"}))
