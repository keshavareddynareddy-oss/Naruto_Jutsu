import os
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import joblib
from app.core.hand_tracker import extract_landmarks

DATASET_PATH = "dataset/Pure Naruto Hand Sign Data/train"

# ── 1. Collect raw landmark features ─────────────────────────────────────────
X_raw = []
y_raw = []
skipped_images = 0

for label in os.listdir(DATASET_PATH):
    class_path = os.path.join(DATASET_PATH, label)

    if not os.path.isdir(class_path):
        continue

    for img_name in os.listdir(class_path):
        img_path = os.path.join(class_path, img_name)
        img = cv2.imread(img_path)

        if img is None:
            skipped_images += 1
            continue

        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        landmarks = extract_landmarks(rgb_img)

        if landmarks is None:
            skipped_images += 1
            continue

        X_raw.append(landmarks)
        y_raw.append(label)

print(f"Total real samples   : {len(X_raw)}")
print(f"Skipped images       : {skipped_images}")
print(f"Detected classes     : {len(set(y_raw))}")

# ── 2. Augment to bridge train/webcam distribution gap ───────────────────────
# FIX: Increased AUGMENT_COPIES from 3 → 6 so minority sign classes have
# enough examples to generalise. NOISE_SIGMA kept small to preserve geometry.
# Added a second augmentation pass with slightly larger sigma to simulate
# real-world variation (lighting, distance, slight angle changes).
AUGMENT_COPIES = 6
NOISE_SIGMA_SMALL = 0.012   # fine jitter — mimics tracking noise
NOISE_SIGMA_LARGE = 0.025   # coarser — mimics real webcam variance

X_aug = list(X_raw)
y_aug = list(y_raw)

rng = np.random.default_rng(42)

for features, label in zip(X_raw, y_raw):
    arr = np.array(features, dtype=np.float32)
    for i in range(AUGMENT_COPIES):
        # Alternate between fine and coarser noise on each copy.
        sigma = NOISE_SIGMA_SMALL if i % 2 == 0 else NOISE_SIGMA_LARGE
        noise = rng.normal(0.0, sigma, size=arr.shape).astype(np.float32)
        X_aug.append((arr + noise).tolist())
        y_aug.append(label)

X = np.array(X_aug, dtype=np.float32)
y = np.array(y_aug)

print(f"Total after augment  : {len(X)}")

# ── 3. Encode labels ──────────────────────────────────────────────────────────
le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded,
)

# ── 4. Build MLP pipeline ─────────────────────────────────────────────────────
# FIX: Added a third hidden layer (128) and increased max_iter to 800.
# alpha (L2 regularisation) reduced overfitting — critical when dataset is
# small and augmented.  learning_rate_init tuned for faster, stable convergence.
# n_iter_no_change raised from 20 → 30 so early-stopping doesn't fire too soon.
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("mlp", MLPClassifier(
        hidden_layer_sizes=(512, 256, 128),
        activation="relu",
        solver="adam",
        alpha=0.001,               # FIX: L2 regularisation to combat overfitting
        learning_rate="adaptive",  # FIX: reduces LR when loss plateaus
        learning_rate_init=0.001,
        max_iter=800,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=30,       # FIX: was 20 — gives more room to converge
        verbose=True,
    )),
])

print("Training MLP …")
pipeline.fit(X_train, y_train)

accuracy = pipeline.score(X_test, y_test)
print(f"\nTest accuracy        : {accuracy:.4f}")

# FIX: Print per-class report so under-performing signs are visible.
y_pred = pipeline.predict(X_test)
print("\nPer-class report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ── 5. Save model ─────────────────────────────────────────────────────────────
os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, "models/seal_model.pkl")
joblib.dump(le, "models/label_encoder.pkl")

print("\nModel saved successfully!")