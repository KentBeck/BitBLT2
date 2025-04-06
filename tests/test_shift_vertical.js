/**
 * Test file for BitBLT with overlapping source and destination - vertical shift
 * 
 * This tests the tricky case where we're shifting pixels up within the same bitmap,
 * which can cause issues if not handled correctly.
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
  bitmapToString
} = require('../src/bitblt');

// Create a test bitmap
const bitmap = createBitmap(32, 8);

// Fill a pattern that will be easy to see if shifted
// Create a pattern with alternating 1s and 0s in a vertical line
for (let y = 1; y < 6; y++) {
  setPixel(bitmap, 10, y, y % 2 === 0 ? 1 : 0);
}

console.log('Original bitmap:');
console.log(bitmapToString(bitmap));

// Create a copy for comparison
const expected = createBitmap(32, 8);
// Create the expected pattern (shifted up by 1 pixel)
for (let y = 1; y < 6; y++) {
  if (y > 1) { // Skip the first position
    setPixel(expected, 10, y-1, y % 2 === 0 ? 1 : 0);
  }
}

// Perform the shift operation (shift up by 1 pixel)
console.log('\nShifting up by 1 pixel...');
bitblt(bitmap, 10, 0, 1, 5, bitmap, 10, 1, BitBltOp.COPY);

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

// If there's a mismatch, let's analyze what went wrong
if (!match) {
  console.log('\nAnalyzing the issue:');
  console.log('When shifting up and source/destination overlap, we need to process pixels from top to bottom');
  console.log('Otherwise, we overwrite source pixels before they\'re read');
  
  // Create a new bitmap to demonstrate the correct approach
  const correctBitmap = createBitmap(32, 8);
  // Create the same alternating pattern
  for (let y = 1; y < 6; y++) {
    setPixel(correctBitmap, 10, y, y % 2 === 0 ? 1 : 0);
  }
  
  console.log('\nOriginal bitmap:');
  console.log(bitmapToString(correctBitmap));
  
  // Manually perform the shift in the correct order (top to bottom)
  console.log('\nManually shifting up by 1 pixel (processing top to bottom):');
  for (let y = 1; y < 6; y++) {
    const pixel = getPixel(correctBitmap, 10, y);
    setPixel(correctBitmap, 10, y-1, pixel);
  }
  // Clear the last position (which shouldn't be copied)
  setPixel(correctBitmap, 10, 5, 0);
  
  console.log('\nResult after manual shift:');
  console.log(bitmapToString(correctBitmap));
  
  console.log('\nExpected result:');
  console.log(bitmapToString(expected));
  
  // Compare the results
  let manualMatch = true;
  for (let y = 0; y < correctBitmap.height; y++) {
    for (let x = 0; x < correctBitmap.width; x++) {
      if (getPixel(correctBitmap, x, y) !== getPixel(expected, x, y)) {
        manualMatch = false;
        console.log(`Manual mismatch at (${x},${y}): actual=${getPixel(correctBitmap, x, y)}, expected=${getPixel(expected, x, y)}`);
      }
    }
  }
  
  console.log('\nManual results match:', manualMatch);
}

// Exit with appropriate code
process.exit(match ? 0 : 1);
