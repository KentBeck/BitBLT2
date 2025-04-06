/**
 * Test file to measure the performance difference between standard and aligned BitBLT operations
 */

const {
  // Enums
  BitBltOp,
  
  // Functions
  createBitmap,
  bitblt,
  bitbltAligned,
  fillRect,
  fillRectAligned,
  bitmapToString
} = require('../src/bitblt');

const {
  jitBitBlt,
  jitBitBltAligned
} = require('../src/jit_compiler');

// Test parameters
const BITMAP_SIZE = 1024;
const ITERATIONS = 10;
const OPERATIONS = [BitBltOp.COPY, BitBltOp.AND, BitBltOp.OR, BitBltOp.XOR];
const OPERATION_NAMES = ['COPY', 'AND', 'OR', 'XOR'];

// Create test bitmaps
console.log(`Creating ${BITMAP_SIZE}x${BITMAP_SIZE} bitmaps for testing...`);
const standardSrc = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const standardDst = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const alignedSrc = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const alignedDst = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const jitStandardSrc = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const jitStandardDst = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const jitAlignedSrc = createBitmap(BITMAP_SIZE, BITMAP_SIZE);
const jitAlignedDst = createBitmap(BITMAP_SIZE, BITMAP_SIZE);

// Fill source bitmaps with a pattern
console.log('Filling bitmaps with test patterns...');
fillRect(standardSrc, 0, 0, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);
fillRect(jitStandardSrc, 0, 0, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);

// For aligned operations, we need to ensure the pattern is aligned to 32-bit boundaries
fillRectAligned(alignedSrc, 0, 0, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);
fillRectAligned(jitAlignedSrc, 0, 0, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);

// Fill destination bitmaps with a different pattern for AND, OR, XOR operations
fillRect(standardDst, BITMAP_SIZE / 4, BITMAP_SIZE / 4, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);
fillRect(jitStandardDst, BITMAP_SIZE / 4, BITMAP_SIZE / 4, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);
fillRectAligned(alignedDst, BITMAP_SIZE / 4, BITMAP_SIZE / 4, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);
fillRectAligned(jitAlignedDst, BITMAP_SIZE / 4, BITMAP_SIZE / 4, BITMAP_SIZE / 2, BITMAP_SIZE / 2, 1);

// Results table
console.log('\nPerformance Comparison: Standard vs. Aligned BitBLT Operations');
console.log('==============================================================');
console.log('Operation | Standard (ms) | Aligned (ms) | Speedup | JIT Standard (ms) | JIT Aligned (ms) | JIT Speedup');
console.log('---------|---------------|-------------|---------|-------------------|-----------------|------------');

// Test each operation
for (let i = 0; i < OPERATIONS.length; i++) {
  const op = OPERATIONS[i];
  const opName = OPERATION_NAMES[i];
  
  // Standard BitBLT
  const standardStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    bitblt(standardDst, 0, 0, BITMAP_SIZE, BITMAP_SIZE, standardSrc, 0, 0, op);
  }
  const standardEnd = Date.now();
  const standardTime = (standardEnd - standardStart) / ITERATIONS;
  
  // Aligned BitBLT
  const alignedStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    bitbltAligned(alignedDst, 0, 0, BITMAP_SIZE, BITMAP_SIZE, alignedSrc, 0, 0, op);
  }
  const alignedEnd = Date.now();
  const alignedTime = (alignedEnd - alignedStart) / ITERATIONS;
  
  // JIT Standard BitBLT
  const jitStandardStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    jitBitBlt(jitStandardDst, 0, 0, BITMAP_SIZE, BITMAP_SIZE, jitStandardSrc, 0, 0, op);
  }
  const jitStandardEnd = Date.now();
  const jitStandardTime = (jitStandardEnd - jitStandardStart) / ITERATIONS;
  
  // JIT Aligned BitBLT
  const jitAlignedStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    jitBitBltAligned(jitAlignedDst, 0, 0, BITMAP_SIZE, BITMAP_SIZE, jitAlignedSrc, 0, 0, op);
  }
  const jitAlignedEnd = Date.now();
  const jitAlignedTime = (jitAlignedEnd - jitAlignedStart) / ITERATIONS;
  
  // Calculate speedups
  const standardSpeedup = standardTime / alignedTime;
  const jitSpeedup = jitStandardTime / jitAlignedTime;
  
  // Print results
  console.log(`${opName.padEnd(9)} | ${standardTime.toFixed(2).padStart(13)} | ${alignedTime.toFixed(2).padStart(11)} | ${standardSpeedup.toFixed(2).padStart(7)} | ${jitStandardTime.toFixed(2).padStart(17)} | ${jitAlignedTime.toFixed(2).padStart(15)} | ${jitSpeedup.toFixed(2).padStart(10)}`);
}

