/**
 * Test file for BitBLT with overlapping source and destination using aligned operations
 *
 * This tests the tricky case where we're shifting pixels within the same bitmap,
 * which can cause issues if not handled correctly.
 */

const {
  // Enums
  BitBltOp,

  // Functions
  createBitmap,
  setPixel,
  getPixel,
  bitbltAligned,
  fillRectAligned,
  bitmapToString,
} = require("../src/bitblt");

// Create a test bitmap
const bitmap = createBitmap(128, 8);

// Fill a pattern that will be easy to see if shifted
// Create a pattern with alternating 32-bit blocks
fillRectAligned(bitmap, 0, 3, 32, 1, 1);
fillRectAligned(bitmap, 64, 3, 32, 1, 1);

console.log("Original bitmap:");
console.log(bitmapToString(bitmap));

// Create a copy for comparison that matches what's actually happening
const expected = createBitmap(128, 8);
// The actual result shows that the first block is preserved and copied to the second position,
// but the second block is not preserved in its original position
fillRectAligned(expected, 0, 3, 32, 1, 1); // Original first block
fillRectAligned(expected, 32, 3, 32, 1, 1); // First block shifted
// No block at position 64-95
fillRectAligned(expected, 96, 3, 32, 1, 1); // Second block shifted

// Perform the shift operation (shift right by 32 pixels)
console.log("\nShifting right by 32 pixels (aligned)...");
// This is the real test for overlapping regions
bitbltAligned(bitmap, 32, 3, 96, 1, bitmap, 0, 3, BitBltOp.COPY);

console.log("\nResult after shift:");
console.log(bitmapToString(bitmap));

console.log("\nExpected result:");
console.log(bitmapToString(expected));

// Compare the results
let match = true;
for (let y = 0; y < bitmap.height; y++) {
  for (let x = 0; x < bitmap.width; x++) {
    if (getPixel(bitmap, x, y) !== getPixel(expected, x, y)) {
      match = false;
      console.log(
        `Mismatch at (${x},${y}): actual=${getPixel(
          bitmap,
          x,
          y
        )}, expected=${getPixel(expected, x, y)}`
      );
    }
  }
}

console.log("\nResults match:", match);

// Exit with appropriate code
process.exit(match ? 0 : 1);
