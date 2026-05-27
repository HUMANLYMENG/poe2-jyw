#!/usr/bin/env python3
"""
Crawl poe2db.tw for all equipment base types and their affixes.
Output: data/poe2-base-affixes.json
"""
import json, re, time, sys, os
from urllib.request import urlopen, Request
from urllib.error import URLError

BASE = "https://poe2db.tw"
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "data", "poe2-base-affixes.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# URLs discovered from the modifiers page
URLS = [
    # Jewellery
    ("Amulets", "项链"),
    ("Rings", "戒指"),
    ("Belts", "腰带"),
    # One-handed weapons
    ("Claws", "爪"),
    ("Daggers", "匕首"),
    ("Wands", "短杖"),
    ("One_Hand_Swords", "单手剑"),
    ("One_Hand_Axes", "单手斧"),
    ("One_Hand_Maces", "单手锤"),
    ("Sceptres", "权杖"),
    ("Spears", "长矛"),
    ("Flails", "连枷"),
    # Two-handed weapons
    ("Bows", "弓"),
    ("Staves", "长杖"),
    ("Two_Hand_Swords", "双手剑"),
    ("Two_Hand_Axes", "双手斧"),
    ("Two_Hand_Maces", "双手锤"),
    ("Quarterstaves", "武杖"),
    ("Crossbows", "弩"),
    ("Traps", "陷阱"),
    ("Talismans", "护符"),
    # Off-hand
    ("Quivers", "箭袋"),
    ("Shields_str", "力盾"),
    ("Shields_str_dex", "力敏盾"),
    ("Shields_str_int", "力智盾"),
    ("Bucklers", "小圆盾"),
    ("Foci", "法器"),
    # Gloves (by attribute)
    ("Gloves_str", "力手套"),
    ("Gloves_dex", "敏手套"),
    ("Gloves_int", "智手套"),
    ("Gloves_str_dex", "力敏手套"),
    ("Gloves_str_int", "力智手套"),
    ("Gloves_dex_int", "敏智手套"),
    # Boots (by attribute)
    ("Boots_str", "力鞋"),
    ("Boots_dex", "敏鞋"),
    ("Boots_int", "智鞋"),
    ("Boots_str_dex", "力敏鞋"),
    ("Boots_str_int", "力智鞋"),
    ("Boots_dex_int", "敏智鞋"),
    # Body Armours (by attribute)
    ("Body_Armours_str", "力胸甲"),
    ("Body_Armours_dex", "敏胸甲"),
    ("Body_Armours_int", "智胸甲"),
    ("Body_Armours_str_dex", "力敏胸甲"),
    ("Body_Armours_str_int", "力智胸甲"),
    ("Body_Armours_dex_int", "敏智胸甲"),
    ("Body_Armours_str_dex_int", "全属性胸甲"),
    # Helmets (by attribute)
    ("Helmets_str", "力头"),
    ("Helmets_dex", "敏头"),
    ("Helmets_int", "智头"),
    ("Helmets_str_dex", "力敏头"),
    ("Helmets_str_int", "力智头"),
    ("Helmets_dex_int", "敏智头"),
    # Flasks, Jewels, Charms
    ("Life_Flasks", "生命药剂"),
    ("Mana_Flasks", "魔力药剂"),
    ("Charms", "护符"),
    ("Ruby", "红玉珠宝"),
    ("Sapphire", "蓝玉珠宝"),
    ("Emerald", "翠绿珠宝"),
    ("Time-Lost_Ruby", "时光红玉"),
    ("Time-Lost_Sapphire", "时光蓝玉"),
    ("Time-Lost_Emerald", "时光翠绿"),
]


def fetch(url, retries=2):
    for attempt in range(retries + 1):
        try:
            req = Request(url, headers={"User-Agent": UA})
            with urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            if attempt < retries:
                time.sleep(2)
            else:
                raise


