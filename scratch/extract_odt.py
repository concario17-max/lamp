import zipfile
import xml.etree.ElementTree as ET

def extract_odt_text(odt_path, txt_path):
    with zipfile.ZipFile(odt_path, 'r') as z:
        content_xml = z.read('content.xml')
        
    root = ET.fromstring(content_xml)
    
    lines = []
    # OpenDocument text namespace tags often look like {urn:oasis:names:tc:opendocument:xmlns:text:1.0}p
    for elem in root.iter():
        # Tag ends with 'p' (paragraph) or 'h' (heading)
        tag_local = elem.tag.split('}')[-1]
        if tag_local in ('p', 'h'):
            # itertext joins all text including child tags (like span, etc.)
            text = "".join(elem.itertext()).strip()
            if text:
                lines.append(text)
            else:
                lines.append("") # empty line to keep paragraph splits if needed
            
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Extracted text to {txt_path}")

if __name__ == "__main__":
    import os
    src_root = "c:/Users/roadsea/Desktop/bori-1"
    extract_odt_text(os.path.join(src_root, "난처석 2-2.odt"), os.path.join(src_root, "odt_text_2_2.txt"))
