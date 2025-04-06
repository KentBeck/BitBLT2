/**
 * Debug file for XOR operation
 */

const {
  // Enums
  BitBltOp,

  // Functions
  createBitmap,
  setPixel,
  getPixel,
  bitblt,
  fillRect,
  bitmapToString,
} = require("../src/bitblt");

// Create source and destination bitmaps
const src = createBitmap(32, 8);
const dst = createBitmap(32, 8);

// Fill rectangles in source and destination with overlap
fillRect(src, 5, 3, 10, 5, 1);
fillRect(dst, 8, 4, 10, 5, 1);

console.log("Source bitmap:");
console.log(bitmapToString(src));

console.log("\nDestination before XOR:");
console.log(bitmapToString(dst));

// Perform XOR operation
bitblt(dst, 5, 3, 10, 5, src, 5, 3, BitBltOp.XOR);

console.log("\nDestination after XOR:");
console.log(bitmapToString(dst));

// Create a bitmap to manually calculate the expected result
const expected = createBitmap(32, 8);

// First, set up the destination before the operation
fillRect(expected, 8, 4, 10, 5, 1);

// Now manually apply XOR for each pixel in the blit rectangle
for (let y = 3; y < 8; y++) {
  for (let x = 5; x < 15; x++) {
    const srcPixel = getPixel(src, x, y);
    const originalDstPixel = x >= 8 && x < 18 && y >= 4 ? 1 : 0;
    const xorResult = srcPixel ^ originalDstPixel;
    setPixel(expected, x, y, xorResult);
  }
}

console.log("\nManually calculated expected result:");
console.log(bitmapToString(expected));

// Compare the results
let match = true;
for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 32; x++) {
    if (getPixel(dst, x, y) !== getPixel(expected, x, y)) {
      match = false;
      console.log(
        `Mismatch at (${x},${y}): dst=${getPixel(
          dst,
          x,
          y
        )}, expected=${getPixel(expected, x, y)}`
      );
    }
  }
}

console.log("\nResults match:", match);
