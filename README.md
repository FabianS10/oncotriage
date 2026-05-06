# 🦅 Reaper Eagle — OncoTriage

> **Uncertainty-aware lung imaging triage accelerated for AMD MI300X.**  
> Built by **Reaper Eagle Technologies** — formerly **F.A.S.C. Machine Learning Solutions S.A.S.**

<p align="center">
  <img src="assets/ReaperEagle.png" width="180" alt="Reaper Eagle Technologies Logo"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python" />
  <img src="https://img.shields.io/badge/PyTorch-ROCm-orange?logo=pytorch" />
  <img src="https://img.shields.io/badge/AMD-Instinct%20MI300X-red?logo=amd" />
  <img src="https://img.shields.io/badge/FastAPI-green?logo=fastapi" />
  <img src="https://img.shields.io/badge/React-blue?logo=react" />
  <img src="https://img.shields.io/badge/Status-Hackathon%20Demo-gold" />
</p>

---

## Overview

**OncoTriage** is a clinical decision-support and triage platform for lung imaging workflows. It analyzes medical images, estimates predictive confidence, highlights regions of interest, and routes cases into a prioritized human-review queue.

The system is designed around one principle:

> **Medical AI should not only make predictions. It should expose uncertainty, support review, and help clinicians decide what needs attention first.**

OncoTriage is not an autonomous diagnostic replacement for clinicians. It is a triage and prioritization layer built to support faster review of urgent or uncertain cases.

---

## Core Capabilities

| Capability | Description |
|---|---|
| Lung imaging triage | Prioritizes cases by estimated risk and review urgency |
| Uncertainty-aware inference | Surfaces confidence and uncertainty instead of returning only a binary label |
| Visual localization | Provides heatmap-style interpretability to support human inspection |
| Human-review workflow | Routes cases into clinically meaningful priority tiers |
| Batch processing | Designed for queue-level processing rather than one-image-only workflows |
| Report export | Generates review-ready case summaries for documentation |
| AMD-oriented deployment | Built with ROCm-compatible acceleration in mind |

---

## Why OncoTriage Is Different

Many medical AI demos stop at image upload and report generation. OncoTriage focuses on the operational problem behind clinical imaging:

- Which cases should be reviewed first?
- Which predictions are uncertain?
- Which scans should not be silently treated as normal?
- Can the system support a queue, not just a single image?
- Can the model output be inspected by a human reviewer?

> **Reports are outputs. Triage is an operational system.**

---

## Product Philosophy

OncoTriage is built around four outputs for every analyzed case:

1. **Risk estimate** — model-estimated probability of clinically relevant abnormality.
2. **Uncertainty signal** — confidence stability indicator for safer review routing.
3. **Visual evidence** — heatmap-style localization for human inspection.
4. **Workflow action** — priority tier assignment for queue management.

This design reduces black-box behavior by giving clinicians more than a raw prediction.

---

## High-Level Workflow

```text
Medical image batch
        ↓
Preprocessing
        ↓
Computer-vision inference
        ↓
Uncertainty estimation
        ↓
Visual localization
        ↓
Priority tier assignment
        ↓
Risk-ranked clinical queue
        ↓
Human review / report export
```

---

## System Architecture

OncoTriage uses a full-stack architecture:

| Layer | Technology |
|---|---|
| Inference backend | Python, PyTorch, FastAPI |
| Acceleration target | AMD Instinct MI300X through ROCm-compatible deployment |
| Frontend | React dashboard |
| Desktop shell | Electron, optional local deployment mode |
| Reporting | HTML/PDF case-summary generation |
| Deployment | Docker-based service packaging |

A more detailed engineering blueprint is available privately for technical review, partner evaluation, or investor diligence.

---

## Model Lineage

OncoTriage builds on prior clinical AI work from Reaper Eagle Technologies.

| System | Role |
|---|---|
| CDSS Pneumonia | Clinical decision-support system for pneumonia-oriented chest imaging workflows |
| OncoTriage | Next-generation uncertainty-aware lung imaging triage platform |

The system evolved from single-case decision support into queue-level triage operations with uncertainty, interpretability, and high-throughput deployment as first-class design goals.

---

## AMD MI300X Relevance

