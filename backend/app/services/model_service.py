"""
Model Service - Handles loading and running trained disease classification models.

Implements a 3-tier cascade:
  Tier 1: Common diseases model (high confidence threshold)
  Tier 2: Uncommon diseases model (lower confidence threshold)
  Tier 3: OpenAI Vision API (fallback for edge cases / unsupported plants)
"""

import json
import base64
import io
import numpy as np
from pathlib import Path
from typing import Optional

# Lazy imports - TensorFlow is heavy, only load when needed
_tf = None
_models_cache: dict = {}
_model_config: Optional[dict] = None

MODEL_DIR = Path(__file__).parent.parent / "models"
CONFIG_FILE = MODEL_DIR / "model_config.json"


def _get_tf():
    """Lazy-load TensorFlow to avoid slow startup when not needed."""
    global _tf
    if _tf is None:
        import tensorflow as tf
        _tf = tf
    return _tf


def _load_model_config() -> dict:
    """Load model configuration from model_config.json."""
    global _model_config
    if _model_config is None:
        if not CONFIG_FILE.exists():
            print(f"[MODEL SERVICE] ⚠️  No model config found at {CONFIG_FILE}")
            _model_config = {}
        else:
            with open(CONFIG_FILE, "r") as f:
                _model_config = json.load(f)
            print(f"[MODEL SERVICE] ✅ Loaded config for {len(_model_config)} models")
    return _model_config


def _load_model(model_name: str):
    """Load a trained Keras model from disk (cached)."""
    if model_name in _models_cache:
        return _models_cache[model_name]

    tf = _get_tf()
    model_path = MODEL_DIR / f"{model_name}.h5"

    if not model_path.exists():
        print(f"[MODEL SERVICE] ⚠️  Model file not found: {model_path}")
        return None

    print(f"[MODEL SERVICE] 📦 Loading model: {model_name}...")
    model = tf.keras.models.load_model(str(model_path))
    _models_cache[model_name] = model
    print(f"[MODEL SERVICE] ✅ Model loaded: {model_name}")
    return model


def _preprocess_image(image_base64: str) -> np.ndarray:
    """Decode and preprocess a base64 image for model input."""
    from PIL import Image

    # Remove data URL prefix if present
    if image_base64.startswith('data:'):
        image_base64 = image_base64.split(',')[1]

    # Decode base64 to image
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB (handle RGBA, grayscale, etc.)
    image = image.convert("RGB")

    # Resize to 224x224 (MobileNetV2 input size)
    image = image.resize((224, 224), Image.Resampling.LANCZOS)

    # Convert to numpy array and normalize to [0, 1]
    img_array = np.array(image, dtype=np.float32) / 255.0

    # Add batch dimension: (224, 224, 3) → (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


def _get_model_names_for_plant(plant_type: str) -> dict[str, str]:
    """Get model names for a given plant type, grouped by tier."""
    config = _load_model_config()

    result = {"common": None, "uncommon": None}

    for model_name, model_info in config.items():
        if model_info["plant_type"] == plant_type:
            tier = model_info["tier"]
            result[tier] = model_name

    return result


def predict_with_model(
    image_base64: str,
    model_name: str,
) -> Optional[list[dict]]:
    """
    Run prediction using a specific trained model.

    Returns:
        List of predictions [{disease, diseaseId, confidence}] or None if model unavailable.
    """
    config = _load_model_config()

    if model_name not in config:
        return None

    model = _load_model(model_name)
    if model is None:
        return None

    model_info = config[model_name]
    class_labels = model_info["class_labels"]

    # Preprocess image
    img_array = _preprocess_image(image_base64)

    # Run prediction
    predictions = model.predict(img_array, verbose=0)
    probabilities = predictions[0]

    # Build results sorted by confidence
    results = []
    for idx, (label, prob) in enumerate(zip(class_labels, probabilities)):
        confidence = int(round(float(prob) * 100))
        disease_name = label.replace("_", " ").title()
        results.append({
            "disease": disease_name,
            "diseaseId": label,
            "confidence": confidence,
        })

    # Sort by confidence descending
    results.sort(key=lambda x: x["confidence"], reverse=True)

    return results


