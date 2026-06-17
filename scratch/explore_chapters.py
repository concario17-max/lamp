import json

with open("public/reading-data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

chapters = data.get("chapters", [])
subchapter_idx = 0

for group in chapters:
    group_id = group.get("id")
    group_title = group.get("title") or group.get("chapterName") or ""
    is_group = group.get("isGroup", False)
    
    subchapters = group.get("subchapters", [])
    for sub in subchapters:
        subchapter_idx += 1
        sub_id = sub.get("id")
        sub_title = sub.get("title") or sub.get("chapterName") or ""
        paragraphs = sub.get("paragraphs", [])
        
        para_details = []
        for p in paragraphs:
            p_id = p.get("id")
            p_num = p.get("paragraphNumber")
            para_details.append((p_id, p_num))
            
        print(f"ChapterNum: {subchapter_idx} | Group: {group_title} | Sub: {sub_title} | ID: {sub_id} | Paragraphs Count: {len(paragraphs)}")
        if para_details:
            print(f"  First: {para_details[0]} | Last: {para_details[-1]}")
