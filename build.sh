#!/bin/bash
# PoE2 Trade Enhancer — Build Chrome MV3
# Usage: ./build.sh
set -e
cd "$(dirname "$0")"
BUILD_DIR="build/chrome-mv3-prod"

echo "🔨 PoE2 Trade Enhancer — Chrome Build"

# Plasmo v0.90.5 workaround: pre-create gen-assets
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

npx plasmo build --target=chrome-mv3

# Patch manifest: ensure storage permission + host_permissions
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
with open('$BUILD_DIR/manifest.json', 'w') as f:
    json.dump(m, f, indent=2, separators=(',', ': '))
" 2>/dev/null

# Copy data files
cp public/poe2_en_zh.json "$BUILD_DIR/" 2>/dev/null || echo "⚠️  Dict not found"
cp public/poe2-base-affixes.json "$BUILD_DIR/" 2>/dev/null || echo "⚠️  Affix DB not found"

# Rebuild zip
cd build
rm -f poe2-trade-enhancer.zip
zip -r poe2-trade-enhancer.zip chrome-mv3-prod/
echo "✅ poe2-trade-enhancer.zip"
