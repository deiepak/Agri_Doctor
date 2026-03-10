"""
Train disease classification models for the Plant Disease Identifier.

Optimized for Apple M4 Mac Mini (24GB RAM) with Metal GPU acceleration.

Models trained:
1. tomato_common.h5 - 5 classes (Early Blight, Late Blight, Septoria, TYLCV, Healthy)
2. tomato_uncommon.h5 - 5 classes (Leaf Mold, Spider Mites, Target Spot, Bacterial Spot, Mosaic Virus)
3. potato_all.h5 - 3 classes (Early Blight, Late Blight, Healthy)

Uses MobileNetV2 with transfer learning from ImageNet.

Usage:
    source venv_mac/bin/activate
    python train_models.py
"""

import os
import ssl
import json
import certifi
from pathlib import Path

# Fix SSL certificates for macOS Python (needed to download ImageNet weights)
os.environ['SSL_CERT_FILE'] = certifi.where()
ssl._create_default_https_context = ssl._create_unverified_context

import tensorflow as tf
from tensorflow import keras

# ─── M4 Optimization: Enable Metal GPU ──────────────────────────────────────

print("🔧 Configuring for Apple M4...")

# Enable Metal GPU acceleration
physical_devices = tf.config.list_physical_devices()
print(f"   Available devices: {[d.device_type for d in physical_devices]}")

gpu_devices = tf.config.list_physical_devices('GPU')
if gpu_devices:
    print(f"   ✅ Metal GPU detected: {gpu_devices}")
    for gpu in gpu_devices:
        tf.config.experimental.set_memory_growth(gpu, True)
else:
    print("   ⚠️  No GPU found, using CPU (still fast on M4)")

# Enable mixed precision for faster M4 training
tf.keras.mixed_precision.set_global_policy('mixed_float16')
print("   ✅ Mixed precision (float16) enabled for M4 acceleration")

# ─── Configuration (Optimized for M4 24GB RAM) ──────────────────────────────

# Dataset is at project root, not inside backend/
PROJECT_ROOT = Path(__file__).parent.parent
DATASET_BASE = PROJECT_ROOT / "archive" / "New Plant Diseases Dataset(Augmented)" / "New Plant Diseases Dataset(Augmented)"
TRAIN_DIR = DATASET_BASE / "train"
VALID_DIR = DATASET_BASE / "valid"
MODEL_OUTPUT_DIR = Path(__file__).parent / "app" / "models"

# M4 optimized settings (24GB RAM can handle larger batches)
IMG_SIZE = (224, 224)       # MobileNetV2 optimal input size
BATCH_SIZE = 64             # Larger batch for M4's 24GB RAM
EPOCHS = 200                # Maximum epochs for best convergence
LEARNING_RATE = 0.001
FINE_TUNE_EPOCHS = 50       # Extended fine-tuning for peak accuracy
FINE_TUNE_LR = 0.00005      # Lower LR for fine-tuning stability
FINE_TUNE_LAYERS = 50       # Unfreeze more layers for deeper fine-tuning

# ─── Model Definitions ──────────────────────────────────────────────────────

MODELS_CONFIG = {
    "tomato_common": {
        "classes": {
            "Tomato___Early_blight": "early_blight",
            "Tomato___Late_blight": "late_blight",
            "Tomato___Septoria_leaf_spot": "septoria_leaf_spot",
            "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "leaf_curl_virus",
            "Tomato___healthy": "healthy",
        },
        "plant_type": "tomato",
        "tier": "common",
    },
    "tomato_uncommon": {
        "classes": {
            "Tomato___Leaf_Mold": "leaf_mold",
            "Tomato___Spider_mites Two-spotted_spider_mite": "spider_mites",
            "Tomato___Target_Spot": "target_spot",
            "Tomato___Bacterial_spot": "bacterial_spot",
            "Tomato___Tomato_mosaic_virus": "mosaic_virus",
        },
        "plant_type": "tomato",
        "tier": "uncommon",
    },
    "potato_all": {
        "classes": {
            "Potato___Early_blight": "potato_early_blight",
            "Potato___Late_blight": "potato_late_blight",
            "Potato___healthy": "healthy",
        },
        "plant_type": "potato",
        "tier": "common",
    },
}


