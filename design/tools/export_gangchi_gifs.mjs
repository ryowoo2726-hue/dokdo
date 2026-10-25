import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const designDir = join(root, 'design');



// Self-contained GIF89a LZW Encoder (256-color adaptive/uniform 6x6x6 + grayscale palette)
function encodeGIF(width, height, framesRgba, delayCs = 6) {
  const palette = new Uint8Array(256 * 3);
  let pIdx = 0;
  // 6x6x6 = 216 colors
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette[pIdx * 3] = Math.round((r * 255) / 5);
        palette[pIdx * 3 + 1] = Math.round((g * 255) / 5);
        palette[pIdx * 3 + 2] = Math.round((b * 255) / 5);
        pIdx++;
      }
    }
  }
  // Add exact Gangchi/Taegeukgi key colors into slots 216..255 for ultra-clean accuracy
  const exactColors = [
    [0xe0, 0xf4, 0xff], [0xf6, 0xd6, 0xb2], [0xdc, 0xb2, 0x8b], [0xe7, 0xbc, 0x93],
    [0xed, 0xc8, 0xa3], [0xf4, 0xd5, 0xb3], [0xdf, 0xb4, 0x88], [0x76, 0x52, 0x3b],
    [0xff, 0xf7, 0xe4], [0x19, 0x72, 0xbc], [0xb7, 0x4c, 0x43], [0xef, 0x8e, 0x83],
    [0xff, 0x76, 0x75], [0xcd, 0x2e, 0x3a], [0x00, 0x47, 0xa0], [0x11, 0x18, 0x27],
    [0x78, 0x35, 0x0f], [0xf5, 0x9e, 0x0b], [0xb4, 0x53, 0x09], [0x02, 0x84, 0xc7],
    [0x03, 0x69, 0xa1], [0xe0, 0xf2, 0xfe], [0xff, 0xf0, 0xf3], [0xff, 0x4d, 0x6d],
    [0xe1, 0x1d, 0x48], [0xff, 0x6b, 0x8b], [0xfb, 0x71, 0x85], [0xfb, 0xbf, 0x24],
    [0x38, 0xbd, 0xf8], [0xcb, 0xd5, 0xe1], [0x16, 0x4e, 0x63], [0xd0, 0xe8, 0xf8]
  ];
  for (const [r, g, b] of exactColors) {
    if (pIdx < 256) {
      palette[pIdx * 3] = r;
      palette[pIdx * 3 + 1] = g;
      palette[pIdx * 3 + 2] = b;
      pIdx++;
    }
  }

  function findClosestColor(r, g, b) {
    let best = 0;
    let bestDist = 1e9;
    for (let i = 0; i < pIdx; i++) {
      const dr = r - palette[i * 3];
      const dg = g - palette[i * 3 + 1];
      const db = b - palette[i * 3 + 2];
      const d = dr * dr + dg * dg + db * db;
      if (d === 0) return i;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function lzwEncode(indexStream) {
    const minCodeSize = 8;
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    let dict = new Map();

    const bytes = [];
    let bitBuf = 0;
    let bitCount = 0;

    function writeCode(code) {
      bitBuf |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        bytes.push(bitBuf & 0xff);
        bitBuf >>= 8;
        bitCount -= 8;
      }
    }

    writeCode(clearCode);
    let prefix = indexStream[0];

    for (let i = 1; i < indexStream.length; i++) {
      const k = indexStream[i];
      const key = (prefix << 8) | k;
      if (dict.has(key)) {
        prefix = dict.get(key);
      } else {
        writeCode(prefix);
        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          writeCode(clearCode);
          dict.clear();
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
        }
        prefix = k;
      }
    }
    writeCode(prefix);
    writeCode(eoiCode);
    if (bitCount > 0) bytes.push(bitBuf & 0xff);

    const out = [minCodeSize];
    for (let i = 0; i < bytes.length; i += 255) {
      const chunk = bytes.slice(i, i + 255);
      out.push(chunk.length, ...chunk);
    }
    out.push(0);
    return out;
  }

  const out = [];
  // Header GIF89a
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  // Logical Screen Descriptor
  out.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, 0xf7, 0x00, 0x00);
  // Global Color Table (256 * 3)
  for (let i = 0; i < 256 * 3; i++) out.push(palette[i]);
  // Netscape Loop Extension (infinite loop)
  out.push(0x21, 0xff, 0x0b, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00);

  const colorCache = new Map();
  for (const rgba of framesRgba) {
    // Graphic Control Extension
    out.push(0x21, 0xf9, 0x04, 0x00, delayCs & 0xff, (delayCs >> 8) & 0xff, 0x00, 0x00);
    // Image Descriptor
    out.push(0x2c, 0x00, 0x00, 0x00, 0x00, width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, 0x00);

    const indices = new Uint8Array(width * height);
    for (let p = 0; p < width * height; p++) {
      const r = rgba[p * 4];
      const g = rgba[p * 4 + 1];
      const b = rgba[p * 4 + 2];
      const key = (r << 16) | (g << 8) | b;
      let idx = colorCache.get(key);
      if (idx === undefined) {
        idx = findClosestColor(r, g, b);
        colorCache.set(key, idx);
      }
      indices[p] = idx;
    }
    const lzw = lzwEncode(indices);
    for (let i = 0; i < lzw.length; i++) out.push(lzw[i]);
  }

  // Trailer
  out.push(0x3b);
  return Buffer.from(out);
}

