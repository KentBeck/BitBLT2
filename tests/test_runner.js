/**
 * BitBLT Test Runner
 *
 * Runs a series of test patterns and shows detailed information for any failures,
 * including actual results, expected results, and the differences between them.
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
 * @param {Object} actual - The actual bitmap
 * @param {Object} expected - The expected bitmap
 * @returns {string} - String representation of the differences
 */
function diffBitmaps(actual, expected) {
  if (actual.width !== expected.width || actual.height !== expected.height) {
    return "Bitmaps have different dimensions";
  }

  let result = "";

  for (let y = 0; y < actual.height; y++) {
    for (let x = 0; x < actual.width; x++) {
      const actualPixel = getPixel(actual, x, y);
      const expectedPixel = getPixel(expected, x, y);

      if (actualPixel === expectedPixel) {
        // Matching pixels
        result += actualPixel ? "█" : " ";
      } else {
        // Differing pixels
        if (actualPixel === 1 && expectedPixel === 0) {
          result += "X"; // Extra pixel in actual
        } else {
          result += "O"; // Missing pixel in actual
        }
      }
    }
    result += "\n";
  }

  return result;
}

/**
 * Test case class to define a test and its expected result.
 */
class TestCase {
  /**
   * Creates a new test case.
   *
   * @param {string} name - Name of the test case
   * @param {Function} setupFn - Function to set up the test (receives a bitmap to modify)
   * @param {Function} testFn - Function that performs the operation to test
   * @param {Function} expectedFn - Function that sets up the expected result (receives a bitmap to modify)
   */
  constructor(name, setupFn, testFn, expectedFn) {
    this.name = name;
    this.setupFn = setupFn;
    this.testFn = testFn;
    this.expectedFn = expectedFn;
  }

  /**
   * Runs the test case.
   *
   * @param {number} width - Width of the test bitmaps
   * @param {number} height - Height of the test bitmaps
   * @returns {Object} - Test result object
   */
  run(width, height) {
    // Create source, destination, and expected bitmaps
    const src = createBitmap(width, height);
    const dst = createBitmap(width, height);
    const expected = createBitmap(width, height);

    // Set up the test
    this.setupFn(src, dst);

    // Run the test operation
    this.testFn(src, dst);

    // Set up the expected result
    this.expectedFn(expected);

    // Compare results
    const passed = compareBitmaps(dst, expected);

    return {
      name: this.name,
      passed,
      actual: dst,
      expected,
      diff: passed ? null : diffBitmaps(dst, expected),
    };
  }
}

/**
 * Test runner class to run multiple test cases.
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
    };
  }

  /**
   * Adds a test case to the runner.
   *
   * @param {TestCase} testCase - The test case to add
   */
  addTest(testCase) {
    this.tests.push(testCase);
  }

  /**
   * Runs all test cases.
   *
   * @param {number} width - Width of the test bitmaps
   * @param {number} height - Height of the test bitmaps
   */
  runTests(width = 32, height = 16) {
    console.log(`Running ${this.tests.length} tests...\n`);

    this.results.total = this.tests.length;
    this.results.passed = 0;
    this.results.failed = 0;

    for (const test of this.tests) {
      const result = test.run(width, height);

      if (result.passed) {
        console.log(`✅ PASS: ${result.name}`);
        this.results.passed++;
      } else {
        console.log(`❌ FAIL: ${result.name}`);
        console.log("\nActual:");
        console.log(bitmapToString(result.actual));
        console.log("Expected:");
        console.log(bitmapToString(result.expected));
        console.log("Diff (X = extra pixel, O = missing pixel):");
        console.log(result.diff);
        this.results.failed++;
      }

      console.log("---------------------------------------------------");
    }

    console.log(
      `\nTest Results: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.total} total`
    );

    return this.results.failed === 0;
  }
}

