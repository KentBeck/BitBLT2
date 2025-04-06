/**
 * Test file for BitBLT with overlapping source and destination - vertical aligned shift
 * 
 * This tests the tricky case where we're shifting aligned blocks vertically within the same bitmap,
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
  bitmapToString
} = require('../src/bitblt');

// Create a test bitmap
const bitmap = createBitmap(128, 16);

// Fill a pattern that will be easy to see if shifted
// Create a pattern with blocks in different rows
fillRectAligned(bitmap, 0, 4, 32, 1, 1);  // Block in row 4
fillRectAligned(bitmap, 0, 8, 32, 1, 1);  // Block in row 8

console.log('Original bitmap:');
console.log(bitmapToString(bitmap));

// Create a copy for comparison
const expected = createBitmap(128, 16);
// Create the expected pattern (shifted up by 2 rows)
fillRectAligned(expected, 0, 2, 32, 1, 1);  // Block from row 4 shifted to row 2
fillRectAligned(expected, 0, 6, 32, 1, 1);  // Block from row 8 shifted to row 6

// Perform the shift operation (shift up by 2 rows)
console.log('\nShifting up by 2 rows (aligned)...');
bitbltAligned(bitmap, 0, 2, 32, 8, bitmap, 0, 4, BitBltOp.COPY);

console.log('\nResult after shift:');
console.log(bitmapToString(bitmap));

console.log('\nExpected result:');
console.log(bitmapToString(expected));

// Compare the results
let match = true;
for (let y = 0; y < bitmap.height; y++) {
  for (let x = 0; x < bitmap.width; x++) {
    if (getPixel(bitmap, x, y) !== getPixel(expected, x, y)) {
      match = false;
      console.log(`Mismatch at (${x},${y}): actual=${getPixel(bitmap, x, y)}, expected=${getPixel(expected, x, y)}`);
    }
  }
}

console.log('\nResults match:', match);

// Exit with appropriate code
process.exit(match ? 0 : 1);
