#!/usr/bin/env python3
"""
Crawl poe2db.tw for all equipment base types and affixes using Playwright.
Final version with correct DOM parsing.
"""
import json, time, sys, os, asyncio, re
from playwright.async_api import async_playwright

BASE = "https://poe2db.tw"
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "data", "poe2-base-affixes.json")

URLS = [
    ("Rings", "戒指"), ("Amulets", "项链"), ("Belts", "腰带"),
    ("Claws", "爪"), ("Daggers", "匕首"), ("Wands", "短杖"),
    ("One_Hand_Swords", "单手剑"), ("One_Hand_Axes", "单手斧"), ("One_Hand_Maces", "单手锤"),
    ("Sceptres", "权杖"), ("Spears", "长矛"), ("Flails", "连枷"),
    ("Bows", "弓"), ("Staves", "长杖"),
    ("Two_Hand_Swords", "双手剑"), ("Two_Hand_Axes", "双手斧"), ("Two_Hand_Maces", "双手锤"),
    ("Quarterstaves", "武杖"), ("Crossbows", "弩"),
    ("Quivers", "箭袋"), ("Foci", "法器"),
    ("Gloves_str", "力手套"), ("Gloves_dex", "敏手套"), ("Gloves_int", "智手套"),
    ("Gloves_str_dex", "力敏手套"), ("Gloves_str_int", "力智手套"), ("Gloves_dex_int", "敏智手套"),
    ("Boots_str", "力鞋"), ("Boots_dex", "敏鞋"), ("Boots_int", "智鞋"),
    ("Boots_str_dex", "力敏鞋"), ("Boots_str_int", "力智鞋"), ("Boots_dex_int", "敏智鞋"),
    ("Body_Armours_str", "力胸甲"), ("Body_Armours_dex", "敏胸甲"), ("Body_Armours_int", "智胸甲"),
    ("Body_Armours_str_dex", "力敏胸甲"), ("Body_Armours_str_int", "力智胸甲"), ("Body_Armours_dex_int", "敏智胸甲"),
    ("Helmets_str", "力头"), ("Helmets_dex", "敏头"), ("Helmets_int", "智头"),
    ("Helmets_str_dex", "力敏头"), ("Helmets_str_int", "力智头"), ("Helmets_dex_int", "敏智头"),
]


