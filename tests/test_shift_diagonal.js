/**
 * Test file for BitBLT with overlapping source and destination - diagonal shift
 *
 * This tests the tricky case where we're shifting pixels both horizontally and vertically
 * within the same bitmap, which can cause issues if not handled correctly.
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

// Create a test bitmap
const bitmap = createBitmap(32, 16);

// Fill a pattern that will be easy to see if shifted
// Create a small rectangle
fillRect(bitmap, 5, 5, 4, 4, 1);

console.log("Original bitmap:");
console.log(bitmapToString(bitmap));

// Create a copy for comparison
const expected = createBitmap(32, 16);
// Create the expected pattern (shifted diagonally)
// For a diagonal shift, both the original and shifted rectangles will be visible
fillRect(expected, 5, 5, 4, 4, 1); // Original rectangle
fillRect(expected, 7, 3, 4, 4, 1); // Shifted rectangle

// Perform the shift operation (shift diagonally: right by 2, up by 2)
console.log("\nShifting diagonally (right by 2, up by 2)...");
bitblt(bitmap, 7, 3, 4, 4, bitmap, 5, 5, BitBltOp.COPY);

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

// If there's a mismatch, let's analyze what went wrong
if (!match) {
  console.log("\nAnalyzing the issue:");
  console.log(
    "When shifting diagonally and source/destination overlap, the processing order depends on the direction"
  );
  console.log(
    "For up-right shifts, we need to process from right-to-left and top-to-bottom"
  );

  // Create a new bitmap to demonstrate the correct approach
  const correctBitmap = createBitmap(32, 16);
  fillRect(correctBitmap, 5, 5, 4, 4, 1); // Original rectangle

  console.log("\nOriginal bitmap:");
  console.log(bitmapToString(correctBitmap));

  // Manually perform the shift in the correct order
  console.log(
    "\nManually shifting diagonally (processing in the correct order):"
  );
  // Create a temporary copy of the source region
  const tempBitmap = createBitmap(4, 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      setPixel(tempBitmap, x, y, getPixel(correctBitmap, 5 + x, 5 + y));
    }
  }

  // Copy from the temporary bitmap to the destination
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      setPixel(correctBitmap, 7 + x, 3 + y, getPixel(tempBitmap, x, y));
    }
  }

  console.log("\nResult after manual shift:");
  console.log(bitmapToString(correctBitmap));

  console.log("\nExpected result:");
  console.log(bitmapToString(expected));

  // Compare the results
  let manualMatch = true;
  for (let y = 0; y < correctBitmap.height; y++) {
    for (let x = 0; x < correctBitmap.width; x++) {
      if (getPixel(correctBitmap, x, y) !== getPixel(expected, x, y)) {
        manualMatch = false;
        console.log(
          `Manual mismatch at (${x},${y}): actual=${getPixel(
            correctBitmap,
            x,
            y
          )}, expected=${getPixel(expected, x, y)}`
        );
      }
    }
  }

  console.log("\nManual results match:", manualMatch);
}

// Exit with appropriate code
process.exit(match ? 0 : 1);
