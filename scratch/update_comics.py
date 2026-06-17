import os
import shutil

src_root = "c:/Users/roadsea/Desktop/bori-1"
comic_root = os.path.join(src_root, "src/assets/learning-comic")
raw_root = os.path.join(src_root, "학습만화")

def clear_dir(path):
    if os.path.exists(path):
        for f in os.listdir(path):
            if f.endswith(".png"):
                os.remove(os.path.join(path, f))
    else:
        os.makedirs(path, exist_ok=True)

# 1. Clear target directories
for i in range(1, 5):
    clear_dir(os.path.join(comic_root, f"chapter-{i}"))

# 2. Copy chapter-1: 도입부
shutil.copy2(
    os.path.join(raw_root, "보리도등론/도입부.png"),
    os.path.join(comic_root, "chapter-1/도입부.png")
)
print("Copied chapter-1/도입부.png")

# 3. Copy chapter-2: 1 ~ 68, 결어
for i in range(1, 69):
    shutil.copy2(
        os.path.join(raw_root, f"보리도등론/{i}.png"),
        os.path.join(comic_root, f"chapter-2/{i}.png")
    )
shutil.copy2(
    os.path.join(raw_root, "보리도등론/69.png"),
    os.path.join(comic_root, "chapter-2/결어.png")
)
print("Copied chapter-2/1.png ~ 68.png and 결어.png")

# 4. Copy chapter-3: 71 ~ 85
for i in range(71, 86):
    shutil.copy2(
        os.path.join(raw_root, f"난처석 1/{i}.png"),
        os.path.join(comic_root, f"chapter-3/{i}.png")
    )
print("Copied chapter-3/71.png ~ 85.png")

# 5. Copy chapter-4: 86 ~ 91
for i in range(86, 92):
    shutil.copy2(
        os.path.join(raw_root, f"난처석 1/{i}.png"),
        os.path.join(comic_root, f"chapter-4/{i}.png")
    )
print("Copied chapter-4/86.png ~ 91.png")
