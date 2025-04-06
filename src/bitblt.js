/**
 * BitBLT2 - A JavaScript implementation of Bit Block Transfer with packed pixels
 *
 * This implementation packs 32 pixels into each 32-bit integer for memory efficiency
 * and faster bitwise operations.
 */

/**
 * Enum for BitBLT operation types
 * @enum {number}
 */
const BitBltOp = {
  /** Copy source to destination */
  COPY: 0,
  /** Bitwise AND of source and destination */
  AND: 1,
  /** Bitwise OR of source and destination */
  OR: 2,
  /** Bitwise XOR of source and destination */
  XOR: 3,
};

/**
 * Creates a new bitmap with the specified dimensions.
 * Each pixel is represented as a single bit (0 or 1).
 * 32 pixels are packed into each 32-bit integer.
 *
 * @param {number} width - Width of the bitmap in pixels
 * @param {number} height - Height of the bitmap in pixels
 * @returns {Object} - The created bitmap object
 */
function createBitmap(width, height) {
  // Calculate how many 32-bit integers we need per row
  // Each integer holds 32 pixels, so we divide width by 32 and round up
  const intsPerRow = Math.ceil(width / 32);

  // Create the data array to hold the bitmap data
  const data = new Array(height * intsPerRow).fill(0);

  return {
    width,
    height,
    intsPerRow,
    data,
  };
}

/**
 * Sets a pixel in the bitmap to 0 or 1.
 *
 * @param {Object} bitmap - The bitmap to modify
 * @param {number} x - X coordinate of the pixel
 * @param {number} y - Y coordinate of the pixel
 * @param {number} value - Value to set (0 or 1)
 */
function setPixel(bitmap, x, y, value) {
  if (x < 0 || x >= bitmap.width || y < 0 || y >= bitmap.height) {
    return; // Out of bounds
  }

  // Calculate which integer in the data array contains this pixel
  const intIndex = y * bitmap.intsPerRow + Math.floor(x / 32);

  // Calculate which bit within that integer represents this pixel
  const bitIndex = 31 - (x % 32); // We count from the most significant bit

  if (value === 1) {
    // Set the bit to 1
    bitmap.data[intIndex] |= 1 << bitIndex;
  } else {
    // Set the bit to 0
    bitmap.data[intIndex] &= ~(1 << bitIndex);
  }
}

/**
 * Gets the value of a pixel in the bitmap (0 or 1).
 *
 * @param {Object} bitmap - The bitmap to read from
 * @param {number} x - X coordinate of the pixel
 * @param {number} y - Y coordinate of the pixel
 * @returns {number} - The pixel value (0 or 1)
 */
function getPixel(bitmap, x, y) {
  if (x < 0 || x >= bitmap.width || y < 0 || y >= bitmap.height) {
    return 0; // Out of bounds
  }

  // Calculate which integer in the data array contains this pixel
  const intIndex = y * bitmap.intsPerRow + Math.floor(x / 32);

  // Calculate which bit within that integer represents this pixel
  const bitIndex = 31 - (x % 32); // We count from the most significant bit

  // Extract and return the bit value
  return bitmap.data[intIndex] & (1 << bitIndex) ? 1 : 0;
}

/**
 * BitBLT operation - transfers a rectangular block of pixels from source to destination bitmap.
 *
 * @param {Object} dst - Destination bitmap
 * @param {number} dstX - X coordinate in destination bitmap
 * @param {number} dstY - Y coordinate in destination bitmap
 * @param {number} width - Width of the rectangle to transfer
 * @param {number} height - Height of the rectangle to transfer
 * @param {Object} src - Source bitmap
 * @param {number} srcX - X coordinate in source bitmap
 * @param {number} srcY - Y coordinate in source bitmap
 * @param {number} op - Operation to perform: BitBltOp.COPY, BitBltOp.AND, BitBltOp.OR, BitBltOp.XOR
 */
function bitblt(
  dst,
  dstX,
  dstY,
  width,
  height,
  src,
  srcX,
  srcY,
  op = BitBltOp.COPY
) {
  // Validate input parameters
  if (width <= 0 || height <= 0) {
    return; // Nothing to do
  }

  // Clip the operation to the bounds of both bitmaps
  const srcMaxX = Math.min(srcX + width, src.width);
  const srcMaxY = Math.min(srcY + height, src.height);
  const dstMaxX = Math.min(dstX + width, dst.width);
  const dstMaxY = Math.min(dstY + height, dst.height);

  // Calculate actual dimensions after clipping
  const actualWidth = Math.min(srcMaxX - srcX, dstMaxX - dstX);
  const actualHeight = Math.min(srcMaxY - srcY, dstMaxY - dstY);

  // Perform the bit block transfer
  for (let y = 0; y < actualHeight; y++) {
    for (let x = 0; x < actualWidth; x++) {
      const srcPixel = getPixel(src, srcX + x, srcY + y);
      const dstPixel = getPixel(dst, dstX + x, dstY + y);

      let resultPixel;

      // Apply the requested operation
      switch (op) {
        case BitBltOp.AND:
          resultPixel = srcPixel & dstPixel;
          break;
        case BitBltOp.OR:
          resultPixel = srcPixel | dstPixel;
          break;
        case BitBltOp.XOR:
          resultPixel = srcPixel ^ dstPixel;
          break;
        case BitBltOp.COPY:
        default:
          resultPixel = srcPixel;
          break;
      }

      setPixel(dst, dstX + x, dstY + y, resultPixel);
    }
  }
}

