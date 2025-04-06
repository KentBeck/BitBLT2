# BitBLT2

A Just-In-Time (JIT) compiled implementation of BitBLT (Bit Block Transfer) operations for efficient bitmap manipulation.

## Overview

BitBLT (Bit Block Transfer) is a fundamental computer graphics operation that involves moving rectangular blocks of pixel data from one location in memory to another, potentially with transformations applied during the transfer. This project implements BitBLT operations with a JIT compiler to generate optimized machine code at runtime for maximum performance.

## Features

- Fast bitmap copying and manipulation
- Support for various raster operations (ROP):
  - Copy (SRC)
  - AND, OR, XOR operations
  - Custom blend operations
- JIT compilation for performance-critical operations
- Platform-independent core with platform-specific optimizations

## Building

```bash
make
```

## Testing

```bash
make test
```

## Usage

```c
#include "bitblt.h"

// Create source and destination bitmaps
Bitmap src = bitmap_create(width, height);
Bitmap dst = bitmap_create(width, height);

// Fill source bitmap with data
// ...

// Perform a simple blit operation
bitblt(dst, dstX, dstY, width, height, src, srcX, srcY, BITBLT_COPY);

// Perform a blit with a logical operation
bitblt(dst, dstX, dstY, width, height, src, srcX, srcY, BITBLT_AND);
```

## Implementation Details

The implementation uses a JIT compiler to generate optimized machine code for BitBLT operations at runtime. This approach allows for:

1. Elimination of conditional branches in inner loops
2. Specialized code generation based on operation type
3. Platform-specific optimizations (SIMD instructions where available)
4. Dynamic adaptation to the specific characteristics of the source and destination bitmaps

## License

[MIT License](LICENSE)