async function renderGif(svgPath, outGifName, durationSec = 0.9) {
  console.log(`Rendering GIF for ${outGifName}...`);
  const svgContent = readFileSync(svgPath, 'utf8');
  const width = 280;
  const height = 225;

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width, height } });

  const html = `<!doctype html>
  <html>
  <head>
    <style>
      body { margin: 0; padding: 0; background: #e0f4ff; width: ${width}px; height: ${height}px; overflow: hidden; }
      svg { width: ${width}px; height: ${height}px; display: block; }
    </style>
  </head>
  <body>${svgContent}</body>
  </html>`;

  await page.setContent(html);
  await page.waitForTimeout(150);

  const fps = 16;
  const totalFrames = Math.round(fps * durationSec);
  const framesRgba = [];

  for (let i = 0; i < totalFrames; i++) {
    const t = (i / totalFrames) * durationSec;
    const pngBase64 = (await page.screenshot({ type: 'png' })).toString('base64');
    const rgbaArray = await page.evaluate(async ({ tNext, b64, w, h }) => {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = 'data:image/png;base64,' + b64;
      });
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = Array.from(ctx.getImageData(0, 0, w, h).data);

      const svg = document.querySelector('svg');
      if (svg && svg.pauseAnimations && svg.setCurrentTime) {
        svg.pauseAnimations();
        svg.setCurrentTime(tNext);
      }
      return data;
    }, { tNext: ((i + 1) / totalFrames) * durationSec, b64: pngBase64, w: width, h: height });

    framesRgba.push(Uint8Array.from(rgbaArray));
  }

  await browser.close();

  const gifBuffer = encodeGIF(width, height, framesRgba, Math.round(100 / fps));
  for (const dir of [designDir]) {
    writeFileSync(join(dir, outGifName), gifBuffer);
  }
  console.log(`✅ Saved ${outGifName} (${gifBuffer.length} bytes)`);
}

async function main() {
  await renderGif(join(designDir, 'gangchi-cheer-flag.svg'), 'gangchi-cheer-flag.gif', 0.9);
  await renderGif(join(designDir, 'gangchi-cheer-heart.svg'), 'gangchi-cheer-heart.gif', 1.6);
  await renderGif(join(designDir, 'gangchi-cheer-dance.svg'), 'gangchi-cheer-dance.gif', 1.4);
  console.log('🎉 All 3 animated GIFs generated and saved!');
}

main();