async def extract_page_data(page, slug):
    url = f"{BASE}/us/{slug}"
    await page.goto(url, wait_until="domcontentloaded", timeout=60000)
    await page.wait_for_timeout(3000)

    # Click ModifiersCalc tab
    tab = await page.query_selector('a[href="#ModifiersCalc"]')
    if tab:
        await tab.click()
        await page.wait_for_timeout(2500)

    data = await page.evaluate("""() => {
        const result = { bases: [], affixes: [] };

        // --- Extract base items ---
        const nameEls = document.querySelectorAll('a.whiteitem');
        const seen = new Set();
        nameEls.forEach(el => {
            const name = el.textContent.trim();
            if (!name || seen.has(name)) return;
            seen.add(name);

            const card = el.closest('.d-flex') || el.closest('.col');
            const implicits = card
                ? Array.from(card.querySelectorAll('.implicitMod')).map(i => i.textContent.trim())
                : [];
            const reqEl = card ? card.querySelector('.requirements') : null;

            result.bases.push({
                name_zh: name,
                implicits: implicits,
                requirements: reqEl ? reqEl.textContent.trim() : '',
            });
        });

        // --- Extract affixes from ModifiersCalc ---
        const section = document.querySelector('#ModifiersCalc');
        if (!section) return result;

        // Track current type by scanning H5 headers
        let currentType = 'unknown';
        let currentFamily = '';

        // Get all H5 headers and their positions
        const h5s = Array.from(section.querySelectorAll('h5'));
        const h5Data = h5s.map(h => ({
            text: h.textContent.trim().toLowerCase(),
            el: h
        }));

        // Function to determine type from text
        function getType(text) {
            if (text.includes('prefix') || text.includes('前缀')) return 'prefix';
            if (text.includes('suffix') || text.includes('后缀')) return 'suffix';
            if (text.includes('implicit') || text.includes('基底')) return 'implicit';
            return 'unknown';
        }

        // Get all tables and determine their type based on preceding H5
        const tables = section.querySelectorAll('table.orig tbody');
        tables.forEach(tbody => {
            const rows = tbody.querySelectorAll('tr');
            if (rows.length === 0) return;

            // Find the nearest preceding H5
            let tableType = 'unknown';
            let el = tbody.closest('table');
            while (el && el !== section) {
                // Check siblings before this element
                let prev = el.previousElementSibling;
                while (prev) {
                    if (prev.tagName === 'H5') {
                        tableType = getType(prev.textContent.trim().toLowerCase());
                        break;
                    }
                    // Also check inside previous siblings
                    const innerH5 = prev.querySelector('h5');
                    if (innerH5) {
                        tableType = getType(innerH5.textContent.trim().toLowerCase());
                        break;
                    }
                    prev = prev.previousElementSibling;
                }
                if (tableType !== 'unknown') break;
                el = el.parentElement;
            }

            // Also check mod-title for family info
            let familyModTitle = '';
            let checkEl = tbody.closest('table');
            while (checkEl && checkEl !== section) {
                let prev = checkEl.previousElementSibling;
                while (prev) {
                    const mt = prev.querySelector('.mod-title');
                    if (mt) {
                        familyModTitle = mt.textContent.trim();
                        break;
                    }
                    prev = prev.previousElementSibling;
                }
                if (familyModTitle) break;
                checkEl = checkEl.parentElement;
            }

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) return;

                const tier = (cells[0]?.textContent || '').trim().replace(/[^0-9]/g, '');
                const name = (cells[1]?.textContent || '').trim();
                const level = (cells[2]?.textContent || '').trim().replace(/[^0-9]/g, '');
                const details = (cells[3]?.textContent || '').trim();
                const codeEl = cells[4]?.querySelector('i');
                const code = codeEl ? codeEl.getAttribute('data-hover') || '' : '';

                if (!name || name === 'Name' || name === '{{Name}}') return;

                result.affixes.push({
                    name_zh: name,
                    type: tableType,
                    tier: tier,
                    level: level,
                    details: details,
                    family: familyModTitle,
                    code: code,
                });
            });
        });

        return result;
    }""")

    return data


async def main():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = await context.new_page()

        all_data = {"source": "poe2db.tw", "categories": []}

        for idx, (slug, category_zh) in enumerate(URLS):
            print(f"[{idx+1:2d}/{len(URLS)}] {category_zh:8s} ({slug}) ...", end=" ", flush=True)

            try:
                data = await extract_page_data(page, slug)

                category_entry = {
                    "category": category_zh,
                    "slug": slug,
                    "url": f"{BASE}/us/{slug}",
                    "base_items": data.get("bases", []),
                    "affixes": data.get("affixes", []),
                }

                all_data["categories"].append(category_entry)

                n_bases = len(data.get("bases", []))
                n_affixes = len(data.get("affixes", []))
                pfx = sum(1 for a in data.get("affixes", []) if a["type"] == "prefix")
                sfx = sum(1 for a in data.get("affixes", []) if a["type"] == "suffix")
                print(f"✓ {n_bases} bases, {n_affixes} affixes (P:{pfx} S:{sfx})")

            except Exception as e:
                print(f"✗ {e}")
                all_data["categories"].append({
                    "category": category_zh, "slug": slug,
                    "url": f"{BASE}/us/{slug}", "error": str(e),
                    "base_items": [], "affixes": [],
                })

            await page.wait_for_timeout(1500)

        await browser.close()

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    total_bases = sum(len(c.get("base_items", [])) for c in all_data["categories"])
    total_affixes = sum(len(c.get("affixes", [])) for c in all_data["categories"])
    errors = sum(1 for c in all_data["categories"] if c.get("error"))

    print(f"\n{'='*50}")
    print(f"Saved: {OUTPUT}")
    print(f"Categories: {len(all_data['categories'])}, Bases: {total_bases}, Affixes: {total_affixes}, Errors: {errors}")


if __name__ == "__main__":
    asyncio.run(main())
