/**
 * JIT executor for BitBLT operations.
 * This module manages code generators and caches generated code.
 */
const { BitBltOp } = require('./bitblt');
const JavaScriptGenerator = require('./code_generators/js_generator');
const WasmGenerator = require('./code_generators/wasm_generator');

/**
 * Enum for code generator types
 * @enum {string}
 */
const CodeGeneratorType = {
  /** JavaScript code generator */
  JAVASCRIPT: 'javascript',
  /** WebAssembly code generator */
  WASM: 'wasm'
};

class JitExecutor {
  /**
   * Creates a new JIT executor.
   */
  constructor() {
    // Initialize code generators
    this.generators = {
      [CodeGeneratorType.JAVASCRIPT]: new JavaScriptGenerator(),
      [CodeGeneratorType.WASM]: new WasmGenerator()
    };
    
    // Initialize code cache
    this.codeCache = {
      [CodeGeneratorType.JAVASCRIPT]: new Map(),
      [CodeGeneratorType.WASM]: new Map()
    };
    
    // Set default generator
    this.defaultGenerator = CodeGeneratorType.JAVASCRIPT;
  }

  /**
   * Sets the default code generator type.
   * 
   * @param {string} generatorType - The code generator type to use by default
   */
  setDefaultGenerator(generatorType) {
    if (!this.generators[generatorType]) {
      throw new Error(`Unknown code generator type: ${generatorType}`);
    }
    
    this.defaultGenerator = generatorType;
  }

  /**
   * Executes a BitBLT operation using the specified code generator.
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
   * @param {string} generatorType - The code generator type to use (optional)
   * @returns {Promise<void>}
   */
  async execute(dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY, generatorType = null) {
    // Use default generator if none specified
    const generator = this.generators[generatorType || this.defaultGenerator];
    
    if (!generator) {
      throw new Error(`Unknown code generator type: ${generatorType}`);
    }
    
    // Check if the operation is aligned
    const aligned = this._isAligned(dstX, srcX, width);
    
    // Create parameters object
    const params = {
      dst,
      dstX,
      dstY,
      width,
      height,
      src,
      srcX,
      srcY,
      op,
      aligned
    };
    
    // Get cache key
    const cacheKey = generator.getCacheKey(params);
    
    // Check if code is already in cache
    let generatedCode = this.codeCache[generatorType || this.defaultGenerator].get(cacheKey);
    
    // Generate code if not in cache
    if (!generatedCode) {
      generatedCode = await generator.generateCode(params);
      this.codeCache[generatorType || this.defaultGenerator].set(cacheKey, generatedCode);
    }
    
    // Execute the generated code
    generator.executeCode(generatedCode, dst, src);
  }

  /**
   * Executes a BitBLT operation using the JavaScript code generator.
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
   * @returns {Promise<void>}
   */
  async executeJs(dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) {
    return this.execute(dst, dstX, dstY, width, height, src, srcX, srcY, op, CodeGeneratorType.JAVASCRIPT);
  }

  /**
   * Executes a BitBLT operation using the WebAssembly code generator.
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
   * @returns {Promise<void>}
   */
  async executeWasm(dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) {
    return this.execute(dst, dstX, dstY, width, height, src, srcX, srcY, op, CodeGeneratorType.WASM);
  }

  /**
   * Checks if a BitBLT operation is aligned to 32-bit boundaries.
   * 
   * @param {number} dstX - X coordinate in destination bitmap
   * @param {number} srcX - X coordinate in source bitmap
   * @param {number} width - Width of the rectangle to transfer
   * @returns {boolean} - True if the operation is aligned, false otherwise
   * @private
   */
  _isAligned(dstX, srcX, width) {
    return dstX % 32 === 0 && srcX % 32 === 0 && width % 32 === 0;
  }

  /**
   * Clears the code cache.
   * 
   * @param {string} generatorType - The code generator type to clear (optional)
   */
  clearCache(generatorType = null) {
    if (generatorType) {
      if (!this.codeCache[generatorType]) {
        throw new Error(`Unknown code generator type: ${generatorType}`);
      }
      
      this.codeCache[generatorType].clear();
    } else {
      for (const type in this.codeCache) {
        this.codeCache[type].clear();
      }
    }
  }
}

// Create a singleton instance
const jitExecutor = new JitExecutor();

// Export the singleton instance, types, and convenience functions
module.exports = {
  // Singleton instance
  jitExecutor,
  
  // Types
  CodeGeneratorType,
  
  // Convenience functions
  jitBitBlt: async (dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) => {
    return jitExecutor.execute(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  },
  
  jitBitBltJs: async (dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) => {
    return jitExecutor.executeJs(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  },
  
  jitBitBltWasm: async (dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) => {
    return jitExecutor.executeWasm(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  },
  
  jitBitBltAligned: async (dst, dstX, dstY, width, height, src, srcX, srcY, op = BitBltOp.COPY) => {
    // This function is just for API compatibility with the original jitBitBltAligned
    // The JIT executor automatically detects aligned operations
    return jitExecutor.execute(dst, dstX, dstY, width, height, src, srcX, srcY, op);
  }
};
