/**
 * BitBLT2 JIT Compiler
 * 
 * A simple JIT compiler that generates optimized JavaScript functions for BitBLT operations.
 * This is the first step toward more advanced JIT compilation strategies (WebAssembly, ARM, x86).
 */

const { BitBltOp } = require('./bitblt');

/**
 * Generates a specialized JavaScript function for a specific BitBLT operation.
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
 * @returns {Function} - A specialized function that performs the BitBLT operation
 */
function generateBitBltFunction(dst, dstX, dstY, width, height, src, srcX, srcY, op) {
  // Clip the operation to the bounds of both bitmaps
  const srcMaxX = Math.min(srcX + width, src.width);
  const srcMaxY = Math.min(srcY + height, src.height);
  const dstMaxX = Math.min(dstX + width, dst.width);
  const dstMaxY = Math.min(dstY + height, dst.height);
  
  // Calculate actual dimensions after clipping
  const actualWidth = Math.min(srcMaxX - srcX, dstMaxX - dstX);
  const actualHeight = Math.min(srcMaxY - srcY, dstMaxY - dstY);
  
  // Check if source and destination are the same bitmap and regions overlap
  const sameBuffer = src === dst;
  const overlapHorizontal = sameBuffer && 
    ((srcX < dstX && srcX + actualWidth > dstX) || // Source starts before dest and overlaps
     (dstX < srcX && dstX + actualWidth > srcX));  // Dest starts before source and overlaps
  const overlapVertical = sameBuffer && 
    ((srcY < dstY && srcY + actualHeight > dstY) || // Source starts before dest and overlaps
     (dstY < srcY && dstY + actualHeight > srcY));  // Dest starts before source and overlaps
  
  // Determine the direction to process pixels based on overlap
  let xStart, xEnd, xStep;
  let yStart, yEnd, yStep;
  
  if (overlapHorizontal && srcX < dstX) {
    // Source is to the left of destination, process right-to-left
    xStart = actualWidth - 1;
    xEnd = -1;
    xStep = -1;
  } else {
    // No horizontal overlap or source is to the right of destination, process left-to-right
    xStart = 0;
    xEnd = actualWidth;
    xStep = 1;
  }
  
  if (overlapVertical && srcY < dstY) {
    // Source is above destination, process bottom-to-top
    yStart = actualHeight - 1;
    yEnd = -1;
    yStep = -1;
  } else {
    // No vertical overlap or source is below destination, process top-to-bottom
    yStart = 0;
    yEnd = actualHeight;
    yStep = 1;
  }
  
  // Generate the operation code based on the operation type
  let operationCode;
  switch (op) {
    case BitBltOp.AND:
      operationCode = 'srcPixel & dstPixel';
      break;
    case BitBltOp.OR:
      operationCode = 'srcPixel | dstPixel';
      break;
    case BitBltOp.XOR:
      operationCode = 'srcPixel ^ dstPixel';
      break;
    case BitBltOp.COPY:
    default:
      operationCode = 'srcPixel';
      break;
  }
  
  // Generate the function code
  const functionCode = `
    // Generated BitBLT function
    return function(src, dst) {
      // Process pixels in the correct order for overlapping regions
      for (let y = ${yStart}; y !== ${yEnd}; y += ${yStep}) {
        for (let x = ${xStart}; x !== ${xEnd}; x += ${xStep}) {
          // Calculate source and destination pixel positions
          const srcPixelX = ${srcX} + x;
          const srcPixelY = ${srcY} + y;
          const dstPixelX = ${dstX} + x;
          const dstPixelY = ${dstY} + y;
          
          // Calculate which integers in the data arrays contain these pixels
          const srcIntIndex = srcPixelY * src.intsPerRow + Math.floor(srcPixelX / 32);
          const dstIntIndex = dstPixelY * dst.intsPerRow + Math.floor(dstPixelX / 32);
          
          // Calculate which bits within those integers represent these pixels
          const srcBitIndex = 31 - (srcPixelX % 32);
          const dstBitIndex = 31 - (dstPixelX % 32);
          
          // Extract the source and destination pixel values
          const srcPixel = (src.data[srcIntIndex] & (1 << srcBitIndex)) ? 1 : 0;
          const dstPixel = (dst.data[dstIntIndex] & (1 << dstBitIndex)) ? 1 : 0;
          
          // Apply the operation
          const resultPixel = ${operationCode};
          
          // Set the result pixel
          if (resultPixel === 1) {
            dst.data[dstIntIndex] |= (1 << dstBitIndex);
          } else {
            dst.data[dstIntIndex] &= ~(1 << dstBitIndex);
          }
        }
      }
    };
  `;
  
  // Create and return the function
  // eslint-disable-next-line no-new-func
  return new Function('src', 'dst', functionCode)(src, dst);
}