// Define test cases
const testCases = [
  // Test Case 1: Simple Copy
  new TestCase(
    "Simple Copy Operation",
    (src, dst) => {
      // Setup: Fill a rectangle in the source
      fillRect(src, 5, 3, 10, 5, 1);
    },
    (src, dst) => {
      // Test: Copy from source to destination
      bitblt(dst, 8, 4, 10, 5, src, 5, 3, BitBltOp.COPY);
    },
    (expected) => {
      // Expected: Rectangle should be at the new position
      fillRect(expected, 8, 4, 10, 5, 1);
    }
  ),

  // Test Case 2: AND Operation
  new TestCase(
    "AND Operation",
    (src, dst) => {
      // Setup: Fill rectangles in source and destination with overlap
      fillRect(src, 5, 3, 10, 5, 1);
      fillRect(dst, 8, 4, 10, 5, 1);
    },
    (src, dst) => {
      // Test: AND operation
      bitblt(dst, 5, 3, 10, 5, src, 5, 3, BitBltOp.AND);
    },
    (expected) => {
      // Expected: The destination is only modified within the blit rectangle
      // AND operation: Only pixels that are 1 in both source and original destination remain 1
      fillRect(expected, 8, 4, 10, 5, 1); // First set up the original destination
      // Now apply the AND operation in the blit rectangle (5,3,10,5)
      // Only the overlapping area (8,4) to (15,8) will have 1s
    }
  ),

  // Test Case 3: OR Operation
  new TestCase(
    "OR Operation",
    (src, dst) => {
      // Setup: Fill rectangles in source and destination with partial overlap
      fillRect(src, 5, 3, 10, 5, 1);
      fillRect(dst, 10, 5, 10, 5, 1);
    },
    (src, dst) => {
      // Test: OR operation
      bitblt(dst, 5, 3, 10, 5, src, 5, 3, BitBltOp.OR);
    },
    (expected) => {
      // Expected: Union of both rectangles
      fillRect(expected, 5, 3, 10, 5, 1);
      fillRect(expected, 10, 5, 10, 5, 1);
    }
  ),

  // Test Case 4: XOR Operation
  new TestCase(
    "XOR Operation",
    (src, dst) => {
      // Setup: Fill rectangles in source and destination with overlap
      fillRect(src, 5, 3, 10, 5, 1);
      fillRect(dst, 8, 4, 10, 5, 1);
    },
    (src, dst) => {
      // Test: XOR operation
      bitblt(dst, 5, 3, 10, 5, src, 5, 3, BitBltOp.XOR);
    },
    (expected) => {
      // Based on the debug test, here's the correct pattern for XOR
      // First, set up the destination before the operation
      fillRect(expected, 8, 4, 10, 5, 1);

      // Now manually apply XOR for each pixel in the blit rectangle
      for (let y = 3; y < 8; y++) {
        for (let x = 5; x < 15; x++) {
          // Source pixel is 1 for the entire rectangle (5,3,10,5)
          const srcPixel = 1;

          // Original destination pixel is 1 only in the overlap area
          const originalDstPixel = x >= 8 && x < 18 && y >= 4 ? 1 : 0;

          // Apply XOR operation
          const xorResult = srcPixel ^ originalDstPixel;

          // Set the result in the expected bitmap
          setPixel(expected, x, y, xorResult);
        }
      }
    }
  ),

  // Test Case 5: Aligned Copy
  new TestCase(
    "Aligned Copy Operation",
    (src, dst) => {
      // Setup: Fill an aligned rectangle in the source
      fillRectAligned(src, 0, 3, 32, 5, 1);
    },
    (src, dst) => {
      // Test: Copy from source to destination using aligned operation
      bitbltAligned(dst, 0, 5, 32, 5, src, 0, 3, BitBltOp.COPY);
    },
    (expected) => {
      // Expected: Rectangle should be at the new position
      fillRectAligned(expected, 0, 5, 32, 5, 1);
    }
  ),

  // Test Case 6: Clipping Test
  new TestCase(
    "Clipping at Bitmap Boundaries",
    (src, dst) => {
      // Setup: Fill a rectangle in the source near the edge
      fillRect(src, 25, 3, 10, 5, 1);
    },
    (src, dst) => {
      // Test: Try to copy beyond the bitmap boundaries
      bitblt(dst, 25, 3, 10, 5, src, 25, 3, BitBltOp.COPY);
    },
    (expected) => {
      // Expected: Only the part within bounds should be copied
      fillRect(expected, 25, 3, 7, 5, 1); // Clipped at width=32
    }
  ),
];

// Create and run the test runner
const runner = new TestRunner();

// Add all test cases
testCases.forEach((testCase) => runner.addTest(testCase));

// Run the tests
const allTestsPassed = runner.runTests();

// Exit with appropriate code
process.exit(allTestsPassed ? 0 : 1);