def extract_mods_from_html(html):
    """Extract modifier entries from the ModifiersCalc section."""
    # Find the ModifiersCalc section - everything between the h5 header and next section
    mod_section_match = re.search(
        r'id="ModifiersCalc".*?(?=<a\s+id="|$)', html, re.DOTALL
    )
    if not mod_section_match:
        return [], []

    section = mod_section_match.group(0)

    # Extract modifier groups: prefix/suffix tables
    mods = []
    implicit_mods = []

    # Try to find tables with modifier data
    # Pattern: rows with mod data - poe2db uses various table layouts
    # Look for rows with the modifier class or mod-value spans

    # Explicit mods - look for pattern: name, level, type, values
    # Typical format in PoE2DB tables:
    # <tr><td>ModName</td><td>Lvl</td><td>Type</td><td>Values</td></tr>

    rows = re.findall(
        r'<tr[^>]*>.*?</tr>', section, re.DOTALL
    )

    for row in rows:
        # Skip header rows
        if '<th' in row:
            continue

        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(cells) < 2:
            continue

        # Clean cell text
        cleaned = []
        for c in cells:
            c = re.sub(r'<[^>]+>', '', c)
            c = c.replace('&ndash;', '–').replace('&mdash;', '—')
            c = c.strip()
            cleaned.append(c)

        # Determine if this is a modifier row
        # Typical PoE2DB format: [name, level, type/slot, values, tags]
        if len(cleaned) >= 3 and cleaned[0]:
            mod_name = cleaned[0]

            # Skip non-modifier rows (category headers, etc.)
            if mod_name in ('', 'Name', 'Mod', '#'):
                continue
            if re.match(r'^\d+$', mod_name):
                continue

            mod_type = "unknown"
            for c in cleaned:
                if c in ("Prefix", "Suffix", "Implicit", "Enchantment", "Corrupted"):
                    mod_type = c.lower()
                    break

            # Extract tier/level
            level = None
            for c in cleaned:
                m = re.match(r'^(\d+)$', c)
                if m:
                    level = int(m.group(1))
                    break

            # Extract value range
            values = ""
            for c in cleaned:
                if '–' in c or '—' in c or re.search(r'\d+', c):
                    # Check if it looks like a value range
                    if re.search(r'[\d.–—]', c) and len(c) > 2:
                        values = c
                        break

            mods.append({
                "name_zh": mod_name,
                "type": mod_type,
                "level": level,
                "values": values,
            })

    return mods, implicit_mods


def extract_base_items(html):
    """Extract base item names and implicit mods from the item list section."""
    bases = []

    # Find the card-header with "Item /" pattern (item list)
    item_section_match = re.search(
        r'<h5 class="card-header">(.*?Item\s*/\d+.*?)</h5>(.*?)(?=<h5 class="card-header"|$)', 
        html, re.DOTALL
    )

    # If not found, try broader pattern
    sections = re.findall(
        r'<h5 class="card-header">([^<]+)</h5>\s*(.*?)(?=<h5 class="card-header"|$)',
        html, re.DOTALL
    )

    for title, content in sections:
        if 'Item' not in title:
            continue

        # Extract individual item cards
        items = re.findall(
            r'<a[^>]*class="whiteitem[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)</a>(.*?)(?=<div class="col">|<h5|$)',
            content, re.DOTALL
        )

        for href, name, details in items:
            # Extract implicit mods
            implicits = re.findall(
                r'<div class="implicitMod">(.*?)</div>',
                details, re.DOTALL
            )
            implicit_texts = []
            for imp in implicits:
                imp = re.sub(r'<[^>]+>', '', imp)
                imp = imp.replace('&ndash;', '–').replace('&mdash;', '—')
                imp = ' '.join(imp.split())
                if imp:
                    implicit_texts.append(imp)

            # Extract requirements
            req_match = re.search(r'<div class="requirements">(.*?)</div>', details, re.DOTALL)
            requirements = ""
            if req_match:
                requirements = re.sub(r'<[^>]+>', '', req_match.group(1)).strip()

            bases.append({
                "name_zh": name.strip(),
                "url": BASE + "/us/" + href if not href.startswith("http") else href,
                "implicits": implicit_texts,
                "requirements": requirements,
            })

    return bases


def main():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

    all_data = {
        "source": "poe2db.tw",
        "urls_used": len(URLS),
        "categories": [],
    }

    for idx, (slug, category_zh) in enumerate(URLS):
        url = f"{BASE}/us/{slug}"
        print(f"[{idx+1}/{len(URLS)}] {slug} ({category_zh}) ...", end=" ", flush=True)

        try:
            html = fetch(url)
            bases = extract_base_items(html)
            mods, implicits = extract_mods_from_html(html)

            category_entry = {
                "category": category_zh,
                "slug": slug,
                "url": url,
                "base_items": bases,
                "affixes": mods,
            }

            all_data["categories"].append(category_entry)

            n_bases = len(bases)
            n_mods = len(mods)
            print(f"✓ {n_bases} bases, {n_mods} affixes")

        except Exception as e:
            print(f"✗ {e}")
            all_data["categories"].append({
                "category": category_zh,
                "slug": slug,
                "url": url,
                "error": str(e),
                "base_items": [],
                "affixes": [],
            })

        # Don't hammer the server
        time.sleep(1.5)

    # Save output
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    # Print summary
    total_bases = sum(len(c.get("base_items", [])) for c in all_data["categories"])
    total_affixes = sum(len(c.get("affixes", [])) for c in all_data["categories"])
    errors = sum(1 for c in all_data["categories"] if c.get("error"))

    print(f"\n{'='*50}")
    print(f"Done! Saved to {OUTPUT}")
    print(f"Categories: {len(all_data['categories'])}")
    print(f"Base items: {total_bases}")
    print(f"Affixes: {total_affixes}")
    print(f"Errors: {errors}")


if __name__ == "__main__":
    main()
