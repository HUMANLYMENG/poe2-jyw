#!/bin/bash
# PoE2 Trade Enhancer — Build Script
# Usage: ./build.sh
set -e
cd "$(dirname "$0")"
BUILD_DIR="build/chrome-mv3-prod"

echo "🔨 PoE2 Trade Enhancer — Build"

# Plasmo v0.90.5 workaround: pre-create gen-assets (don't delete .plasmo)
if [ ! -d .plasmo/gen-assets ]; then
  mkdir -p .plasmo/gen-assets
  python3 -c "
import struct, zlib
def png(w,h,c=(0x1a,0x1a,0x2e)):
    def chk(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    ih=struct.pack('>IIBBBBB',w,h,8,2,0,0,0)
    px=b''.join(b'\x00'+bytes(c)+b'\xff' for _ in range(h*w))
    return b'\x89PNG\r\n\x1a\n'+chk(b'IHDR',ih)+chk(b'IDAT',zlib.compress(px))+chk(b'IEND',b'')
for s in [16,32,48,64,128]:
    with open(f'.plasmo/gen-assets/icon{s}.plasmo.png','wb') as f:
        f.write(png(s,s))
"
fi

npx plasmo build

# Patch manifest for Firefox + permissions
python3 -c "
import json
with open('$BUILD_DIR/manifest.json') as f:
    m = json.load(f)
m['permissions'] = ['storage', 'activeTab']
m['host_permissions'] = [
    'https://www.pathofexile.com/*',
    'https://api.pathofexile.com/*',
    'https://api.deepseek.com/*',
    'https://api.openai.com/*',
    'http://127.0.0.1:*/*',
    'http://localhost:*/*'
]
m['browser_specific_settings'] = {'gecko': {'id': 'poe2-trade-enhancer@jojo.local', 'strict_min_version': '115.0'}}
m['web_accessible_resources'] = [{'resources': ['poe2_en_zh.json', 'poe2-base-affixes.json'], 'matches': ['<all_urls>']}]
if m.get('background',{}).get('service_worker'):
    m['background']['scripts'] = [m['background'].pop('service_worker')]
with open('$BUILD_DIR/manifest.json', 'w') as f:
    json.dump(m, f, indent=2, separators=(',', ': '))
" 2>/dev/null

# Copy dictionary for translation feature
cp public/poe2_en_zh.json "$BUILD_DIR/" 2>/dev/null || echo "⚠️  Dict not found, translation disabled"
cp public/poe2-base-affixes.json "$BUILD_DIR/" 2>/dev/null || echo "⚠️  Affix DB not found, validation disabled"

echo "✅ $BUILD_DIR/"
echo "Firefox: about:debugging → 临时载入附加组件 → $BUILD_DIR/manifest.json"