OncoTriage is designed to benefit from accelerator-class infrastructure because uncertainty-aware batch inference is compute-intensive.

The AMD MI300X deployment path focuses on:

- High-throughput image batch processing
- ROCm-compatible PyTorch inference
- Mixed-precision acceleration where appropriate
- Large-memory queue-level workloads
- Operational monitoring for latency and system health

The public demo highlights batch triage performance and workflow behavior. Internal benchmark details are available under controlled review.

---

## Demo Highlights

The hackathon demo shows:

- Batch lung imaging analysis
- Risk and uncertainty output
- Heatmap-style localization
- Case priority assignment
- Risk-ranked review queue
- Report/export workflow
- AMD-oriented deployment configuration

---

## Clinical Safety Positioning

OncoTriage is intended for **decision support and prioritization**, not autonomous diagnosis.

The system is designed to:

- Assist human reviewers
- Prioritize urgent or uncertain cases
- Surface cases that should not be ignored
- Provide interpretable visual support
- Preserve clinical responsibility with licensed professionals

---

## Privacy and Data Handling

Recommended deployment principles:

- Use anonymized or de-identified images for demos and testing.
- Do not commit patient data to the repository.
- Store model weights and sensitive configuration outside public version control.
- Use authentication before public deployment.
- Log operational metadata without unnecessary personally identifiable information.

---

## Repository Structure

```text
OncoTriage/
├── backend/        # FastAPI inference and service layer
├── frontend/       # React clinical dashboard
├── electron/       # Optional desktop shell
├── assets/         # Public images, logos, screenshots
├── docs/           # Public-facing documentation
├── docker/         # Deployment templates
└── README.md
```

Implementation details, model internals, benchmark configuration, and proprietary tuning logic are intentionally kept outside the public README.

---

## Public API Surface

The public demo exposes a minimal service surface:

| Endpoint | Purpose |
|---|---|
| Health check | Confirms service availability |
| Prediction request | Runs image triage inference |
| Heatmap request | Generates visual localization when enabled |
| Configuration view | Shows safe public runtime settings |

Private deployments may include additional monitoring, audit, queue-management, and administrative endpoints.

---

## Deployment

The project can be deployed as:

| Component | Suggested platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway, Render, or Docker-compatible host |
| AMD deployment path | ROCm Docker container on AMD GPU infrastructure |
| Technical walkthrough | YouTube or similar video platform |

The public demo may run in CPU/demo mode depending on hosting constraints. AMD MI300X deployment is supported through the documented ROCm/Docker path for accelerated batch inference and uncertainty-aware triage.

---

## Evaluation Approach

OncoTriage separates three kinds of evaluation:

| Evaluation type | Purpose |
|---|---|
| Model evaluation | Measures classification and calibration behavior |
| System evaluation | Measures latency, throughput, and queue performance |
| Robustness checks | Tests behavior on independent anonymized examples |

Public materials may include summarized metrics. Full validation tables, confidence intervals, dataset methodology, and internal benchmark notebooks are retained for controlled technical review.

---

## Roadmap

| Area | Direction |
|---|---|
| Clinical workflow | More refined review states and audit trails |
| Imaging support | Stronger DICOM/PACS-oriented integration path |
| Validation | Expanded external testing and prospective evaluation |
| Deployment | Hardened AMD ROCm deployment profiles |
| Reporting | More configurable clinical report templates |
| Governance | Stronger safety, privacy, and compliance controls |

---

## Access and Technical Review

For collaboration, technical diligence, or partnership review, contact **Reaper Eagle Technologies**.

The public repository is intended to demonstrate product direction, system architecture, and demo functionality without exposing proprietary model weights, threshold tuning, internal benchmark scripts, private datasets, or deployment secrets.

---

## License

Copyright © Reaper Eagle Technologies.

Public demo materials may be released under a permissive or source-available license depending on the repository version. Proprietary model weights, tuning logic, benchmark scripts, and private deployment assets are not included unless explicitly stated.

---

<p align="center">
  <strong>Inteligencia. Incertidumbre. Impacto.</strong><br/>
  <em>Built by Fabián Andres Sabogal Ceballos for the AMD MI300X AI Challenge</em>
</p>
