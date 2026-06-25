import re
import json
import os
import shutil

def get_commentary_key(verse_num):
    if 229 <= verse_num <= 310:
        local_idx = verse_num - 217 + 1
        return 14, f"14.{local_idx}"
    elif 311 <= verse_num <= 312:
        local_idx = verse_num - 311 + 1
        return 15, f"15.{local_idx}"
    elif 313 <= verse_num <= 340:
        local_idx = verse_num - 313 + 1
        return 16, f"16.{local_idx}"
    elif 341 <= verse_num <= 368:
        local_idx = verse_num - 341 + 1
        return 17, f"17.{local_idx}"
    elif 369 <= verse_num <= 370:
        local_idx = verse_num - 369 + 1
        return 18, f"18.{local_idx}"
    elif 371 <= verse_num <= 382:
        local_idx = verse_num - 371 + 1
        return 19, f"19.{local_idx}"
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

        # 229 ~ 382번 단락 시작 판정
        match = re.match(r'^(\d+)\.\s+', stripped)
        is_section_start = False
        next_key = None
        
        if match:
            verse_num = int(match.group(1))
            if 229 <= verse_num <= 382:
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
    odt_txt = os.path.join(src_root, "odt_text_2_3.txt")
    comm_json = os.path.join(src_root, "public/bodhi-commentary.json")
    comic_root = os.path.join(src_root, "src/assets/learning-comic")
    raw_root = os.path.join(src_root, "학습만화/난처석 2-3")

    # 1. Parse ODT text
    parsed_commentary, verse_to_chapter = parse_odt_text(odt_txt)
    print(f"Parsed {len(parsed_commentary)} sections from {odt_txt}")

    # 2. Fill missing commentary text for 229 ~ 382 range (like 378, 380) with placeholder headers
    for v in range(229, 383):
        ch_num, key = get_commentary_key(v)
        if key and key not in parsed_commentary:
            parsed_commentary[key] = f"# {v}."
            print(f"Filled missing commentary key with placeholder: {key} (global {v})")

    # 3. Merge with existing commentary JSON
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

    # 4. Copy Comic images (iterate over full range 229 ~ 382 to catch images without parsed text)
    copied_count = 0
    for verse_num in range(229, 383):
        ch_num, key = get_commentary_key(verse_num)
        if not ch_num:
            continue
            
        img_name = f"{verse_num}.png"
        src_img = os.path.join(raw_root, img_name)
        dest_dir = os.path.join(comic_root, f"chapter-{ch_num}")
        dest_img = os.path.join(dest_dir, img_name)

        if os.path.exists(src_img):
            os.makedirs(dest_dir, exist_ok=True)
            if os.path.exists(dest_img):
                os.remove(dest_img)
            shutil.copy2(src_img, dest_img)
            copied_count += 1
        else:
            print(f"Warning: Source image not found: {src_img}")

    print(f"Copied {copied_count} comic images to src/assets/learning-comic/")

if __name__ == "__main__":
    main()
