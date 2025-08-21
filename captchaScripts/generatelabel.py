import matplotlib.pyplot as plt
import csv
import os

folder = "captchaScripts/captchas"
os.makedirs(folder, exist_ok=True)
file_count = 100
filenames = [os.path.join(folder, f"{i}.png") for i in range(file_count)]
labels = []

for f in filenames:
    if os.path.exists(f):
        img = plt.imread(f)
        plt.imshow(img, cmap='gray')
        plt.axis('off')
        plt.title(f)
        plt.show(block=False)
        chars = input(f"Type characters (left to right) for {f}: ")
        plt.close()
        entry = [os.path.basename(f)] + list(chars.replace(' ', ''))
        labels.append(entry)

with open(os.path.join(folder, "labels.csv"), "w", newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerows(labels)
