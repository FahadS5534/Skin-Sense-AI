# SkinSense AI — Machine Learning Architecture & Weights

## Model Acquisition & Verification
The acne and skin problem detector utilizes a verified pretrained YOLO object detection model packaged in ONNX format:
- **Repository:** Hugging Face `zikabyte/skin-problem-detection-demo`
- **Architecture:** Ultralytics YOLO Object Detector
- **Format:** `model.onnx` (Input: `[1, 3, 640, 640]` float32 tensor; Output: `[1, 300, 6]` detections)
- **Classes:**
  0. `Mole`
  1. `acne`
  2. `rosacea`
  3. `wrinkle`
- **License:** Open Academic / Research access
- **Local Cache Location:** `ml/weights/model.onnx`

## Verification & Metrics
From the test split evaluation manifest (`ml/weights/metrics_test.json`):
- Overall Precision: 55.23%
- Overall Recall: 53.08%
- mAP@50: 52.11%
- mAP@50-95: 28.97%
- Class-specific mAP@50-95:
  - Mole: 0.6638
  - Acne: 0.0989
  - Rosacea: 0.2436
  - Wrinkle: 0.1525

## Automated Weight Acquisition
Weights are downloaded automatically via `huggingface_hub.hf_hub_download` upon first initialization if missing from `ml/weights/`, and cached permanently to prevent redundant downloads.
If weights cannot be acquired due to network limitations, the backend cleanly transitions to `status: "model_unavailable"`, continuing to compute CIE Lab color indicators and dynamically renormalizing the Visual Concern Index.
