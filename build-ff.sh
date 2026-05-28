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

echo "=== Replacing icons ==="
for size in 16 32 48 64 128; do
  hash=$(ls "$BUILD_DIR"/icon${size}.plasmo.*.png 2>/dev/null | head -1)
  if [ -n "$hash" ] && [ -f "assets/icon${size}.png" ]; then
    cp "assets/icon${size}.png" "$hash"
    echo "  icon${size} OK"
  fi
done

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

# Create XPI (Firefox extension format — renamed .zip)
cd build
rm -f poe2-trade-enhancer-ff.xpi
zip -r poe2-trade-enhancer-ff.xpi firefox-mv2-prod/
echo "✅ poe2-trade-enhancer-ff.xpi"
