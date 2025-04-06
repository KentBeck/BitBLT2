/**
 * Test file for BitBLT implementation
 */

const {
  // Enums
  BitBltOp,

  // Functions
  createBitmap,
  setPixel,
  getPixel,
  bitblt,
  bitbltAligned,
  fillRect,
  fillRectAligned,
  bitmapToString,
} = require("../src/bitblt");

// Test bitmap creation
console.log("Testing bitmap creation...");
const bitmap1 = createBitmap(64, 16);
console.log(
  `Created bitmap: ${bitmap1.width}x${bitmap1.height}, ${bitmap1.intsPerRow} integers per row`
);

// Test filling rectangles
console.log("\nTesting fillRect...");
fillRect(bitmap1, 10, 2, 20, 10, 1);
console.log("Filled rectangle (10,2,20,10):");
console.log(bitmapToString(bitmap1));

// Test aligned fill (much faster)
console.log("\nTesting aligned fill...");
const bitmap2 = createBitmap(64, 16);
fillRectAligned(bitmap2, 0, 2, 32, 10, 1);
console.log("Filled aligned rectangle (0,2,32,10):");
console.log(bitmapToString(bitmap2));

// Test BitBLT operations
console.log("\nTesting BitBLT operations...");

// Create source and destination bitmaps
const src = createBitmap(64, 16);
const dst = createBitmap(64, 16);

// Fill source with a pattern
fillRect(src, 0, 0, 32, 8, 1);
fillRect(src, 32, 8, 32, 8, 1);

console.log("Source bitmap:");
console.log(bitmapToString(src));

// Test copy operation
console.log("\nTesting COPY operation...");
bitblt(dst, 16, 4, 32, 8, src, 16, 4, BitBltOp.COPY);
console.log("Destination after COPY:");
console.log(bitmapToString(dst));

// Test OR operation
console.log("\nTesting OR operation...");
// Reset destination
fillRect(dst, 0, 0, dst.width, dst.height, 0);
// Fill with different pattern
fillRect(dst, 8, 4, 16, 8, 1);
console.log("Destination before OR:");
console.log(bitmapToString(dst));
// Perform OR operation
bitblt(dst, 16, 4, 32, 8, src, 16, 4, BitBltOp.OR);
console.log("Destination after OR:");
console.log(bitmapToString(dst));

// Test aligned BitBLT (much faster)
console.log("\nTesting aligned BitBLT...");
const srcAligned = createBitmap(64, 16);
const dstAligned = createBitmap(64, 16);

// Fill source with a pattern
fillRectAligned(srcAligned, 0, 0, 32, 8, 1);
fillRectAligned(srcAligned, 32, 8, 32, 8, 1);

console.log("Source bitmap (aligned):");
console.log(bitmapToString(srcAligned));

// Test aligned copy
bitbltAligned(dstAligned, 0, 4, 32, 8, srcAligned, 32, 4, BitBltOp.COPY);
console.log("Destination after aligned COPY:");
console.log(bitmapToString(dstAligned));

// Performance test
console.log("\nPerformance test:");
console.log("Creating large bitmaps...");
const largeSrc = createBitmap(1024, 1024);
const largeDst = createBitmap(1024, 1024);

// Fill with pattern
fillRectAligned(largeSrc, 0, 0, 1024, 512, 1);

console.log("Running standard BitBLT...");
const standardStart = Date.now();
bitblt(largeDst, 0, 0, 1024, 1024, largeSrc, 0, 0, BitBltOp.COPY);
const standardEnd = Date.now();
console.log(`Standard BitBLT took ${standardEnd - standardStart}ms`);

// Reset destination
fillRect(largeDst, 0, 0, largeDst.width, largeDst.height, 0);

console.log("Running aligned BitBLT...");
const alignedStart = Date.now();
bitbltAligned(largeDst, 0, 0, 1024, 1024, largeSrc, 0, 0, BitBltOp.COPY);
const alignedEnd = Date.now();
console.log(`Aligned BitBLT took ${alignedEnd - alignedStart}ms`);

console.log("\nAll tests completed!");
