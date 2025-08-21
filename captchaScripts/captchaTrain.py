import os
import json
import numpy as np
from tensorflow.keras import layers, models
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.model_selection import train_test_split

# === CONFIG ===
CAPTCHA_FOLDER = "captchas"
LABELS_FILE = "labels.json"  # Example: {"captcha_0.png": "AB12C", ...}
IMG_WIDTH = 110
IMG_HEIGHT = 36
CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
MAX_LENGTH = 5  # Assuming all captchas are 5 chars

# === LOAD LABELS ===
with open(LABELS_FILE, "r") as f:
    labels_data = json.load(f)

# Map chars to numbers
char_to_num = {ch: i for i, ch in enumerate(CHARSET)}
num_to_char = {i: ch for ch, i in char_to_num.items()}

def text_to_vec(text):
    vec = np.zeros((MAX_LENGTH, len(CHARSET)), dtype=np.uint8)
    for i, ch in enumerate(text):
        vec[i, char_to_num[ch]] = 1
    return vec

# === LOAD IMAGES ===
images = []
labels = []

for file_name in os.listdir(CAPTCHA_FOLDER):
    if file_name.endswith(".png"):
        path = os.path.join(CAPTCHA_FOLDER, file_name)
        img = load_img(path, target_size=(IMG_HEIGHT, IMG_WIDTH), color_mode="grayscale")
        img_array = img_to_array(img) / 255.0
        images.append(img_array)
        labels.append(text_to_vec(labels_data[file_name]))

images = np.array(images)
labels = np.array(labels)

# Split into train/test
X_train, X_test, y_train, y_test = train_test_split(images, labels, test_size=0.1, random_state=42)

# === BUILD MODEL ===
input_layer = layers.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 1))
x = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(input_layer)
x = layers.MaxPooling2D((2, 2))(x)
x = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(x)
x = layers.MaxPooling2D((2, 2))(x)
x = layers.Flatten()(x)
x = layers.Dense(128, activation='relu')(x)

# Output for each character
outputs = [layers.Dense(len(CHARSET), activation='softmax', name=f"char_{i}")(x) for i in range(MAX_LENGTH)]

model = models.Model(inputs=input_layer, outputs=outputs)
model.compile(
    loss='categorical_crossentropy',
    optimizer='adam',
    metrics=['accuracy']
)

# Split y_train into separate outputs
y_train_split = [y_train[:, i, :] for i in range(MAX_LENGTH)]
y_test_split = [y_test[:, i, :] for i in range(MAX_LENGTH)]

# === TRAIN ===
model.fit(
    X_train, y_train_split,
    validation_data=(X_test, y_test_split),
    epochs=30,
    batch_size=32
)

# Save model
model.save("captcha_model.h5")
print("✅ Model saved to captcha_model.h5")
