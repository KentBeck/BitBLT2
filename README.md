# BitBLT2

A JavaScript implementation of BitBLT (Bit Block Transfer) operations with packed pixels for efficient bitmap manipulation.

## Overview

BitBLT (Bit Block Transfer) is a fundamental computer graphics operation that involves moving rectangular blocks of pixel data from one location in memory to another, potentially with transformations applied during the transfer. This project implements BitBLT operations with pixels packed 32 per 32-bit integer for memory efficiency and faster operations.

## Features

- Memory-efficient bitmap representation (32 pixels per 32-bit integer)
- Fast bitmap copying and manipulation
- Support for various raster operations (ROP):
  - Copy (SRC)
  - AND, OR, XOR operations
- Optimized operations for aligned memory blocks
- Simple API for bitmap creation and manipulation

## Installation

```bash
npm install
```

## Testing

```bash
npm test
```

## Usage

```javascript
const {
  createBitmap,
  setPixel,
  bitblt,
  fillRect,
  bitmapToString,
} = require("./src/bitblt");

// Create source and destination bitmaps
const src = createBitmap(64, 16);
const dst = createBitmap(64, 16);

// Fill source bitmap with data
fillRect(src, 0, 0, 32, 8, 1);

// Perform a simple blit operation
bitblt(dst, 10, 4, 32, 8, src, 0, 0, "copy");

// Perform a blit with a logical operation
bitblt(dst, 10, 4, 32, 8, src, 0, 0, "and");

// Display the result
console.log(bitmapToString(dst));
```

## Implementation Details

The implementation uses several optimization techniques:

1. Packing 32 pixels into each 32-bit integer for memory efficiency
2. Specialized fast paths for aligned memory operations
3. Efficient bitwise operations for pixel manipulation
4. Optimized rectangle filling and block transfer operations

### Memory Layout

Each bitmap is represented as an array of 32-bit integers, with each bit representing a single pixel. This allows for efficient storage and manipulation:

- A 32×32 bitmap requires only 32 integers (128 bytes) instead of 1024 bytes
- Bitwise operations can process 32 pixels simultaneously
- Aligned operations can skip per-pixel processing entirely

## Future Enhancements

- JIT compilation for even faster operations
- Support for multi-bit pixels (grayscale, color)
- SIMD optimizations for modern browsers
- WebAssembly implementation for maximum performance

## License

[MIT License](LICENSE)
