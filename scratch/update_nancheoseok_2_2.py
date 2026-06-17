import re
import json
import os
import shutil

def get_commentary_key(verse_num):
    if 150 <= verse_num <= 156:
        local_idx = verse_num - 143 + 1
        return 11, f"11.{local_idx}"
    elif 157 <= verse_num <= 173:
        local_idx = verse_num - 157 + 1
        return 12, f"12.{local_idx}"
    elif 174 <= verse_num <= 216:
        local_idx = verse_num - 174 + 1
        return 13, f"13.{local_idx}"
    elif 217 <= verse_num <= 228:
        local_idx = verse_num - 217 + 1
        return 14, f"14.{local_idx}"
    return None, None

def parse_odt_text(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    commentary_data = {}
    verse_to_chapter = {}
    current_key = None
    current_content = []

    # 온라인/오프라인 모드 태그 제거용 정규식
    mode_pattern = re.compile(r'^\[(?:🟢|🔴)\s+(?:Online|Offline)\s+Mode\s+.*\]')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_key and current_content:
                current_content.append("")
            continue
        
        # 모드 표시 라인은 건너뜀
        if mode_pattern.match(stripped):
            continue

        # 150 ~ 228번 단락 시작 판정
        match = re.match(r'^(\d+)\.\s+', stripped)
        is_section_start = False
        next_key = None
        
        if match:
            verse_num = int(match.group(1))
            if 150 <= verse_num <= 228:
                ch_num, key = get_commentary_key(verse_num)
                if key:
                    is_section_start = True
                    next_key = key
                    verse_to_chapter[verse_num] = ch_num

        if is_section_start:
            # 이전 섹션 저장
            if current_key and current_content:
                commentary_data[current_key] = "\n".join(current_content).strip()
            current_key = next_key
            # Prevent duplication by adding heading symbol '#' and an empty line
            current_content = [f"# {stripped}", ""]
        else:
            if current_key:
                current_content.append(stripped)

    # 마지막 섹션 저장
    if current_key and current_content:
        commentary_data[current_key] = "\n".join(current_content).strip()

    return commentary_data, verse_to_chapter

def main():
    src_root = "c:/Users/roadsea/Desktop/bori-1"
    odt_txt = os.path.join(src_root, "odt_text_2_2.txt")
    comm_json = os.path.join(src_root, "public/bodhi-commentary.json")
    comic_root = os.path.join(src_root, "src/assets/learning-comic")
    raw_root = os.path.join(src_root, "학습만화/난처석 2-2")

    # 1. Parse ODT text
    parsed_commentary, verse_to_chapter = parse_odt_text(odt_txt)
    print(f"Parsed {len(parsed_commentary)} sections from {odt_txt}")

    # 2. Merge with existing commentary JSON
    if os.path.exists(comm_json):
        with open(comm_json, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}

    # Update existing with new parsed data
    existing_data.update(parsed_commentary)

    # Write back
    with open(comm_json, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
    print(f"Merged and saved to {comm_json}")

    # 3. Copy Comic images
    copied_count = 0
    for verse_num, ch_num in verse_to_chapter.items():
        img_name = f"{verse_num}.png"
        src_img = os.path.join(raw_root, img_name)
        dest_dir = os.path.join(comic_root, f"chapter-{ch_num}")
        dest_img = os.path.join(dest_dir, img_name)

        if os.path.exists(src_img):
            os.makedirs(dest_dir, exist_ok=True)
            # if exists in dest, remove first
            if os.path.exists(dest_img):
                os.remove(dest_img)
            shutil.copy2(src_img, dest_img)
            copied_count += 1
        else:
            print(f"Warning: Source image not found: {src_img}")

    print(f"Copied {copied_count} comic images to src/assets/learning-comic/")

if __name__ == "__main__":
    main()