def create_dataset(data_dir: Path, class_folders: list[str], batch_size: int = BATCH_SIZE):
    """Create a tf.data.Dataset from specific class folders."""

    image_paths = []
    labels = []

    for idx, folder_name in enumerate(class_folders):
        folder_path = data_dir / folder_name
        if not folder_path.exists():
            print(f"  ⚠️  Folder not found: {folder_path}")
            continue

        files = list(folder_path.glob("*"))
        image_files = [f for f in files if f.suffix.lower() in ('.jpg', '.jpeg', '.png')]
        print(f"  📂 {folder_name}: {len(image_files)} images → label {idx}")
        image_paths.extend([str(f) for f in image_files])
        labels.extend([idx] * len(image_files))

    if not image_paths:
        raise ValueError("No images found!")

    # Create tf.data.Dataset
    path_ds = tf.data.Dataset.from_tensor_slices((image_paths, labels))
    path_ds = path_ds.shuffle(len(image_paths), seed=42)

    def load_and_preprocess(path, label):
        img = tf.io.read_file(path)
        img = tf.image.decode_jpeg(img, channels=3)
        img = tf.image.resize(img, IMG_SIZE)
        img = tf.cast(img, tf.float32) / 255.0
        return img, label

    dataset = path_ds.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    return dataset, len(image_paths)


def build_model(num_classes: int) -> tuple:
    """Build MobileNetV2 transfer learning model optimized for M4."""

    base_model = keras.applications.MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # Freeze base model initially

    model = keras.Sequential([
        base_model,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(256, activation="relu"),      # Larger dense layer
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(128, activation="relu"),
        keras.layers.Dropout(0.2),
        # float32 output for numerical stability with mixed precision
        keras.layers.Dense(num_classes, activation="softmax", dtype="float32"),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model, base_model


def train_single_model(model_name: str, config: dict):
    """Train a single model with full M4 optimization."""

    print(f"\n{'='*60}")
    print(f"🌱 Training: {model_name}")
    print(f"{'='*60}")

    class_folders = list(config["classes"].keys())
    disease_ids = list(config["classes"].values())
    num_classes = len(class_folders)

    print(f"\n📋 Classes ({num_classes}):")
    for folder, disease_id in zip(class_folders, disease_ids):
        print(f"   {disease_id} ← {folder}")

    # Create datasets
    print(f"\n📁 Loading training data...")
    train_ds, train_count = create_dataset(TRAIN_DIR, class_folders)
    print(f"   Total training images: {train_count}")

    print(f"\n📁 Loading validation data...")
    valid_ds, valid_count = create_dataset(VALID_DIR, class_folders)
    print(f"   Total validation images: {valid_count}")

    # Build model
    print(f"\n🏗️  Building MobileNetV2 model...")
    model, base_model = build_model(num_classes)
    model.summary()

    # Aggressive data augmentation for better generalization
    data_augmentation = keras.Sequential([
        keras.layers.RandomFlip("horizontal"),
        keras.layers.RandomFlip("vertical"),
        keras.layers.RandomRotation(0.3),           # ±30° rotation
        keras.layers.RandomZoom((-0.2, 0.2)),        # 20% zoom in/out
        keras.layers.RandomBrightness(0.15),         # brightness variation
        keras.layers.RandomContrast(0.15),           # contrast variation
        keras.layers.RandomTranslation(0.1, 0.1),   # 10% shift
    ])

    def augment(image, label):
        image = data_augmentation(image, training=True)
        return image, label

    train_ds_aug = train_ds.map(augment, num_parallel_calls=tf.data.AUTOTUNE)

    # Callbacks
    early_stopping = keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=5,          # More patience for better convergence
        restore_best_weights=True,
        verbose=1,
    )

    reduce_lr = keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1,
    )

    # ─── Phase 1: Train top layers only ──────────────────────────────────
    print(f"\n🚀 Phase 1: Training top layers ({EPOCHS} epochs, batch={BATCH_SIZE})...")
    history1 = model.fit(
        train_ds_aug,
        validation_data=valid_ds,
        epochs=EPOCHS,
        callbacks=[early_stopping, reduce_lr],
        verbose=1,
    )

    phase1_acc = max(history1.history['val_accuracy'])
    print(f"\n   Phase 1 best val accuracy: {phase1_acc * 100:.1f}%")

    # ─── Phase 2: Fine-tune deeper layers ────────────────────────────────
    print(f"\n🔧 Phase 2: Fine-tuning last {FINE_TUNE_LAYERS} layers ({FINE_TUNE_EPOCHS} epochs)...")
    base_model.trainable = True
    # Freeze all layers except the last FINE_TUNE_LAYERS
    for layer in base_model.layers[:-FINE_TUNE_LAYERS]:
        layer.trainable = False

    trainable_count = sum(1 for layer in base_model.layers if layer.trainable)
    total_count = len(base_model.layers)
    print(f"   Trainable base layers: {trainable_count}/{total_count}")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=FINE_TUNE_LR),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    # Reset early stopping for phase 2
    early_stopping_ft = keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=4,
        restore_best_weights=True,
        verbose=1,
    )

    reduce_lr_ft = keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.3,
        patience=2,
        min_lr=1e-8,
        verbose=1,
    )

    history2 = model.fit(
        train_ds_aug,
        validation_data=valid_ds,
        epochs=FINE_TUNE_EPOCHS,
        callbacks=[early_stopping_ft, reduce_lr_ft],
        verbose=1,
    )

    phase2_acc = max(history2.history['val_accuracy'])
    print(f"\n   Phase 2 best val accuracy: {phase2_acc * 100:.1f}%")

    # ─── Final Evaluation ────────────────────────────────────────────────
    print(f"\n📊 Final evaluation on validation set...")
    loss, accuracy = model.evaluate(valid_ds, verbose=1)
    print(f"   ✅ Final Accuracy: {accuracy * 100:.1f}%")
    print(f"   📉 Final Loss: {loss:.4f}")

    # Save model
    model_path = MODEL_OUTPUT_DIR / f"{model_name}.h5"
    model.save(str(model_path))
    file_size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"\n💾 Model saved: {model_path} ({file_size_mb:.1f} MB)")

    return {
        "model_file": f"{model_name}.h5",
        "plant_type": config["plant_type"],
        "tier": config["tier"],
        "num_classes": num_classes,
        "class_labels": disease_ids,
        "class_folders": class_folders,
        "accuracy": float(accuracy),
        "loss": float(loss),
        "phase1_best_accuracy": float(phase1_acc),
        "phase2_best_accuracy": float(phase2_acc),
        "training_config": {
            "img_size": list(IMG_SIZE),
            "batch_size": BATCH_SIZE,
            "epochs": EPOCHS,
            "fine_tune_epochs": FINE_TUNE_EPOCHS,
            "fine_tune_layers": FINE_TUNE_LAYERS,
            "mixed_precision": True,
        },
    }