def run_cascade(
    image_base64: str,
    plant_type: str,
    common_threshold: int = 80,
    uncommon_threshold: int = 70,
) -> dict:
    """
    Run the 3-tier cascade for disease prediction.

    Tier 1: Common diseases model → if top confidence ≥ common_threshold → return
    Tier 2: Uncommon diseases model → merge → if top ≥ uncommon_threshold → return
    Tier 3: Return None (caller should fall back to OpenAI)

    Returns:
        {
            "predictions": [...],
            "tier": "common" | "uncommon" | None,
            "notes": "..."
        }
    """
    model_names = _get_model_names_for_plant(plant_type)
    common_preds = []

    # ─── Tier 1: Common diseases ─────────────────────────────────────────
    if model_names["common"]:
        print(f"[CASCADE] 🔍 Tier 1: Running common model for {plant_type}...")
        common_preds = predict_with_model(image_base64, model_names["common"])

        if common_preds:
            top_confidence = common_preds[0]["confidence"]
            top_disease = common_preds[0]["disease"]
            print(f"[CASCADE]    Top: {top_disease} ({top_confidence}%)")

            if top_confidence >= common_threshold:
                print(f"[CASCADE] ✅ Tier 1 hit! {top_disease} at {top_confidence}%")
                return {
                    "predictions": common_preds[:3],  # Top 3
                    "tier": "common",
                    "notes": f"Identified by local AI model (common diseases). Top match: {top_disease} with {top_confidence}% confidence.",
                }

    # ─── Tier 2: Uncommon diseases ───────────────────────────────────────
    if model_names["uncommon"]:
        print(f"[CASCADE] 🔍 Tier 2: Running uncommon model for {plant_type}...")
        uncommon_preds = predict_with_model(image_base64, model_names["uncommon"])

        if uncommon_preds:
            # Merge predictions from both tiers
            all_preds = (common_preds or []) + uncommon_preds
            all_preds.sort(key=lambda x: x["confidence"], reverse=True)

            top_confidence = all_preds[0]["confidence"]
            top_disease = all_preds[0]["disease"]
            print(f"[CASCADE]    Top (merged): {top_disease} ({top_confidence}%)")

            if top_confidence >= uncommon_threshold:
                print(f"[CASCADE] ✅ Tier 2 hit! {top_disease} at {top_confidence}%")
                return {
                    "predictions": all_preds[:3],
                    "tier": "uncommon",
                    "notes": f"Identified by local AI model (extended analysis). Top match: {top_disease} with {top_confidence}% confidence.",
                }

    # ─── Tier 3: No local model match → caller should use OpenAI ────────
    print(f"[CASCADE] 🌐 No confident local match for {plant_type}. Falling back to OpenAI.")

    # Return any local predictions we have (for context), but signal tier=None
    all_local_preds = []
    if model_names["common"]:
        preds = predict_with_model(image_base64, model_names["common"])
        if preds:
            all_local_preds.extend(preds)
    if model_names["uncommon"]:
        preds = predict_with_model(image_base64, model_names["uncommon"])
        if preds:
            all_local_preds.extend(preds)

    if all_local_preds:
        all_local_preds.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "predictions": all_local_preds[:3] if all_local_preds else [],
        "tier": None,
        "notes": "Local models were not confident enough. Cloud AI analysis recommended.",
    }


def has_models_for_plant(plant_type: str) -> bool:
    """Check if any trained models exist for the given plant type."""
    model_names = _get_model_names_for_plant(plant_type)
    return model_names["common"] is not None or model_names["uncommon"] is not None


def get_available_plants() -> list[str]:
    """Get list of plant types that have trained models."""
    config = _load_model_config()
    plants = set()
    for model_info in config.values():
        plants.add(model_info["plant_type"])
    return list(plants)