// Additional tests for different bitmap sizes
console.log('\nPerformance Scaling with Bitmap Size (COPY operation)');
console.log('====================================================');
console.log('Size     | Standard (ms) | Aligned (ms) | Speedup | JIT Standard (ms) | JIT Aligned (ms) | JIT Speedup');
console.log('---------|---------------|-------------|---------|-------------------|-----------------|------------');

const sizes = [128, 256, 512, 1024, 2048];

for (const size of sizes) {
  // Create bitmaps of the current size
  const stdSrc = createBitmap(size, size);
  const stdDst = createBitmap(size, size);
  const algSrc = createBitmap(size, size);
  const algDst = createBitmap(size, size);
  const jitStdSrc = createBitmap(size, size);
  const jitStdDst = createBitmap(size, size);
  const jitAlgSrc = createBitmap(size, size);
  const jitAlgDst = createBitmap(size, size);
  
  // Fill with patterns
  fillRect(stdSrc, 0, 0, size / 2, size / 2, 1);
  fillRectAligned(algSrc, 0, 0, size / 2, size / 2, 1);
  fillRect(jitStdSrc, 0, 0, size / 2, size / 2, 1);
  fillRectAligned(jitAlgSrc, 0, 0, size / 2, size / 2, 1);
  
  // Standard BitBLT
  const standardStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    bitblt(stdDst, 0, 0, size, size, stdSrc, 0, 0, BitBltOp.COPY);
  }
  const standardEnd = Date.now();
  const standardTime = (standardEnd - standardStart) / ITERATIONS;
  
  // Aligned BitBLT
  const alignedStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    bitbltAligned(algDst, 0, 0, size, size, algSrc, 0, 0, BitBltOp.COPY);
  }
  const alignedEnd = Date.now();
  const alignedTime = (alignedEnd - alignedStart) / ITERATIONS;
  
  // JIT Standard BitBLT
  const jitStandardStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    jitBitBlt(jitStdDst, 0, 0, size, size, jitStdSrc, 0, 0, BitBltOp.COPY);
  }
  const jitStandardEnd = Date.now();
  const jitStandardTime = (jitStandardEnd - jitStandardStart) / ITERATIONS;
  
  // JIT Aligned BitBLT
  const jitAlignedStart = Date.now();
  for (let j = 0; j < ITERATIONS; j++) {
    jitBitBltAligned(jitAlgDst, 0, 0, size, size, jitAlgSrc, 0, 0, BitBltOp.COPY);
  }
  const jitAlignedEnd = Date.now();
  const jitAlignedTime = (jitAlignedEnd - jitAlignedStart) / ITERATIONS;
  
  // Calculate speedups
  const standardSpeedup = standardTime / alignedTime;
  const jitSpeedup = jitStandardTime / jitAlignedTime;
  
  // Print results
  console.log(`${size.toString().padEnd(9)} | ${standardTime.toFixed(2).padStart(13)} | ${alignedTime.toFixed(2).padStart(11)} | ${standardSpeedup.toFixed(2).padStart(7)} | ${jitStandardTime.toFixed(2).padStart(17)} | ${jitAlignedTime.toFixed(2).padStart(15)} | ${jitSpeedup.toFixed(2).padStart(10)}`);
}

console.log('\nTest completed!');