def main():
    print("\n" + "=" * 60)
    print("🌱 Plant Disease Model Training Pipeline")
    print("   Optimized for Apple M4 Mac Mini (24GB RAM)")
    print("=" * 60)
    print(f"   TensorFlow version: {tf.__version__}")
    print(f"   Dataset: {DATASET_BASE}")
    print(f"   Output: {MODEL_OUTPUT_DIR}")
    print(f"   Image size: {IMG_SIZE}")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Epochs: {EPOCHS} + {FINE_TUNE_EPOCHS} fine-tune")
    print(f"   Mixed precision: float16")

    # Check dataset exists
    if not TRAIN_DIR.exists():
        print(f"\n❌ Training directory not found: {TRAIN_DIR}")
        print(f"   Expected at: {TRAIN_DIR}")
        # Try to find it
        alt_path = Path(__file__).parent / "archive"
        if alt_path.exists():
            print(f"   'archive' folder found at: {alt_path}")
        alt_path2 = Path(__file__).parent.parent / "archive"
        if alt_path2.exists():
            print(f"   'archive' folder found at: {alt_path2}")
        return

    # Create output directory
    MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Train all models
    results = {}
    for model_name, config in MODELS_CONFIG.items():
        result = train_single_model(model_name, config)
        results[model_name] = result

    # Save model config
    config_path = MODEL_OUTPUT_DIR / "model_config.json"
    with open(config_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n📋 Model config saved: {config_path}")

    # ─── Final Summary ───────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("✅ All Training Complete!")
    print(f"{'='*60}")
    print(f"\n{'Model':<25} {'Accuracy':>10} {'Classes':>10}")
    print(f"{'-'*45}")
    for name, result in results.items():
        print(f"   {name:<22} {result['accuracy']*100:>7.1f}%  {result['num_classes']:>7}")

    total_size = sum(
        (MODEL_OUTPUT_DIR / r["model_file"]).stat().st_size
        for r in results.values()
    ) / (1024 * 1024)
    print(f"\n   Total model size: {total_size:.1f} MB")
    print(f"   Models saved to: {MODEL_OUTPUT_DIR}")
    print("\n   You can now start the backend server to use these models.")


if __name__ == "__main__":
    main()
