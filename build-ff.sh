#!/bin/bash
# Build Firefox MV2 extension with all required assets and permissions
set -e
cd "$(dirname "$0")"

echo "=== Building Firefox MV2 ==="
npx plasmo build --target=firefox-mv2

BUILD_DIR="build/firefox-mv2-prod"
echo "=== Copying data files ==="
cp public/poe2_en_zh.json "$BUILD_DIR/"
cp public/poe2_zh_en.json "$BUILD_DIR/"
cp public/poe2-base-affixes.json "$BUILD_DIR/"

echo "=== Patching manifest permissions ==="
python3 -c "
import json
with open('$BUILD_DIR/manifest.json') as f:
    m = json.load(f)
m['permissions'] = [
    'storage',
    'unlimitedStorage',
    'https://www.pathofexile.com/*',
    'https://api.deepseek.com/*',
    'https://api.openai.com/*',
    'http://127.0.0.1/*',
]
with open('$BUILD_DIR/manifest.json', 'w') as f:
    json.dump(m, f, ensure_ascii=False)
print('Done:', m.get('permissions'))
"

echo "=== Build complete ==="
ls -lh "$BUILD_DIR"/*.json