/**
 * Optimized BitBLT for aligned blocks - much faster when blocks align with 32-bit boundaries
 *
 * @param {Object} dst - Destination bitmap
 * @param {number} dstX - X coordinate in destination bitmap (must be multiple of 32)
 * @param {number} dstY - Y coordinate in destination bitmap
 * @param {number} width - Width of the rectangle to transfer (must be multiple of 32)
 * @param {number} height - Height of the rectangle to transfer
 * @param {Object} src - Source bitmap
 * @param {number} srcX - X coordinate in source bitmap (must be multiple of 32)
 * @param {number} srcY - Y coordinate in source bitmap
 * @param {number} op - Operation to perform: BitBltOp.COPY, BitBltOp.AND, BitBltOp.OR, BitBltOp.XOR
 */
function bitbltAligned(
  dst,
  dstX,
  dstY,
  width,
  height,
  src,
  srcX,
  srcY,
  op = BitBltOp.COPY
) {
  // Validate that coordinates are aligned to 32-bit boundaries
  if (dstX % 32 !== 0 || srcX % 32 !== 0 || width % 32 !== 0) {
    // Fall back to regular bitblt for unaligned operations
    return bitblt(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  }

  // Calculate starting indices and how many integers per row to copy
  const srcStartRow = srcY;
  const dstStartRow = dstY;
  const intsPerRow = width / 32;

  // Calculate starting integer indices
  const srcStartIntX = srcX / 32;
  const dstStartIntX = dstX / 32;

  // Perform the operation directly on the 32-bit integers
  for (let y = 0; y < height; y++) {
    const srcRowIndex = (srcStartRow + y) * src.intsPerRow + srcStartIntX;
    const dstRowIndex = (dstStartRow + y) * dst.intsPerRow + dstStartIntX;

    for (let i = 0; i < intsPerRow; i++) {
      const srcInt = src.data[srcRowIndex + i];
      const dstInt = dst.data[dstRowIndex + i];

      // Apply the requested operation
      switch (op) {
        case BitBltOp.AND:
          dst.data[dstRowIndex + i] = srcInt & dstInt;
          break;
        case BitBltOp.OR:
          dst.data[dstRowIndex + i] = srcInt | dstInt;
          break;
        case BitBltOp.XOR:
          dst.data[dstRowIndex + i] = srcInt ^ dstInt;
          break;
        case BitBltOp.COPY:
        default:
          dst.data[dstRowIndex + i] = srcInt;
          break;
      }
    }
  }
}

/**
 * Fills a rectangular area of the bitmap with a specified value (0 or 1).
 *
 * @param {Object} bitmap - The bitmap to modify
 * @param {number} x - X coordinate of the top-left corner
 * @param {number} y - Y coordinate of the top-left corner
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {number} value - Value to fill with (0 or 1)
 */
function fillRect(bitmap, x, y, width, height, value) {
  for (let row = y; row < y + height && row < bitmap.height; row++) {
    for (let col = x; col < x + width && col < bitmap.width; col++) {
      setPixel(bitmap, col, row, value);
    }
  }
}

/**
 * Optimized fill for aligned rectangles - much faster when rectangles align with 32-bit boundaries
 *
 * @param {Object} bitmap - The bitmap to modify
 * @param {number} x - X coordinate of the top-left corner (must be multiple of 32)
 * @param {number} y - Y coordinate of the top-left corner
 * @param {number} width - Width of the rectangle (must be multiple of 32)
 * @param {number} height - Height of the rectangle
 * @param {number} value - Value to fill with (0 or 1)
 */
function fillRectAligned(bitmap, x, y, width, height, value) {
  // Validate that coordinates are aligned to 32-bit boundaries
  if (x % 32 !== 0 || width % 32 !== 0) {
    // Fall back to regular fillRect for unaligned operations
    return fillRect(bitmap, x, y, width, height, value);
  }

  // Calculate starting indices and how many integers per row to fill
  const startRow = y;
  const intsPerRow = width / 32;
  const startIntX = x / 32;

  // The value to fill with (all 0s or all 1s)
  const fillValue = value === 1 ? 0xffffffff : 0;

  // Perform the fill operation directly on the 32-bit integers
  for (let row = 0; row < height && startRow + row < bitmap.height; row++) {
    const rowIndex = (startRow + row) * bitmap.intsPerRow + startIntX;

    for (let i = 0; i < intsPerRow && startIntX + i < bitmap.intsPerRow; i++) {
      bitmap.data[rowIndex + i] = fillValue;
    }
  }
}

/**
 * Converts the bitmap to a string representation for debugging.
 *
 * @param {Object} bitmap - The bitmap to convert
 * @returns {string} - String representation of the bitmap
 */
function bitmapToString(bitmap) {
  let result = "";

  for (let y = 0; y < bitmap.height; y++) {
    for (let x = 0; x < bitmap.width; x++) {
      result += getPixel(bitmap, x, y) ? "█" : " ";
    }
    result += "\n";
  }

  return result;
}

// Export the functions and enums
module.exports = {
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
};