/**
 * JIT-compiled version of BitBLT.
 * Generates and executes a specialized function for the specific BitBLT operation.
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
function jitBitBlt(dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) {
  // Validate input parameters
  if (width <= 0 || height <= 0) {
    return; // Nothing to do
  }
  
  // Generate a specialized function for this specific BitBLT operation
  const bitBltFunction = generateBitBltFunction(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  
  // Execute the generated function
  bitBltFunction(src, dst);
}

/**
 * JIT-compiled version of aligned BitBLT.
 * For aligned operations, we can generate even more optimized code.
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
function jitBitBltAligned(dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) {
  // Validate that coordinates are aligned to 32-bit boundaries
  if (dstX % 32 !== 0 || srcX % 32 !== 0 || width % 32 !== 0) {
    // Fall back to regular jitBitBlt for unaligned operations
    return jitBitBlt(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  }
  
  // Calculate starting indices and how many integers per row to copy
  const srcStartRow = srcY;
  const dstStartRow = dstY;
  const intsPerRow = width / 32;
  
  // Calculate starting integer indices
  const srcStartIntX = srcX / 32;
  const dstStartIntX = dstX / 32;
  
  // Check if source and destination are the same bitmap and regions overlap
  const sameBuffer = src === dst;
  const overlapHorizontal = sameBuffer && 
    ((srcStartIntX < dstStartIntX && srcStartIntX + intsPerRow > dstStartIntX) || // Source starts before dest and overlaps
     (dstStartIntX < srcStartIntX && dstStartIntX + intsPerRow > srcStartIntX));  // Dest starts before source and overlaps
  const overlapVertical = sameBuffer && 
    ((srcStartRow < dstStartRow && srcStartRow + height > dstStartRow) || // Source starts before dest and overlaps
     (dstStartRow < srcStartRow && dstStartRow + height > srcStartRow));  // Dest starts before source and overlaps
  
  // Determine the direction to process integers based on overlap
  let iStart, iEnd, iStep;
  let yStart, yEnd, yStep;
  
  if (overlapHorizontal && srcStartIntX < dstStartIntX) {
    // Source is to the left of destination, process right-to-left
    iStart = intsPerRow - 1;
    iEnd = -1;
    iStep = -1;
  } else {
    // No horizontal overlap or source is to the right of destination, process left-to-right
    iStart = 0;
    iEnd = intsPerRow;
    iStep = 1;
  }
  
  if (overlapVertical && srcStartRow < dstStartRow) {
    // Source is above destination, process bottom-to-top
    yStart = height - 1;
    yEnd = -1;
    yStep = -1;
  } else {
    // No vertical overlap or source is below destination, process top-to-bottom
    yStart = 0;
    yEnd = height;
    yStep = 1;
  }
  
  // Generate the operation code based on the operation type
  let operationCode;
  switch (op) {
    case BitBltOp.AND:
      operationCode = 'srcInt & dstInt';
      break;
    case BitBltOp.OR:
      operationCode = 'srcInt | dstInt';
      break;
    case BitBltOp.XOR:
      operationCode = 'srcInt ^ dstInt';
      break;
    case BitBltOp.COPY:
    default:
      operationCode = 'srcInt';
      break;
  }
  
  // Generate the function code
  const functionCode = `
    // Generated aligned BitBLT function
    return function(src, dst) {
      // Process integers in the correct order for overlapping regions
      for (let y = ${yStart}; y !== ${yEnd}; y += ${yStep}) {
        const srcRowIndex = (${srcStartRow} + y) * src.intsPerRow + ${srcStartIntX};
        const dstRowIndex = (${dstStartRow} + y) * dst.intsPerRow + ${dstStartIntX};
        
        for (let i = ${iStart}; i !== ${iEnd}; i += ${iStep}) {
          const srcInt = src.data[srcRowIndex + i];
          const dstInt = dst.data[dstRowIndex + i];
          
          // Apply the operation
          dst.data[dstRowIndex + i] = ${operationCode};
        }
      }
    };
  `;
  
  // Create and execute the function
  // eslint-disable-next-line no-new-func
  const bitBltFunction = new Function('src', 'dst', functionCode)(src, dst);
  bitBltFunction(src, dst);
}

module.exports = {
  generateBitBltFunction,
  jitBitBlt,
  jitBitBltAligned
};
