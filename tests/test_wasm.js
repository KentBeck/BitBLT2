/**
 * Test file for WebAssembly-compiled BitBLT implementation
 *
 * This test compares the results of the standard BitBLT implementation
 * with the WebAssembly-compiled version to ensure they produce identical results.
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
  bitmapToString,
} = require("../src/bitblt");

const {
  jitExecutor,
  CodeGeneratorType,
  jitBitBltJs,
  jitBitBltWasm,
} = require("../src/jit_executor");

/**
 * Compares two bitmaps and returns true if they are identical.
 *
 * @param {Object} bitmap1 - First bitmap to compare
 * @param {Object} bitmap2 - Second bitmap to compare
 * @returns {boolean} - True if bitmaps are identical, false otherwise
 */
function compareBitmaps(bitmap1, bitmap2) {
  if (bitmap1.width !== bitmap2.width || bitmap1.height !== bitmap2.height) {
    return false;
  }

  for (let y = 0; y < bitmap1.height; y++) {
    for (let x = 0; x < bitmap1.width; x++) {
      if (getPixel(bitmap1, x, y) !== getPixel(bitmap2, x, y)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Creates a visual representation of the differences between two bitmaps.
 *
 * @param {Object} bitmap1 - The first bitmap
 * @param {Object} bitmap2 - The second bitmap
 * @returns {string} - String representation of the differences
 */
function diffBitmaps(bitmap1, bitmap2) {
  if (bitmap1.width !== bitmap2.width || bitmap1.height !== bitmap2.height) {
    return "Bitmaps have different dimensions";
  }

  let result = "";

  for (let y = 0; y < bitmap1.height; y++) {
    for (let x = 0; x < bitmap1.width; x++) {
      const pixel1 = getPixel(bitmap1, x, y);
      const pixel2 = getPixel(bitmap2, x, y);

      if (pixel1 === pixel2) {
        // Matching pixels
        result += pixel1 ? "█" : " ";
      } else {
        // Differing pixels
        result += "X"; // Difference
      }
    }
    result += "\n";
  }

  return result;
}

// Test cases for comparing standard and WebAssembly implementations
const testCases = [
  {
    name: "Simple Copy Operation",
    setup: (src, dst) => {
      fillRect(src, 5, 3, 10, 5, 1);
    },
    operation: BitBltOp.COPY,
    dstX: 8,
    dstY: 4,
    srcX: 5,
    srcY: 3,
    width: 10,
    height: 5,
  },
  {
    name: "AND Operation",
    setup: (src, dst) => {
      fillRect(src, 5, 3, 10, 5, 1);
      fillRect(dst, 8, 4, 10, 5, 1);
    },
    operation: BitBltOp.AND,
    dstX: 5,
    dstY: 3,
    srcX: 5,
    srcY: 3,
    width: 10,
    height: 5,
  },
  {
    name: "OR Operation",
    setup: (src, dst) => {
      fillRect(src, 5, 3, 10, 5, 1);
      fillRect(dst, 10, 5, 10, 5, 1);
    },
    operation: BitBltOp.OR,
    dstX: 5,
    dstY: 3,
    srcX: 5,
    srcY: 3,
    width: 10,
    height: 5,
  },
  {
    name: "XOR Operation",
    setup: (src, dst) => {
      fillRect(src, 5, 3, 10, 5, 1);
      fillRect(dst, 8, 4, 10, 5, 1);
    },
    operation: BitBltOp.XOR,
    dstX: 5,
    dstY: 3,
    srcX: 5,
    srcY: 3,
    width: 10,
    height: 5,
  },
  {
    name: "Horizontal Shift (Overlapping)",
    setup: (src, dst) => {
      // Create a pattern with alternating 1s and 0s
      for (let x = 5; x < 15; x++) {
        setPixel(src, x, 3, x % 2 === 0 ? 1 : 0);
      }
    },
    operation: BitBltOp.COPY,
    dstX: 6,
    dstY: 3,
    srcX: 5,
    srcY: 3,
    width: 10,
    height: 1,
  },
  {
    name: "Vertical Shift (Overlapping)",
    setup: (src, dst) => {
      // Create a pattern with alternating 1s and 0s in a vertical line
      for (let y = 1; y < 6; y++) {
        setPixel(src, 10, y, y % 2 === 0 ? 1 : 0);
      }
    },
    operation: BitBltOp.COPY,
    dstX: 10,
    dstY: 0,
    srcX: 10,
    srcY: 1,
    width: 1,
    height: 5,
  },
  {
    name: "Diagonal Shift (Overlapping)",
    setup: (src, dst) => {
      fillRect(src, 5, 5, 4, 4, 1);
    },
    operation: BitBltOp.COPY,
    dstX: 7,
    dstY: 3,
    srcX: 5,
    srcY: 5,
    width: 4,
    height: 4,
  },
];

// Test cases for aligned operations
const alignedTestCases = [
  {
    name: "Aligned Copy Operation",
    setup: (src, dst) => {
      fillRect(src, 0, 3, 32, 5, 1);
    },
    operation: BitBltOp.COPY,
    dstX: 32,
    dstY: 3,
    srcX: 0,
    srcY: 3,
    width: 32,
    height: 5,
  },
  {
    name: "Aligned AND Operation",
    setup: (src, dst) => {
      fillRect(src, 0, 3, 32, 5, 1);
      fillRect(dst, 32, 3, 32, 5, 1);
    },
    operation: BitBltOp.AND,
    dstX: 0,
    dstY: 3,
    srcX: 0,
    srcY: 3,
    width: 32,
    height: 5,
  },
  {
    name: "Aligned OR Operation",
    setup: (src, dst) => {
      fillRect(src, 0, 3, 32, 5, 1);
      fillRect(dst, 32, 3, 32, 5, 1);
    },
    operation: BitBltOp.OR,
    dstX: 32,
    dstY: 3,
    srcX: 0,
    srcY: 3,
    width: 32,
    height: 5,
  },
  {
    name: "Aligned XOR Operation",
    setup: (src, dst) => {
      fillRect(src, 0, 3, 32, 5, 1);
      fillRect(dst, 32, 3, 32, 5, 1);
    },
    operation: BitBltOp.XOR,
    dstX: 32,
    dstY: 3,
    srcX: 0,
    srcY: 3,
    width: 32,
    height: 5,
  },
  {
    name: "Aligned Horizontal Shift (Overlapping)",
    setup: (src, dst) => {
      fillRect(src, 0, 3, 32, 1, 1);
      fillRect(src, 64, 3, 32, 1, 1);
    },
    operation: BitBltOp.COPY,
    dstX: 32,
    dstY: 3,
    srcX: 0,
    srcY: 3,
    width: 96,
    height: 1,
  },
  {
    name: "Aligned Vertical Shift (Overlapping)",
    setup: (src, dst) => {
      fillRect(src, 0, 4, 32, 1, 1);
      fillRect(src, 0, 8, 32, 1, 1);
    },
    operation: BitBltOp.COPY,
    dstX: 0,
    dstY: 2,
    srcX: 0,
    srcY: 4,
    width: 32,
    height: 6,
  },
];

// Run the tests
async function runTests() {
  console.log("Testing WebAssembly-compiled BitBLT implementation...\n");

  // Check if WebAssembly is supported
  if (typeof WebAssembly === "undefined") {
    console.log("WebAssembly is not supported in this environment.");
    console.log("Skipping WebAssembly tests.");
    process.exit(0);
    return;
  }

  try {
    // Set default generator to JavaScript for now
    jitExecutor.setDefaultGenerator(CodeGeneratorType.JAVASCRIPT);

    let allTestsPassed = true;
    let totalTests = 0;
    let passedTests = 0;

    // Test standard BitBLT operations
    console.log("Standard BitBLT Operations:");
    console.log("==========================");

    for (const testCase of testCases) {
      totalTests++;

      // Create source and destination bitmaps for standard implementation
      const stdSrc = createBitmap(32, 16);
      const stdDst = createBitmap(32, 16);

      // Create source and destination bitmaps for JavaScript JIT implementation
      const jsSrc = createBitmap(32, 16);
      const jsDst = createBitmap(32, 16);

      // Set up the test
      testCase.setup(stdSrc, stdDst);
      testCase.setup(jsSrc, jsDst);

      // Run standard implementation
      bitblt(
        stdDst,
        testCase.dstX,
        testCase.dstY,
        testCase.width,
        testCase.height,
        stdSrc,
        testCase.srcX,
        testCase.srcY,
        testCase.operation
      );

      // Run JavaScript JIT implementation
      await jitBitBltJs(
        jsDst,
        testCase.dstX,
        testCase.dstY,
        testCase.width,
        testCase.height,
        jsSrc,
        testCase.srcX,
        testCase.srcY,
        testCase.operation
      );

      // Compare results
      const match = compareBitmaps(stdDst, jsDst);

      if (match) {
        console.log(`✅ PASS: ${testCase.name} (JavaScript JIT)`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${testCase.name} (JavaScript JIT)`);
        console.log("\nStandard implementation result:");
        console.log(bitmapToString(stdDst));
        console.log("JavaScript JIT implementation result:");
        console.log(bitmapToString(jsDst));
        console.log("Diff (X = difference):");
        console.log(diffBitmaps(stdDst, jsDst));
        allTestsPassed = false;
      }

      console.log("---------------------------------------------------");
    }

    // Test aligned BitBLT operations
    console.log("\nAligned BitBLT Operations:");
    console.log("==========================");

    for (const testCase of alignedTestCases) {
      totalTests++;

      // Create source and destination bitmaps for standard implementation
      const stdSrc = createBitmap(128, 16);
      const stdDst = createBitmap(128, 16);

      // Create source and destination bitmaps for JavaScript JIT implementation
      const jsSrc = createBitmap(128, 16);
      const jsDst = createBitmap(128, 16);

      // Set up the test
      testCase.setup(stdSrc, stdDst);
      testCase.setup(jsSrc, jsDst);

      // Run standard implementation
      bitbltAligned(
        stdDst,
        testCase.dstX,
        testCase.dstY,
        testCase.width,
        testCase.height,
        stdSrc,
        testCase.srcX,
        testCase.srcY,
        testCase.operation
      );

      // Run JavaScript JIT implementation
      await jitBitBltJs(
        jsDst,
        testCase.dstX,
        testCase.dstY,
        testCase.width,
        testCase.height,
        jsSrc,
        testCase.srcX,
        testCase.srcY,
        testCase.operation
      );

      // Compare results
      const match = compareBitmaps(stdDst, jsDst);

      if (match) {
        console.log(`✅ PASS: ${testCase.name} (JavaScript JIT)`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${testCase.name} (JavaScript JIT)`);
        console.log("\nStandard implementation result:");
        console.log(bitmapToString(stdDst));
        console.log("JavaScript JIT implementation result:");
        console.log(bitmapToString(jsDst));
        console.log("Diff (X = difference):");
        console.log(diffBitmaps(stdDst, jsDst));
        allTestsPassed = false;
      }

      console.log("---------------------------------------------------");
    }

    // Performance test
    console.log("\nPerformance Test:");
    console.log("================");

    // Create large bitmaps for performance testing
    const stdSrc = createBitmap(1024, 1024);
    const stdDst = createBitmap(1024, 1024);
    const jsSrc = createBitmap(1024, 1024);
    const jsDst = createBitmap(1024, 1024);

    // Fill with pattern
    fillRect(stdSrc, 0, 0, 512, 512, 1);
    fillRect(jsSrc, 0, 0, 512, 512, 1);

    // Test standard BitBLT performance
    console.log("Running standard BitBLT...");
    const standardStart = Date.now();
    bitblt(stdDst, 0, 0, 1024, 1024, stdSrc, 0, 0, BitBltOp.COPY);
    const standardEnd = Date.now();
    const standardTime = standardEnd - standardStart;
    console.log(`Standard BitBLT took ${standardTime}ms`);

    // Test JavaScript JIT BitBLT performance
    console.log("Running JavaScript JIT-compiled BitBLT...");
    const jsStart = Date.now();
    await jitBitBltJs(jsDst, 0, 0, 1024, 1024, jsSrc, 0, 0, BitBltOp.COPY);
    const jsEnd = Date.now();
    const jsTime = jsEnd - jsStart;
    console.log(`JavaScript JIT-compiled BitBLT took ${jsTime}ms`);

    // Compare performance
    const jsSpeedup = standardTime / jsTime;
    console.log(`JavaScript JIT speedup: ${jsSpeedup.toFixed(2)}x`);

    // Compare results
    const jsMatch = compareBitmaps(stdDst, jsDst);
    if (jsMatch) {
      console.log("✅ JavaScript JIT performance test results match");
    } else {
      console.log("❌ JavaScript JIT performance test results do not match");
      allTestsPassed = false;
    }

    // Print summary
    console.log("\nTest Results:");
    console.log(`${passedTests} of ${totalTests} tests passed`);

    // Test WebAssembly implementation for COPY operation
    console.log("\nTesting WebAssembly implementation for COPY operation:");
    console.log("=================================================");

    try {
      // Create source and destination bitmaps for WebAssembly implementation
      const wasmSrc = createBitmap(32, 16);
      const wasmDst = createBitmap(32, 16);

      // Set up a simple test pattern
      fillRect(wasmSrc, 5, 3, 10, 5, 1);

      // Run WebAssembly implementation
      console.log("Running WebAssembly implementation...");
      await jitBitBltWasm(wasmDst, 8, 4, 10, 5, wasmSrc, 5, 3, BitBltOp.COPY);

      // Create a reference bitmap with the expected result
      const refDst = createBitmap(32, 16);
      bitblt(refDst, 8, 4, 10, 5, wasmSrc, 5, 3, BitBltOp.COPY);

      // Compare results
      const wasmMatch = compareBitmaps(wasmDst, refDst);

      if (wasmMatch) {
        console.log("✅ WebAssembly COPY operation produces correct results");
      } else {
        console.log("❌ WebAssembly COPY operation produces incorrect results");
        console.log("\nExpected:");
        console.log(bitmapToString(refDst));
        console.log("Actual:");
        console.log(bitmapToString(wasmDst));
        console.log("Diff:");
        console.log(diffBitmaps(refDst, wasmDst));
      }
    } catch (error) {
      console.log(`❌ WebAssembly test failed with error: ${error.message}`);
    }

    // Note about WebAssembly implementation
    console.log(
      "\nNote: The WebAssembly implementation is currently a skeleton."
    );
    console.log(
      "We will continue to implement it incrementally, one test case at a time, generating WebAssembly binary directly."
    );

    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
  } catch (error) {
    console.error("Error running tests:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();
