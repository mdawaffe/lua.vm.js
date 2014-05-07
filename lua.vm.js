// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 134217728;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(12651);
/* global initializers */ __ATINIT__.push();


/* memory initializer */ allocate([0,0,0,0,0,0,0,0,105,110,112,117,116,0,0,0,69,82,82,79,82,58,32,37,115,10,0,0,0,0,0,0,0,0,0,0,0,96,127,64,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,115,116,97,99,107,32,116,114,97,99,101,98,97,99,107,58,0,0,0,0,0,0,0,0,10,9,46,46,46,0,0,0,83,108,110,116,0,0,0,0,10,9,37,115,58,0,0,0,37,100,58,0,0,0,0,0,32,105,110,32,0,0,0,0,10,9,40,46,46,46,116,97,105,108,32,99,97,108,108,115,46,46,46,41,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,40,37,115,41,0,0,0,110,0,0,0,0,0,0,0,109,101,116,104,111,100,0,0,99,97,108,108,105,110,103,32,39,37,115,39,32,111,110,32,98,97,100,32,115,101,108,102,32,40,37,115,41,0,0,0,63,0,0,0,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,116,111,32,39,37,115,39,32,40,37,115,41,0,0,0,83,108,0,0,0,0,0,0,37,115,58,37,100,58,32,0,0,0,0,0,0,0,0,0,37,115,58,32,37,115,0,0,101,120,105,116,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,115,39,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,32,40,37,115,41,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,98,117,102,102,101,114,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,61,115,116,100,105,110,0,0,64,37,115,0,0,0,0,0,114,0,0,0,0,0,0,0,111,112,101,110,0,0,0,0,114,98,0,0,0,0,0,0,114,101,111,112,101,110,0,0,114,101,97,100,0,0,0,0,111,98,106,101,99,116,32,108,101,110,103,116,104,32,105,115,32,110,111,116,32,97,32,110,117,109,98,101,114,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,116,114,117,101,0,0,0,0,102,97,108,115,101,0,0,0,110,105,108,0,0,0,0,0,37,115,58,32,37,112,0,0,95,76,79,65,68,69,68,0,110,97,109,101,32,99,111,110,102,108,105,99,116,32,102,111,114,32,109,111,100,117,108,101,32,39,37,115,39,0,0,0,116,111,111,32,109,97,110,121,32,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,109,117,108,116,105,112,108,101,32,76,117,97,32,86,77,115,32,100,101,116,101,99,116,101,100,0,0,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,58,32,97,112,112,46,32,110,101,101,100,115,32,37,102,44,32,76,117,97,32,99,111,114,101,32,112,114,111,118,105,100,101,115,32,37,102,0,0,0,98,97,100,32,99,111,110,118,101,114,115,105,111,110,32,110,117,109,98,101,114,45,62,105,110,116,59,32,109,117,115,116,32,114,101,99,111,109,112,105,108,101,32,76,117,97,32,119,105,116,104,32,112,114,111,112,101,114,32,115,101,116,116,105,110,103,115,0,0,0,0,0,80,65,78,73,67,58,32,117,110,112,114,111,116,101,99,116,101,100,32,101,114,114,111,114,32,105,110,32,99,97,108,108,32,116,111,32,76,117,97,32,65,80,73,32,40,37,115,41,10,0,0,0,0,0,0,0,239,187,191,0,0,0,0,0,99,97,110,110,111,116,32,37,115,32,37,115,58,32,37,115,0,0,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,37,115,0,0,0,0,0,102,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,39,37,115,39,0,0,0,109,97,105,110,32,99,104,117,110,107,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,60,37,115,58,37,100,62,0,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,37,115,32,39,37,115,39,32,40,97,32,37,115,32,118,97,108,117,101,41,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,97,32,37,115,32,118,97,108,117,101,0,0,0,0,0,0,0,0,99,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,112,101,114,102,111,114,109,32,97,114,105,116,104,109,101,116,105,99,32,111,110,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,116,119,111,32,37,115,32,118,97,108,117,101,115,0,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,37,115,32,119,105,116,104,32,37,115,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,108,111,99,97,108,0,0,0,95,69,78,86,0,0,0,0,103,108,111,98,97,108,0,0,102,105,101,108,100,0,0,0,117,112,118,97,108,117,101,0,99,111,110,115,116,97,110,116,0,0,0,0,0,0,0,0,109,101,116,104,111,100,0,0,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,111,114,32,105,116,101,114,97,116,111,114,0,0,0,0,109,101,116,97,109,101,116,104,111,100,0,0,0,0,0,0,61,91,67,93,0,0,0,0,67,0,0,0,0,0,0,0,61,63,0,0,0,0,0,0,109,97,105,110,0,0,0,0,76,117,97,0,0,0,0,0,40,42,116,101,109,112,111,114,97,114,121,41,0,0,0,0,40,42,118,97,114,97,114,103,41,0,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,67,32,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,97,99,114,111,115,115,32,97,32,67,45,99,97,108,108,32,98,111,117,110,100,97,114,121,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,102,114,111,109,32,111,117,116,115,105,100,101,32,97,32,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,98,105,110,97,114,121,0,0,116,101,120,116,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,108,111,97,100,32,97,32,37,115,32,99,104,117,110,107,32,40,109,111,100,101,32,105,115,32,39,37,115,39,41,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,101,114,114,111,114,32,104,97,110,100,108,105,110,103,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,110,111,110,45,115,117,115,112,101,110,100,101,100,32,99,111,114,111,117,116,105,110,101,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,99,97,108,108,0,0,0,0,110,111,32,109,101,115,115,97,103,101,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,95,95,103,99,32,109,101,116,97,109,101,116,104,111,100,32,40,37,115,41,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,95,71,0,0,0,0,0,0,112,97,99,107,97,103,101,0,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,116,97,98,108,101,0,0,0,105,111,0,0,0,0,0,0,111,115,0,0,0,0,0,0,115,116,114,105,110,103,0,0,98,105,116,51,50,0,0,0,109,97,116,104,0,0,0,0,100,101,98,117,103,0,0,0,106,115,0,0,0,0,0,0,40,8,0,0,1,0,0,0,48,8,0,0,2,0,0,0,200,9,0,0,3,0,0,0,56,8,0,0,4,0,0,0,208,9,0,0,5,0,0,0,216,9,0,0,6,0,0,0,224,9,0,0,7,0,0,0,64,8,0,0,8,0,0,0,232,9,0,0,9,0,0,0,240,9,0,0,10,0,0,0,88,8,0,0,11,0,0,0,0,0,0,0,0,0,0,0,95,73,79,95,105,110,112,117,116,0,0,0,0,0,0,0,115,116,100,105,110,0,0,0,95,73,79,95,111,117,116,112,117,116,0,0,0,0,0,0,115,116,100,111,117,116,0,0,115,116,100,101,114,114,0,0,70,73,76,69,42,0,0,0,99,97,110,110,111,116,32,99,108,111,115,101,32,115,116,97,110,100,97,114,100,32,102,105,108,101,0,0,0,0,0,0,95,95,105,110,100,101,120,0,40,8,0,0,1,0,0,0,48,8,0,0,12,0,0,0,56,8,0,0,13,0,0,0,64,8,0,0,14,0,0,0,72,8,0,0,15,0,0,0,80,8,0,0,16,0,0,0,88,8,0,0,17,0,0,0,96,8,0,0,18,0,0,0,104,8,0,0,19,0,0,0,0,0,0,0,0,0,0,0,99,108,111,115,101,0,0,0,102,108,117,115,104,0,0,0,108,105,110,101,115,0,0,0,114,101,97,100,0,0,0,0,115,101,101,107,0,0,0,0,115,101,116,118,98,117,102,0,119,114,105,116,101,0,0,0,95,95,103,99,0,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,102,105,108,101,32,40,99,108,111,115,101,100,41,0,0,0,102,105,108,101,32,40,37,112,41,0,0,0,0,0,0,0,37,46,49,52,103,0,0,0,97,116,116,101,109,112,116,32,116,111,32,117,115,101,32,97,32,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,224,8,0,0,232,8,0,0,240,8,0,0,0,0,0,0,110,111,0,0,0,0,0,0,102,117,108,108,0,0,0,0,108,105,110,101,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,24,9,0,0,32,9,0,0,40,9,0,0,0,0,0,0,115,101,116,0,0,0,0,0,99,117,114,0,0,0,0,0,101,110,100,0,0,0,0,0,110,111,116,32,97,110,32,105,110,116,101,103,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,0,0,37,108,102,0,0,0,0,0,116,111,111,32,109,97,110,121,32,111,112,116,105,111,110,115,0,0,0,0,0,0,0,0,102,105,108,101,32,105,115,32,97,108,114,101,97,100,121,32,99,108,111,115,101,100,0,0,37,115,0,0,0,0,0,0,105,110,112,117,116,0,0,0,111,112,101,110,0,0,0,0,111,117,116,112,117,116,0,0,112,111,112,101,110,0,0,0,116,109,112,102,105,108,101,0,116,121,112,101,0,0,0,0,115,116,97,110,100,97,114,100,32,37,115,32,102,105,108,101,32,105,115,32,99,108,111,115,101,100,0,0,0,0,0,0,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,0,102,105,108,101,0,0,0,0,114,0,0,0,0,0,0,0,39,112,111,112,101,110,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,119,0,0,0,0,0,0,0,99,97,110,110,111,116,32,111,112,101,110,32,102,105,108,101,32,39,37,115,39,32,40,37,115,41,0,0,0,0,0,0,114,119,97,0,0,0,0,0,105,110,118,97,108,105,100,32,109,111,100,101,0,0,0,0,136,11,0,0,20,0,0,0,144,11,0,0,21,0,0,0,152,11,0,0,22,0,0,0,160,11,0,0,23,0,0,0,168,11,0,0,24,0,0,0,176,11,0,0,25,0,0,0,184,11,0,0,26,0,0,0,192,11,0,0,27,0,0,0,200,11,0,0,28,0,0,0,208,11,0,0,29,0,0,0,216,11,0,0,30,0,0,0,224,11,0,0,31,0,0,0,232,11,0,0,32,0,0,0,240,11,0,0,33,0,0,0,248,11,0,0,34,0,0,0,0,12,0,0,35,0,0,0,8,12,0,0,36,0,0,0,16,12,0,0,37,0,0,0,24,12,0,0,38,0,0,0,32,12,0,0,39,0,0,0,40,12,0,0,40,0,0,0,48,12,0,0,41,0,0,0,56,12,0,0,42,0,0,0,72,12,0,0,43,0,0,0,80,12,0,0,44,0,0,0,88,12,0,0,45,0,0,0,96,12,0,0,46,0,0,0,104,12,0,0,47,0,0,0,0,0,0,0,0,0,0,0,112,105,0,0,0,0,0,0,104,117,103,101,0,0,0,0,97,98,115,0,0,0,0,0,97,99,111,115,0,0,0,0,97,115,105,110,0,0,0,0,97,116,97,110,50,0,0,0,97,116,97,110,0,0,0,0,99,101,105,108,0,0,0,0,99,111,115,104,0,0,0,0,99,111,115,0,0,0,0,0,100,101,103,0,0,0,0,0,101,120,112,0,0,0,0,0,102,108,111,111,114,0,0,0,102,109,111,100,0,0,0,0,102,114,101,120,112,0,0,0,108,100,101,120,112,0,0,0,108,111,103,49,48,0,0,0,108,111,103,0,0,0,0,0,109,97,120,0,0,0,0,0,109,105,110,0,0,0,0,0,109,111,100,102,0,0,0,0,112,111,119,0,0,0,0,0,114,97,100,0,0,0,0,0,114,97,110,100,111,109,0,0,114,97,110,100,111,109,115,101,101,100,0,0,0,0,0,0,115,105,110,104,0,0,0,0,115,105,110,0,0,0,0,0,115,113,114,116,0,0,0,0,116,97,110,104,0,0,0,0,116,97,110,0,0,0,0,0,105,110,116,101,114,118,97,108,32,105,115,32,101,109,112,116,121,0,0,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,0,0,0,0,0,0,0,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,101,114,114,111,114,58,32,98,108,111,99,107,32,116,111,111,32,98,105,103,0,0,95,67,76,73,66,83,0,0,95,95,103,99,0,0,0,0,168,16,0,0,48,0,0,0,176,16,0,0,49,0,0,0,192,16,0,0,50,0,0,0,0,0,0,0,0,0,0,0,108,111,97,100,101,114,115,0,115,101,97,114,99,104,101,114,115,0,0,0,0,0,0,0,112,97,116,104,0,0,0,0,76,85,65,95,80,65,84,72,95,53,95,50,0,0,0,0,76,85,65,95,80,65,84,72,0,0,0,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,46,47,63,46,108,117,97,0,0,0,0,0,0,0,99,112,97,116,104,0,0,0,76,85,65,95,67,80,65,84,72,95,53,95,50,0,0,0,76,85,65,95,67,80,65,84,72,0,0,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,115,111,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,108,111,97,100,97,108,108,46,115,111,59,46,47,63,46,115,111,0,0,0,0,47,10,59,10,63,10,33,10,45,10,0,0,0,0,0,0,99,111,110,102,105,103,0,0,95,76,79,65,68,69,68,0,108,111,97,100,101,100,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,112,114,101,108,111,97,100,0,184,14,0,0,51,0,0,0,192,14,0,0,52,0,0,0,0,0,0,0,0,0,0,0,109,111,100,117,108,101,0,0,114,101,113,117,105,114,101,0,39,112,97,99,107,97,103,101,46,115,101,97,114,99,104,101,114,115,39,32,109,117,115,116,32,98,101,32,97,32,116,97,98,108,101,0,0,0,0,0,109,111,100,117,108,101,32,39,37,115,39,32,110,111,116,32,102,111,117,110,100,58,37,115,0,0,0,0,0,0,0,0,95,78,65,77,69,0,0,0,102,0,0,0,0,0,0,0,39,109,111,100,117,108,101,39,32,110,111,116,32,99,97,108,108,101,100,32,102,114,111,109,32,97,32,76,117,97,32,102,117,110,99,116,105,111,110,0,95,77,0,0,0,0,0,0,95,80,65,67,75,65,71,69,0,0,0,0,0,0,0,0,59,59,0,0,0,0,0,0,59,1,59,0,0,0,0,0,1,0,0,0,0,0,0,0,76,85,65,95,78,79,69,78,86,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,10,9,110,111,32,109,111,100,117,108,101,32,39,37,115,39,32,105,110,32,102,105,108,101,32,39,37,115,39,0,0,0,101,114,114,111,114,32,108,111,97,100,105,110,103,32,109,111,100,117,108,101,32,39,37,115,39,32,102,114,111,109,32,102,105,108,101,32,39,37,115,39,58,10,9,37,115,0,0,0,46,0,0,0,0,0,0,0,95,0,0,0,0,0,0,0,108,117,97,111,112,101,110,95,37,115,0,0,0,0,0,0,100,121,110,97,109,105,99,32,108,105,98,114,97,114,105,101,115,32,110,111,116,32,101,110,97,98,108,101,100,59,32,99,104,101,99,107,32,121,111,117,114,32,76,117,97,32,105,110,115,116,97,108,108,97,116,105,111,110,0,0,0,0,0,0,39,112,97,99,107,97,103,101,46,37,115,39,32,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,0,0,0,63,0,0,0,0,0,0,0,10,9,110,111,32,102,105,108,101,32,39,37,115,39,0,0,114,0,0,0,0,0,0,0,10,9,110,111,32,102,105,101,108,100,32,112,97,99,107,97,103,101,46,112,114,101,108,111,97,100,91,39,37,115,39,93,0,0,0,0,0,0,0,0,108,111,97,100,108,105,98,0,115,101,97,114,99,104,112,97,116,104,0,0,0,0,0,0,115,101,101,97,108,108,0,0,95,95,105,110,100,101,120,0,97,98,115,101,110,116,0,0,105,110,105,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,110,78,0,0,0,0,0,0,120,88,0,0,0,0,0,0,40,110,117,108,108,41,0,0,37,112,0,0,0,0,0,0,37,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,108,117,97,95,112,117,115,104,102,115,116,114,105,110,103,39,0,0,0,0,0,0,46,46,46,0,0,0,0,0,91,115,116,114,105,110,103,32,34,0,0,0,0,0,0,0,34,93,0,0,0,0,0,0,96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23,240,18,0,0,53,0,0,0,248,18,0,0,54,0,0,0,0,19,0,0,55,0,0,0,16,19,0,0,56,0,0,0,24,19,0,0,57,0,0,0,32,19,0,0,58,0,0,0,40,19,0,0,59,0,0,0,48,19,0,0,60,0,0,0,56,19,0,0,61,0,0,0,72,19,0,0,62,0,0,0,80,19,0,0,63,0,0,0,0,0,0,0,0,0,0,0,99,108,111,99,107,0,0,0,100,97,116,101,0,0,0,0,100,105,102,102,116,105,109,101,0,0,0,0,0,0,0,0,101,120,101,99,117,116,101,0,101,120,105,116,0,0,0,0,103,101,116,101,110,118,0,0,114,101,109,111,118,101,0,0,114,101,110,97,109,101,0,0,115,101,116,108,111,99,97,108,101,0,0,0,0,0,0,0,116,105,109,101,0,0,0,0,116,109,112,110,97,109,101,0,117,110,97,98,108,101,32,116,111,32,103,101,110,101,114,97,116,101,32,97,32,117,110,105,113,117,101,32,102,105,108,101,110,97,109,101,0,0,0,0,115,101,99,0,0,0,0,0,109,105,110,0,0,0,0,0,104,111,117,114,0,0,0,0,100,97,121,0,0,0,0,0,109,111,110,116,104,0,0,0,121,101,97,114,0,0,0,0,105,115,100,115,116,0,0,0,102,105,101,108,100,32,39,37,115,39,32,109,105,115,115,105,110,103,32,105,110,32,100,97,116,101,32,116,97,98,108,101,0,0,0,0,0,0,0,0,6,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,24,20,0,0,32,20,0,0,40,20,0,0,48,20,0,0,64,20,0,0,72,19,0,0,0,0,0,0,0,0,0,0,97,108,108,0,0,0,0,0,99,111,108,108,97,116,101,0,99,116,121,112,101,0,0,0,109,111,110,101,116,97,114,121,0,0,0,0,0,0,0,0,110,117,109,101,114,105,99,0,37,99,0,0,0,0,0,0,42,116,0,0,0,0,0,0,119,100,97,121,0,0,0,0,121,100,97,121,0,0,0,0,97,65,98,66,99,100,72,73,106,109,77,112,83,85,119,87,120,88,121,89,122,37,0,0,105,110,118,97,108,105,100,32,99,111,110,118,101,114,115,105,111,110,32,115,112,101,99,105,102,105,101,114,32,39,37,37,37,115,39,0,0,0,0,0,60,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,110,111,116,32,105,110,115,105,100,101,32,97,32,108,111,111,112,0,0,0,0,0,0,0,110,111,32,118,105,115,105,98,108,101,32,108,97,98,101,108,32,39,37,115,39,32,102,111,114,32,60,103,111,116,111,62,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,60,103,111,116,111,32,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,106,117,109,112,115,32,105,110,116,111,32,116,104,101,32,115,99,111,112,101,32,111,102,32,108,111,99,97,108,32,39,37,115,39,0,98,114,101,97,107,0,0,0,108,97,98,101,108,115,47,103,111,116,111,115,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,67,32,108,101,118,101,108,115,0,0,0,0,0,0,0,0,6,6,6,6,7,7,7,7,7,7,10,9,5,4,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,1,0,0,99,97,110,110,111,116,32,117,115,101,32,39,46,46,46,39,32,111,117,116,115,105,100,101,32,97,32,118,97,114,97,114,103,32,102,117,110,99,116,105,111,110,0,0,0,0,0,0,115,101,108,102,0,0,0,0,60,110,97,109,101,62,32,111,114,32,39,46,46,46,39,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,108,111,99,97,108,32,118,97,114,105,97,98,108,101,115,0,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,105,116,101,109,115,32,105,110,32,97,32,99,111,110,115,116,114,117,99,116,111,114,0,0,109,97,105,110,32,102,117,110,99,116,105,111,110,0,0,0,102,117,110,99,116,105,111,110,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,32,105,110,32,37,115,0,102,117,110,99,116,105,111,110,32,97,114,103,117,109,101,110,116,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,117,110,101,120,112,101,99,116,101,100,32,115,121,109,98,111,108,0,0,0,0,0,0,0,108,97,98,101,108,32,39,37,115,39,32,97,108,114,101,97,100,121,32,100,101,102,105,110,101,100,32,111,110,32,108,105,110,101,32,37,100,0,0,0,39,61,39,32,111,114,32,39,105,110,39,32,101,120,112,101,99,116,101,100,0,0,0,0,40,102,111,114,32,103,101,110,101,114,97,116,111,114,41,0,40,102,111,114,32,115,116,97,116,101,41,0,0,0,0,0,40,102,111,114,32,99,111,110,116,114,111,108,41,0,0,0,40,102,111,114,32,105,110,100,101,120,41,0,0,0,0,0,40,102,111,114,32,108,105,109,105,116,41,0,0,0,0,0,40,102,111,114,32,115,116,101,112,41,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,32,40,116,111,32,99,108,111,115,101,32,37,115,32,97,116,32,108,105,110,101,32,37,100,41,0,0,0,0,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,0,110,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,0,0,0,0,0,0,0,40,24,0,0,64,0,0,0,48,24,0,0,65,0,0,0,56,24,0,0,66,0,0,0,64,24,0,0,67,0,0,0,72,24,0,0,68,0,0,0,80,24,0,0,69,0,0,0,88,24,0,0,70,0,0,0,96,24,0,0,71,0,0,0,104,24,0,0,72,0,0,0,112,24,0,0,73,0,0,0,120,24,0,0,74,0,0,0,128,24,0,0,75,0,0,0,136,24,0,0,76,0,0,0,144,24,0,0,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,95,95,105,110,100,101,120,0,98,121,116,101,0,0,0,0,99,104,97,114,0,0,0,0,100,117,109,112,0,0,0,0,102,105,110,100,0,0,0,0,102,111,114,109,97,116,0,0,103,109,97,116,99,104,0,0,103,115,117,98,0,0,0,0,108,101,110,0,0,0,0,0,108,111,119,101,114,0,0,0,109,97,116,99,104,0,0,0,114,101,112,0,0,0,0,0,114,101,118,101,114,115,101,0,115,117,98,0,0,0,0,0,117,112,112,101,114,0,0,0,114,101,115,117,108,116,105,110,103,32,115,116,114,105,110,103,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,99,97,112,116,117,114,101,115,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,0,0,0,117,110,102,105,110,105,115,104,101,100,32,99,97,112,116,117,114,101,0,0,0,0,0,0,112,97,116,116,101,114,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,109,105,115,115,105,110,103,32,39,91,39,32,97,102,116,101,114,32,39,37,37,102,39,32,105,110,32,112,97,116,116,101,114,110,0,0,0,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,32,37,37,37,100,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,101,110,100,115,32,119,105,116,104,32,39,37,37,39,41,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,39,93,39,41,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,37,37,98,39,41,0,0,105,110,118,97,108,105,100,32,112,97,116,116,101,114,110,32,99,97,112,116,117,114,101,0,94,36,42,43,63,46,40,91,37,45,0,0,0,0,0,0,115,116,114,105,110,103,47,102,117,110,99,116,105,111,110,47,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,105,110,118,97,108,105,100,32,114,101,112,108,97,99,101,109,101,110,116,32,118,97,108,117,101,32,40,97,32,37,115,41,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,117,115,101,32,111,102,32,39,37,99,39,32,105,110,32,114,101,112,108,97,99,101,109,101,110,116,32,115,116,114,105,110,103,0,0,0,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,110,111,116,32,97,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,110,111,116,32,97,32,110,111,110,45,110,101,103,97,116,105,118,101,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,102,111,114,109,97,116,39,0,0,0,0,0,0,0,92,37,100,0,0,0,0,0,92,37,48,51,100,0,0,0,45,43,32,35,48,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,114,101,112,101,97,116,101,100,32,102,108,97,103,115,41,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,119,105,100,116,104,32,111,114,32,112,114,101,99,105,115,105,111,110,32,116,111,111,32,108,111,110,103,41,0,0,0,0,117,110,97,98,108,101,32,116,111,32,100,117,109,112,32,103,105,118,101,110,32,102,117,110,99,116,105,111,110,0,0,0,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,115,116,114,105,110,103,32,115,108,105,99,101,32,116,111,111,32,108,111,110,103,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,110,105,108,0,0,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,78,97,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,116,97,98,108,101,32,111,118,101,114,102,108,111,119,0,0,105,110,118,97,108,105,100,32,107,101,121,32,116,111,32,39,110,101,120,116,39,0,0,0,120,28,0,0,78,0,0,0,128,28,0,0,79,0,0,0,136,28,0,0,80,0,0,0,144,28,0,0,81,0,0,0,112,28,0,0,82,0,0,0,152,28,0,0,83,0,0,0,160,28,0,0,84,0,0,0,0,0,0,0,0,0,0,0,117,110,112,97,99,107,0,0,99,111,110,99,97,116,0,0,109,97,120,110,0,0,0,0,105,110,115,101,114,116,0,0,112,97,99,107,0,0,0,0,114,101,109,111,118,101,0,0,115,111,114,116,0,0,0,0,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,114,100,101,114,32,102,117,110,99,116,105,111,110,32,102,111,114,32,115,111,114,116,105,110,103,0,0,0,0,0,0,112,111,115,105,116,105,111,110,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,117,110,112,97,99,107,0,0,0,0,0,0,110,0,0,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,105,110,115,101,114,116,39,0,0,0,105,110,118,97,108,105,100,32,118,97,108,117,101,32,40,37,115,41,32,97,116,32,105,110,100,101,120,32,37,100,32,105,110,32,116,97,98,108,101,32,102,111,114,32,39,99,111,110,99,97,116,39,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,110,105,108,0,0,0,0,0,98,111,111,108,101,97,110,0,117,115,101,114,100,97,116,97,0,0,0,0,0,0,0,0,110,117,109,98,101,114,0,0,115,116,114,105,110,103,0,0,116,97,98,108,101,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,116,104,114,101,97,100,0,0,112,114,111,116,111,0,0,0,117,112,118,97,108,0,0,0,120,29,0,0,136,29,0,0,144,29,0,0,152,29,0,0,168,29,0,0,176,29,0,0,184,29,0,0,192,29,0,0,152,29,0,0,208,29,0,0,216,29,0,0,224,29,0,0,96,30,0,0,104,30,0,0,120,30,0,0,128,30,0,0,136,30,0,0,144,30,0,0,152,30,0,0,160,30,0,0,168,30,0,0,176,30,0,0,184,30,0,0,192,30,0,0,200,30,0,0,208,30,0,0,216,30,0,0,224,30,0,0,240,30,0,0,0,0,0,0,95,95,105,110,100,101,120,0,95,95,110,101,119,105,110,100,101,120,0,0,0,0,0,0,95,95,103,99,0,0,0,0,95,95,109,111,100,101,0,0,95,95,108,101,110,0,0,0,95,95,101,113,0,0,0,0,95,95,97,100,100,0,0,0,95,95,115,117,98,0,0,0,95,95,109,117,108,0,0,0,95,95,100,105,118,0,0,0,95,95,109,111,100,0,0,0,95,95,112,111,119,0,0,0,95,95,117,110,109,0,0,0,95,95,108,116,0,0,0,0,95,95,108,101,0,0,0,0,95,95,99,111,110,99,97,116,0,0,0,0,0,0,0,0,95,95,99,97,108,108,0,0,98,105,110,97,114,121,32,115,116,114,105,110,103,0,0,0,25,147,13,10,26,10,0,0,116,114,117,110,99,97,116,101,100,0,0,0,0,0,0,0,37,115,58,32,37,115,32,112,114,101,99,111,109,112,105,108,101,100,32,99,104,117,110,107,0,0,0,0,0,0,0,0,99,111,114,114,117,112,116,101,100,0,0,0,0,0,0,0,110,111,116,32,97,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,32,105,110,0,0,0,0,0,105,110,99,111,109,112,97,116,105,98,108,101,0,0,0,0,37,46,49,52,103,0,0,0,105,110,100,101,120,0,0,0,108,111,111,112,32,105,110,32,103,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,108,111,111,112,32,105,110,32,115,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,115,116,114,105,110,103,32,108,101,110,103,116,104,32,111,118,101,114,102,108,111,119,0,0,103,101,116,32,108,101,110,103,116,104,32,111,102,0,0,0,39,102,111,114,39,32,105,110,105,116,105,97,108,32,118,97,108,117,101,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,39,102,111,114,39,32,108,105,109,105,116,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,39,102,111,114,39,32,115,116,101,112,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,0,104,32,0,0,85,0,0,0,112,32,0,0,86,0,0,0,0,0,0,0,0,0,0,0,114,117,110,0,0,0,0,0,114,117,110,95,115,116,114,105,110,103,0,0,0,0,0,0,45,49,0,0,0,0,0,0,95,71,0,0,0,0,0,0,104,33,0,0,87,0,0,0,112,33,0,0,88,0,0,0,128,33,0,0,89,0,0,0,136,33,0,0,90,0,0,0,144,33,0,0,91,0,0,0,160,33,0,0,92,0,0,0,168,33,0,0,93,0,0,0,184,33,0,0,94,0,0,0,192,33,0,0,94,0,0,0,208,33,0,0,95,0,0,0,216,33,0,0,96,0,0,0,224,33,0,0,97,0,0,0,232,33,0,0,98,0,0,0,240,33,0,0,99,0,0,0,0,34,0,0,100,0,0,0,8,34,0,0,101,0,0,0,16,34,0,0,102,0,0,0,24,34,0,0,103,0,0,0,32,34,0,0,104,0,0,0,48,34,0,0,105,0,0,0,64,34,0,0,106,0,0,0,80,34,0,0,107,0,0,0,88,34,0,0,108,0,0,0,0,0,0,0,0,0,0,0,76,117,97,32,53,46,50,0,95,86,69,82,83,73,79,78,0,0,0,0,0,0,0,0,97,115,115,101,114,116,0,0,99,111,108,108,101,99,116,103,97,114,98,97,103,101,0,0,100,111,102,105,108,101,0,0,101,114,114,111,114,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,105,112,97,105,114,115,0,0,108,111,97,100,102,105,108,101,0,0,0,0,0,0,0,0,108,111,97,100,0,0,0,0,108,111,97,100,115,116,114,105,110,103,0,0,0,0,0,0,110,101,120,116,0,0,0,0,112,97,105,114,115,0,0,0,112,99,97,108,108,0,0,0,112,114,105,110,116,0,0,0,114,97,119,101,113,117,97,108,0,0,0,0,0,0,0,0,114,97,119,108,101,110,0,0,114,97,119,103,101,116,0,0,114,97,119,115,101,116,0,0,115,101,108,101,99,116,0,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,116,111,110,117,109,98,101,114,0,0,0,0,0,0,0,0,116,111,115,116,114,105,110,103,0,0,0,0,0,0,0,0,116,121,112,101,0,0,0,0,120,112,99,97,108,108,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,98,97,115,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,32,12,10,13,9,11,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,95,95,109,101,116,97,116,97,98,108,101,0,0,0,0,0,99,97,110,110,111,116,32,99,104,97,110,103,101,32,97,32,112,114,111,116,101,99,116,101,100,32,109,101,116,97,116,97,98,108,101,0,0,0,0,0,105,110,100,101,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,116,97,98,108,101,32,111,114,32,115,116,114,105,110,103,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,39,116,111,115,116,114,105,110,103,39,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,32,116,111,32,39,112,114,105,110,116,39,0,0,0,0,0,0,95,95,112,97,105,114,115,0,98,116,0,0,0,0,0,0,61,40,108,111,97,100,41,0,116,111,111,32,109,97,110,121,32,110,101,115,116,101,100,32,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,114,101,97,100,101,114,32,102,117,110,99,116,105,111,110,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,0,0,0,0,95,95,105,112,97,105,114,115,0,0,0,0,0,0,0,0,248,35,0,0,0,36,0,0,8,36,0,0,16,36,0,0,24,36,0,0,32,36,0,0,48,36,0,0,64,36,0,0,80,36,0,0,96,36,0,0,112,36,0,0,0,0,0,0,115,116,111,112,0,0,0,0,114,101,115,116,97,114,116,0,99,111,108,108,101,99,116,0,99,111,117,110,116,0,0,0,115,116,101,112,0,0,0,0,115,101,116,112,97,117,115,101,0,0,0,0,0,0,0,0,115,101,116,115,116,101,112,109,117,108,0,0,0,0,0,0,115,101,116,109,97,106,111,114,105,110,99,0,0,0,0,0,105,115,114,117,110,110,105,110,103,0,0,0,0,0,0,0,103,101,110,101,114,97,116,105,111,110,97,108,0,0,0,0,105,110,99,114,101,109,101,110,116,97,108,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,37,115,0,0,0,0,0,0,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,33,0,0,0,0,0,0,0,56,37,0,0,109,0,0,0,64,37,0,0,110,0,0,0,72,37,0,0,111,0,0,0,80,37,0,0,112,0,0,0,88,37,0,0,113,0,0,0,96,37,0,0,114,0,0,0,104,37,0,0,115,0,0,0,112,37,0,0,116,0,0,0,120,37,0,0,117,0,0,0,128,37,0,0,118,0,0,0,136,37,0,0,119,0,0,0,144,37,0,0,120,0,0,0,0,0,0,0,0,0,0,0,97,114,115,104,105,102,116,0,98,97,110,100,0,0,0,0,98,110,111,116,0,0,0,0,98,111,114,0,0,0,0,0,98,120,111,114,0,0,0,0,98,116,101,115,116,0,0,0,101,120,116,114,97,99,116,0,108,114,111,116,97,116,101,0,108,115,104,105,102,116,0,0,114,101,112,108,97,99,101,0,114,114,111,116,97,116,101,0,114,115,104,105,102,116,0,0,102,105,101,108,100,32,99,97,110,110,111,116,32,98,101,32,110,101,103,97,116,105,118,101,0,0,0,0,0,0,0,0,119,105,100,116,104,32,109,117,115,116,32,98,101,32,112,111,115,105,116,105,118,101,0,0,116,114,121,105,110,103,32,116,111,32,97,99,99,101,115,115,32,110,111,110,45,101,120,105,115,116,101,110,116,32,98,105,116,115,0,0,0,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,101,120,112,114,101,115,115,105,111,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,0,99,111,110,115,116,114,117,99,116,111,114,32,116,111,111,32,108,111,110,103,0,0,0,0,99,111,110,115,116,97,110,116,115,0,0,0,0,0,0,0,111,112,99,111,100,101,115,0,99,111,110,116,114,111,108,32,115,116,114,117,99,116,117,114,101,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,168,38,0,0,121,0,0,0,176,38,0,0,122,0,0,0,184,38,0,0,123,0,0,0,192,38,0,0,124,0,0,0,200,38,0,0,125,0,0,0,208,38,0,0,126,0,0,0,0,0,0,0,0,0,0,0,99,114,101,97,116,101,0,0,114,101,115,117,109,101,0,0,114,117,110,110,105,110,103,0,115,116,97,116,117,115,0,0,119,114,97,112,0,0,0,0,121,105,101,108,100,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,0,0,99,111,114,111,117,116,105,110,101,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,115,117,115,112,101,110,100,101,100,0,0,0,0,0,0,0,110,111,114,109,97,108,0,0,100,101,97,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([41,0,0,127,0,0,0,8,41,0,0,128,0,0,0,24,41,0,0,129,0,0,0,32,41,0,0,130,0,0,0,40,41,0,0,131,0,0,0,56,41,0,0,132,0,0,0,72,41,0,0,133,0,0,0,88,41,0,0,134,0,0,0,104,41,0,0,135,0,0,0,120,41,0,0,136,0,0,0,136,41,0,0,137,0,0,0,152,41,0,0,138,0,0,0,160,41,0,0,139,0,0,0,176,41,0,0,140,0,0,0,192,41,0,0,141,0,0,0,208,41,0,0,142,0,0,0,0,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0,103,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,103,101,116,104,111,111,107,0,103,101,116,105,110,102,111,0,103,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,103,101,116,114,101,103,105,115,116,114,121,0,0,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,103,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,117,112,118,97,108,117,101,106,111,105,110,0,0,0,0,0,117,112,118,97,108,117,101,105,100,0,0,0,0,0,0,0,115,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,115,101,116,104,111,111,107,0,115,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,115,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,116,114,97,99,101,98,97,99,107,0,0,0,0,0,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,108,101,118,101,108,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,95,72,75,69,89,0,0,0,107,0,0,0,0,0,0,0,95,95,109,111,100,101,0,0,64,42,0,0,72,42,0,0,80,42,0,0,88,42,0,0,96,42,0,0,0,0,0,0,99,97,108,108,0,0,0,0,114,101,116,117,114,110,0,0,108,105,110,101,0,0,0,0,99,111,117,110,116,0,0,0,116,97,105,108,32,99,97,108,108,0,0,0,0,0,0,0,102,117,108,108,32,117,115,101,114,100,97,116,97,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,108,105,103,104,116,32,117,115,101,114,100,97,116,97,0,0,0,0,0,0,62,117,0,0,0,0,0,0,105,110,118,97,108,105,100,32,117,112,118,97,108,117,101,32,105,110,100,101,120,0,0,0,76,117,97,32,102,117,110,99,116,105,111,110,32,101,120,112,101,99,116,101,100,0,0,0,102,108,110,83,116,117,0,0,62,37,115,0,0,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,108,101,118,101,108,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,115,111,117,114,99,101,0,0,115,104,111,114,116,95,115,114,99,0,0,0,0,0,0,0,108,105,110,101,100,101,102,105,110,101,100,0,0,0,0,0,108,97,115,116,108,105,110,101,100,101,102,105,110,101,100,0,119,104,97,116,0,0,0,0,99,117,114,114,101,110,116,108,105,110,101,0,0,0,0,0,110,117,112,115,0,0,0,0,110,112,97,114,97,109,115,0,105,115,118,97,114,97,114,103,0,0,0,0,0,0,0,0,110,97,109,101,0,0,0,0,110,97,109,101,119,104,97,116,0,0,0,0,0,0,0,0,105,115,116,97,105,108,99,97,108,108,0,0,0,0,0,0,97,99,116,105,118,101,108,105,110,101,115,0,0,0,0,0,102,117,110,99,0,0,0,0,101,120,116,101,114,110,97,108,32,104,111,111,107,0,0,0,108,117,97,95,100,101,98,117,103,62,32,0,0,0,0,0,99,111,110,116,10,0,0,0,61,40,100,101,98,117,103,32,99,111,109,109,97,110,100,41,0,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,32,46,0,0,40,46,0,0,48,46,0,0,56,46,0,0,64,46,0,0,72,46,0,0,80,46,0,0,88,46,0,0,96,46,0,0,112,46,0,0,120,46,0,0,128,46,0,0,136,46,0,0,144,46,0,0,152,46,0,0,160,46,0,0,168,46,0,0,176,46,0,0,184,46,0,0,192,46,0,0,200,46,0,0,208,46,0,0,216,46,0,0,224,46,0,0,232,46,0,0,240,46,0,0,248,46,0,0,0,47,0,0,8,47,0,0,16,47,0,0,24,47,0,0,40,47,0,0,48,47,0,0,0,0,0,0,39,37,99,39,0,0,0,0,99,104,97,114,40,37,100,41,0,0,0,0,0,0,0,0,39,37,115,39,0,0,0,0,95,69,78,86,0,0,0,0,105,110,118,97,108,105,100,32,108,111,110,103,32,115,116,114,105,110,103,32,100,101,108,105,109,105,116,101,114,0,0,0,46,0,0,0,0,0,0,0,69,101,0,0,0,0,0,0,88,120,0,0,0,0,0,0,80,112,0,0,0,0,0,0,43,45,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,108,101,120,105,99,97,108,32,101,108,101,109,101,110,116,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,115,116,114,105,110,103,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,0,100,101,99,105,109,97,108,32,101,115,99,97,112,101,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,104,101,120,97,100,101,99,105,109,97,108,32,100,105,103,105,116,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,115,116,114,105,110,103,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,99,111,109,109,101,110,116,0,99,104,117,110,107,32,104,97,115,32,116,111,111,32,109,97,110,121,32,108,105,110,101,115,0,0,0,0,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,37,115,32,110,101,97,114,32,37,115,0,0,0,0,0,0,97,110,100,0,0,0,0,0,98,114,101,97,107,0,0,0,100,111,0,0,0,0,0,0,101,108,115,101,0,0,0,0,101,108,115,101,105,102,0,0,101,110,100,0,0,0,0,0,102,97,108,115,101,0,0,0,102,111,114,0,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,103,111,116,111,0,0,0,0,105,102,0,0,0,0,0,0,105,110,0,0,0,0,0,0,108,111,99,97,108,0,0,0,110,105,108,0,0,0,0,0,110,111,116,0,0,0,0,0,111,114,0,0,0,0,0,0,114,101,112,101,97,116,0,0,114,101,116,117,114,110,0,0,116,104,101,110,0,0,0,0,116,114,117,101,0,0,0,0,117,110,116,105,108,0,0,0,119,104,105,108,101,0,0,0,46,46,0,0,0,0,0,0,46,46,46,0,0,0,0,0,61,61,0,0,0,0,0,0,62,61,0,0,0,0,0,0,60,61,0,0,0,0,0,0,126,61,0,0,0,0,0,0,58,58,0,0,0,0,0,0,60,101,111,102,62,0,0,0,60,110,117,109,98,101,114,62,0,0,0,0,0,0,0,0,60,110,97,109,101,62,0,0,60,115,116,114,105,110,103,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10353);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
   
  Module["_rand_r"] = _rand_r;
  
  var ___rand_seed=allocate([0x0273459b, 0, 0, 0], "i32", ALLOC_STATIC); 
  Module["_rand"] = _rand;

  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var fd = _fileno(stream);
      var ret = _lseek(fd, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStreamFromPtr(stream);
      stream.eof = false;
      return 0;
    }

   
  Module["_i64Subtract"] = _i64Subtract;

   
  Module["_i64Add"] = _i64Add;

  function _setlocale(category, locale) {
      if (!_setlocale.ret) _setlocale.ret = allocate([0], 'i8', ALLOC_NORMAL);
      return _setlocale.ret;
    }

  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      var fd = _fileno(stream);
      _fsync(fd);
      return _close(fd);
    }

  function _modf(x, intpart) {
      HEAPF64[((intpart)>>3)]=Math.floor(x);
      return x - HEAPF64[((intpart)>>3)];
    }

  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(streamObj.fd, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }

  function _emscripten_run_script_string(ptr) {
      var s = eval(Pointer_stringify(ptr)) + '';
      var me = _emscripten_run_script_string;
      if (!me.bufferSize || me.bufferSize < s.length+1) {
        if (me.bufferSize) _free(me.buffer);
        me.bufferSize = s.length+1;
        me.buffer = _malloc(me.bufferSize);
      }
      writeStringToMemory(s, me.buffer);
      return me.buffer;
    }

  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }

  
  
  
  
  function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }


  
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var fd = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return fd === -1 ? 0 : FS.getPtrForStream(FS.getStream(fd));
    }

  var _emscripten_check_longjmp=true;

  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var fd = _fileno(stream);
      var ret = _write(fd, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }

  var _log=Math_log;

  var _emscripten_postinvoke=true;

  
  function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;


  function _system(command) {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }

  function _frexp(x, exp_addr) {
      var sig = 0, exp_ = 0;
      if (x !== 0) {
        var sign = 1;
        if (x < 0) {
          x = -x;
          sign = -1;
        }
        var raw_exp = Math.log(x)/Math.log(2);
        exp_ = Math.ceil(raw_exp);
        if (exp_ === raw_exp) exp_ += 1;
        sig = sign*x/Math.pow(2, exp_);
      }
      HEAP32[((exp_addr)>>2)]=exp_;
      return sig;
    }

  
  
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60;
  
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr;
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr;
    }function _mktime(tmPtr) {
      _tzset();
      var year = HEAP32[(((tmPtr)+(20))>>2)];
      var timestamp = new Date(year >= 1900 ? year : year + 1900,
                               HEAP32[(((tmPtr)+(16))>>2)],
                               HEAP32[(((tmPtr)+(12))>>2)],
                               HEAP32[(((tmPtr)+(8))>>2)],
                               HEAP32[(((tmPtr)+(4))>>2)],
                               HEAP32[((tmPtr)>>2)],
                               0).getTime() / 1000;
      HEAP32[(((tmPtr)+(24))>>2)]=new Date(timestamp).getDay();
      var yday = Math.round((timestamp - (new Date(year, 0, 1)).getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      return timestamp;
    }

  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      writeAsciiToMemory(result, s);
      return s;
    }

  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
          function pointerLockChange() {
            Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                  document['mozPointerLockElement'] === canvas ||
                                  document['webkitPointerLockElement'] === canvas ||
                                  document['msPointerLockElement'] === canvas;
          }
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};

  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }

  
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60;
  
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  function _srand(seed) {
      HEAP32[((___rand_seed)>>2)]=seed
    }

  var _emscripten_prep_setjmp=true;

  
  
   
  Module["_testSetjmp"] = _testSetjmp;function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }function _emscripten_longjmp(env, value) {
      _longjmp(env, value);
    }

  var _ceil=Math_ceil;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _llvm_pow_f64=Math_pow;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  
  function _sinh(x) {
      var p = Math.pow(Math.E, x);
      return (p - (1 / p)) / 2;
    }
  
  function _cosh(x) {
      var p = Math.pow(Math.E, x);
      return (p + (1 / p)) / 2;
    }function _tanh(x) {
      return _sinh(x) / _cosh(x);
    }

  function _localeconv() {
      // %struct.timeval = type { char* decimal point, other stuff... }
      // var indexes = Runtime.calculateStructAlignment({ fields: ['i32', 'i32'] });
      var me = _localeconv;
      if (!me.ret) {
      // These are defaults from the "C" locale
        me.ret = allocate([
          allocate(intArrayFromString('.'), 'i8', ALLOC_NORMAL),0,0,0, // decimal_point
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // thousands_sep
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // grouping
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // int_curr_symbol
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // currency_symbol
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // mon_decimal_point
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // mon_thousands_sep
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // mon_grouping
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0, // positive_sign
          allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL),0,0,0 // negative_sign
        ], 'i8*', ALLOC_NORMAL); // Allocate strings in lconv, still don't allocate chars
      }
      return me.ret;
    }

  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
                if (next === 0) return i > 0 ? fields : fields-1; // we failed to read the full length of this field
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var quarter = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
            if (format[formatIndex] == 'h') {
              quarter = true;
              formatIndex++;
            }
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          var base = 10;
          switch (type) {
            case 'X': case 'x':
              base = 16;
            case 'd': case 'u': case 'i':
              if (quarter) {
                HEAP8[(argPtr)]=parseInt(text, base);
              } else if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, base);
              } else if (longLong) {
                (tempI64 = [parseInt(text, base)>>>0,(tempDouble=parseInt(text, base),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, base);
              }
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }
  
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }
  
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) {
        return -1;
      }
      var buffer = [];
      function get() {
        var c = _fgetc(stream);
        buffer.push(c);
        return c;
      };
      function unget() {
        _ungetc(buffer.pop(), stream);
      };
      return __scanString(format, get, unget, varargs);
    }

  var _emscripten_preinvoke=true;

  
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }

  function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }


  function _rename(old_path, new_path) {
      // int rename(const char *old, const char *new);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rename.html
      old_path = Pointer_stringify(old_path);
      new_path = Pointer_stringify(new_path);
      try {
        FS.rename(old_path, new_path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }


  function ___errno_location() {
      return ___errno_state;
    }

   
  Module["_memset"] = _memset;


   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  function _abort() {
      Module['abort']();
    }


  function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_;
      }
      HEAP8[(((s)+(i))|0)]=0;
      return s;
    }

  var _tan=Math_tan;

  function _ispunct(chr) {
      return (chr >= 33 && chr <= 47) ||
             (chr >= 58 && chr <= 64) ||
             (chr >= 91 && chr <= 96) ||
             (chr >= 123 && chr <= 126);
    }

  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStreamFromPtr(stream);
      return Number(stream && stream.eof);
    }

   
  Module["_tolower"] = _tolower;

  var _asin=Math_asin;

  function _clearerr(stream) {
      // void clearerr(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/clearerr.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        return;
      }
      stream.eof = false;
      stream.error = false;
    }

  var _fabs=Math_abs;

  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000000/1000));
    }


  var _getc=_fgetc;

  function _emscripten_exit_with_live_runtime() {
      Module['noExitRuntime'] = true;
      throw 'SimulateInfiniteLoop';
    }

  var _sqrt=Math_sqrt;

  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }

  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  var _emscripten_get_longjmp_result=true;

  var _sin=Math_sin;

  
  function _fmod(x, y) {
      return x % y;
    }var _fmodl=_fmod;



  var _atan=Math_atan;

  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStreamFromPtr(stream);
      return Number(stream && stream.error);
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }

  
  function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  function _isgraph(chr) {
      return 0x20 < chr && chr < 0x7F;
    }


  
  
  
  
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }

  var _emscripten_setjmp=true;

  var _cos=Math_cos;

  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  var _BItoD=true;

  function _emscripten_run_script_int(ptr) {
      return eval(Pointer_stringify(ptr))|0;
    }

  function _difftime(time1, time0) {
      return time1 - time0;
    }

  var _floor=Math_floor;

  function _iscntrl(chr) {
      return (0 <= chr && chr <= 0x1F) || chr === 0x7F;
    }

  var _atan2=Math_atan2;

  function _setvbuf(stream, buf, type, size) {
      // int setvbuf(FILE *restrict stream, char *restrict buf, int type, size_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setvbuf.html
      // TODO: Implement custom buffering.
      return 0;
    }

  var _exp=Math_exp;

  var _copysignl=_copysign;

  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }

  var _acos=Math_acos;

  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }

  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }



FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.___rand_seed|0;var p=env._stderr|0;var q=env._stdin|0;var r=env._stdout|0;var s=0;var t=0;var u=0;var v=0;var w=+env.NaN,x=+env.Infinity;var y=0,z=0,A=0,B=0,C=0.0,D=0,E=0,F=0,G=0.0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=global.Math.floor;var S=global.Math.abs;var T=global.Math.sqrt;var U=global.Math.pow;var V=global.Math.cos;var W=global.Math.sin;var X=global.Math.tan;var Y=global.Math.acos;var Z=global.Math.asin;var _=global.Math.atan;var $=global.Math.atan2;var aa=global.Math.exp;var ba=global.Math.log;var ca=global.Math.ceil;var da=global.Math.imul;var ea=env.abort;var fa=env.assert;var ga=env.asmPrintInt;var ha=env.asmPrintFloat;var ia=env.min;var ja=env.invoke_ii;var ka=env.invoke_iiii;var la=env.invoke_vii;var ma=env.invoke_iii;var na=env.invoke_iiiii;var oa=env._isalnum;var pa=env._fabs;var qa=env._frexp;var ra=env._exp;var sa=env._fread;var ta=env._log10;var ua=env._longjmp;var va=env.__addDays;var wa=env._fsync;var xa=env._rename;var ya=env._sbrk;var za=env._emscripten_memcpy_big;var Aa=env._sinh;var Ba=env._sysconf;var Ca=env._close;var Da=env._ferror;var Ea=env._clock;var Fa=env._cos;var Ga=env._tanh;var Ha=env._emscripten_run_script_int;var Ia=env._unlink;var Ja=env._write;var Ka=env.__isLeapYear;var La=env._ftell;var Ma=env._isupper;var Na=env._gmtime_r;var Oa=env._islower;var Pa=env._tmpnam;var Qa=env._tmpfile;var Ra=env._emscripten_exit_with_live_runtime;var Sa=env._emscripten_run_script_string;var Ta=env._send;var Ua=env._abort;var Va=env._setvbuf;var Wa=env._atan2;var Xa=env._setlocale;var Ya=env._isgraph;var Za=env._modf;var _a=env._strerror_r;var $a=env._gmtime;var ab=env._fscanf;var bb=env.___setErrNo;var cb=env._isalpha;var db=env._srand;var eb=env._mktime;var fb=env._putchar;var gb=env._floor;var hb=env._localeconv;var ib=env._printf;var jb=env._sprintf;var kb=env._localtime;var lb=env._read;var mb=env._fwrite;var nb=env._time;var ob=env._fprintf;var pb=env._exit;var qb=env._freopen;var rb=env._llvm_pow_f64;var sb=env._fgetc;var tb=env._fmod;var ub=env._lseek;var vb=env._rmdir;var wb=env._asin;var xb=env.___buildEnvironment;var yb=env._pwrite;var zb=env._localtime_r;var Ab=env._tzset;var Bb=env._open;var Cb=env._remove;var Db=env._snprintf;var Eb=env.__scanString;var Fb=env._strftime;var Gb=env._fseek;var Hb=env._iscntrl;var Ib=env._getenv;var Jb=env._fclose;var Kb=env._log;var Lb=env._recv;var Mb=env._tan;var Nb=env._copysign;var Ob=env.__getFloat;var Pb=env._fputc;var Qb=env._ispunct;var Rb=env._ceil;var Sb=env._isspace;var Tb=env._fopen;var Ub=env._sin;var Vb=env._acos;var Wb=env._cosh;var Xb=env._difftime;var Yb=env._ungetc;var Zb=env._system;var _b=env._fflush;var $b=env.__reallyNegative;var ac=env._fileno;var bc=env.__exit;var cc=env.__arraySum;var dc=env._fgets;var ec=env._atan;var fc=env._pread;var gc=env._mkport;var hc=env._toupper;var ic=env._feof;var jc=env.___errno_location;var kc=env._clearerr;var lc=env._isxdigit;var mc=env._strerror;var nc=env._emscripten_longjmp;var oc=env.__formatString;var pc=env._sqrt;var qc=0.0;
// EMSCRIPTEN_START_FUNCS
function wc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function xc(){return i|0}function yc(a){a=a|0;i=a}function zc(a,b){a=a|0;b=b|0;if((s|0)==0){s=a;t=b}}function Ac(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Bc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Cc(a){a=a|0;H=a}function Dc(a){a=a|0;I=a}function Ec(a){a=a|0;J=a}function Fc(a){a=a|0;K=a}function Gc(a){a=a|0;L=a}function Hc(a){a=a|0;M=a}function Ic(a){a=a|0;N=a}function Jc(a){a=a|0;O=a}function Kc(a){a=a|0;P=a}function Lc(a){a=a|0;Q=a}function Mc(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;e=c[2]|0;Me(e,a,Zm(a|0)|0,16,0)|0;if((Sd(c[2]|0,0,0,0,0,0)|0)==0){i=b;return}c[d>>2]=kd(c[2]|0,-1,0)|0;ib(24,d|0)|0;i=b;return}function Nc(a,b){a=a|0;b=b|0;b=i;a=Ze()|0;c[2]=a;Xd(a,0,0)|0;ng(c[2]|0);Xd(c[2]|0,1,0)|0;Ra();i=b;return 0}function Oc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+16|0;e=d;c[e>>2]=b;f=c[a+16>>2]|0;g=a+8|0;h=c[g>>2]|0;j=h;do{if(((c[a+24>>2]|0)-j>>4|0)<=(b|0)){if(((j-(c[a+28>>2]|0)>>4)+5|0)>(1e6-b|0)){k=0;i=d;return k|0}l=(tf(a,1,e)|0)==0;if(l){m=c[g>>2]|0;n=c[e>>2]|0;o=l&1;break}else{k=0;i=d;return k|0}}else{m=h;n=b;o=1}}while(0);b=f+4|0;f=m+(n<<4)|0;if(!((c[b>>2]|0)>>>0<f>>>0)){k=o;i=d;return k|0}c[b>>2]=f;k=o;i=d;return k|0}function Pc(a,b){a=a|0;b=b|0;var d=0;d=i;vf(a,c[b>>2]|0);i=d;return}function Qc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;if((a|0)==(b|0)){i=e;return}f=a+8|0;a=(c[f>>2]|0)+(0-d<<4)|0;c[f>>2]=a;if((d|0)<=0){i=e;return}g=b+8|0;b=a;a=0;while(1){h=c[g>>2]|0;c[g>>2]=h+16;j=b+(a<<4)|0;k=c[j+4>>2]|0;l=h;c[l>>2]=c[j>>2];c[l+4>>2]=k;c[h+8>>2]=c[b+(a<<4)+8>>2];h=a+1|0;if((h|0)==(d|0)){break}b=c[f>>2]|0;a=h}i=e;return}function Rc(a,b){a=a|0;b=b|0;var d=0;d=(c[a+12>>2]|0)+168|0;a=c[d>>2]|0;c[d>>2]=b;return a|0}function Sc(a){a=a|0;var b=0;if((a|0)==0){b=40}else{b=c[(c[a+12>>2]|0)+176>>2]|0}return b|0}function Tc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;if((b+1000999|0)>>>0>1000999){e=b;i=d;return e|0}e=((c[a+8>>2]|0)-(c[c[a+16>>2]>>2]|0)>>4)+b|0;i=d;return e|0}function Uc(a){a=a|0;return(c[a+8>>2]|0)-((c[c[a+16>>2]>>2]|0)+16)>>4|0}function Vc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;if(!((b|0)>-1)){e=a+8|0;c[e>>2]=(c[e>>2]|0)+(b+1<<4);i=d;return}e=a+8|0;f=c[e>>2]|0;g=(c[c[a+16>>2]>>2]|0)+(b+1<<4)|0;if(f>>>0<g>>>0){b=f;do{f=b;b=b+16|0;c[f+8>>2]=0}while(b>>>0<g>>>0);c[e>>2]=b}c[e>>2]=g;i=d;return}function Wc(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=g+16|0;f=a+8|0;a=c[f>>2]|0;if(b>>>0<a>>>0){l=b;m=g}else{n=a;o=n+ -16|0;c[f>>2]=o;i=e;return}while(1){a=l;g=c[a+4>>2]|0;b=m;c[b>>2]=c[a>>2];c[b+4>>2]=g;c[m+8>>2]=c[m+24>>2];g=l+16|0;b=c[f>>2]|0;if(g>>>0<b>>>0){a=l;l=g;m=a}else{n=b;break}}o=n+ -16|0;c[f>>2]=o;i=e;return}function Xc(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=a+8|0;a=c[b>>2]|0;if(a>>>0>g>>>0){f=a;do{h=f;f=f+ -16|0;k=f;j=c[k+4>>2]|0;l=h;c[l>>2]=c[k>>2];c[l+4>>2]=j;c[h+8>>2]=c[h+ -8>>2]}while(f>>>0>g>>>0);m=c[b>>2]|0}else{m=a}a=m;b=c[a+4>>2]|0;f=g;c[f>>2]=c[a>>2];c[f+4>>2]=b;c[g+8>>2]=c[m+8>>2];i=e;return}function Yc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=b+8|0;h=c[g>>2]|0;j=h+ -16|0;k=b+16|0;l=c[k>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){m=h+(e<<4)|0;break}if((e|0)==-1001e3){m=(c[b+12>>2]|0)+40|0;break}n=-1001e3-e|0;o=c[l>>2]|0;if((c[o+8>>2]|0)!=22?(p=c[o>>2]|0,(n|0)<=(d[p+6|0]|0|0)):0){m=p+(n+ -1<<4)+16|0}else{m=4320}}else{n=(c[l>>2]|0)+(e<<4)|0;m=n>>>0<h>>>0?n:4320}}while(0);l=j;n=c[l+4>>2]|0;p=m;c[p>>2]=c[l>>2];c[p+4>>2]=n;n=h+ -8|0;c[m+8>>2]=c[n>>2];if((((e|0)<-1001e3?(c[n>>2]&64|0)!=0:0)?(n=c[j>>2]|0,!((a[n+5|0]&3)==0)):0)?(j=c[c[c[k>>2]>>2]>>2]|0,!((a[j+5|0]&4)==0)):0){Uf(b,j,n)}c[g>>2]=(c[g>>2]|0)+ -16;i=f;return}function Zc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;h=b+16|0;j=c[h>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){k=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[b+12>>2]|0)+40|0;break}l=-1001e3-e|0;m=c[j>>2]|0;if((c[m+8>>2]|0)!=22?(n=c[m>>2]|0,(l|0)<=(d[n+6|0]|0|0)):0){k=n+(l+ -1<<4)+16|0}else{k=4320}}else{l=(c[j>>2]|0)+(e<<4)|0;k=l>>>0<(c[b+8>>2]|0)>>>0?l:4320}}while(0);do{if((f|0)<=0){if(!((f|0)<-1000999)){o=(c[b+8>>2]|0)+(f<<4)|0;break}if((f|0)==-1001e3){o=(c[b+12>>2]|0)+40|0;break}e=-1001e3-f|0;l=c[j>>2]|0;if((c[l+8>>2]|0)!=22?(n=c[l>>2]|0,(e|0)<=(d[n+6|0]|0|0)):0){o=n+(e+ -1<<4)+16|0}else{o=4320}}else{e=(c[j>>2]|0)+(f<<4)|0;o=e>>>0<(c[b+8>>2]|0)>>>0?e:4320}}while(0);j=k;e=c[j+4>>2]|0;n=o;c[n>>2]=c[j>>2];c[n+4>>2]=e;e=k+8|0;c[o+8>>2]=c[e>>2];if(!((f|0)<-1001e3)){i=g;return}if((c[e>>2]&64|0)==0){i=g;return}e=c[k>>2]|0;if((a[e+5|0]&3)==0){i=g;return}k=c[c[c[h>>2]>>2]>>2]|0;if((a[k+5|0]&4)==0){i=g;return}Uf(b,k,e);i=g;return}function _c(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=a+8|0;a=c[b>>2]|0;f=g;h=c[f+4>>2]|0;k=a;c[k>>2]=c[f>>2];c[k+4>>2]=h;c[a+8>>2]=c[g+8>>2];c[b>>2]=(c[b>>2]|0)+16;i=e;return}function $c(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)==22){k=-1;i=e;return k|0}l=c[j>>2]|0;if((h|0)>(d[l+6|0]|0|0)){k=-1;i=e;return k|0}else{g=l+(h+ -1<<4)+16|0;break}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);if((g|0)==4320){k=-1;i=e;return k|0}k=c[g+8>>2]&15;i=e;return k|0}function ad(a,b){a=a|0;b=b|0;return c[7656+(b+1<<2)>>2]|0}function bd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);a=c[g+8>>2]|0;i=e;return((a|0)==22|(a|0)==102)&1|0}function cd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;f=e;g=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);if((c[h+8>>2]|0)==3){m=1;n=m&1;i=e;return n|0}m=(Nj(h,f)|0)!=0;n=m&1;i=e;return n|0}function dd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)==22){k=0;l=k&1;i=e;return l|0}m=c[j>>2]|0;if((h|0)>(d[m+6|0]|0|0)){k=0;l=k&1;i=e;return l|0}else{g=m+(h+ -1<<4)+16|0;break}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);if((g|0)==4320){k=0;l=k&1;i=e;return l|0}k=((c[g+8>>2]&15)+ -3|0)>>>0<2;l=k&1;i=e;return l|0}function ed(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;g=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);do{if((e|0)<=0){if(!((e|0)<-1000999)){m=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){m=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){n=0;i=f;return n|0}l=c[j>>2]|0;if((b|0)>(d[l+6|0]|0|0)){n=0;i=f;return n|0}else{m=l+(b+ -1<<4)+16|0;break}}else{b=(c[g>>2]|0)+(e<<4)|0;m=b>>>0<(c[a+8>>2]|0)>>>0?b:4320}}while(0);if((h|0)==4320|(m|0)==4320){n=0;i=f;return n|0}if((c[h+8>>2]|0)==(c[m+8>>2]|0)){o=(Tj(0,h,m)|0)!=0}else{o=0}n=o&1;i=f;return n|0}function fd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;h=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;l=c[h>>2]|0;if((c[l+8>>2]|0)!=22?(m=c[l>>2]|0,(k|0)<=(d[m+6|0]|0|0)):0){j=m+(k+ -1<<4)+16|0}else{j=4320}}else{k=(c[h>>2]|0)+(b<<4)|0;j=k>>>0<(c[a+8>>2]|0)>>>0?k:4320}}while(0);do{if((e|0)<=0){if(!((e|0)<-1000999)){n=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){n=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;k=c[h>>2]|0;if((c[k+8>>2]|0)==22){o=0;i=g;return o|0}m=c[k>>2]|0;if((b|0)>(d[m+6|0]|0|0)){o=0;i=g;return o|0}else{n=m+(b+ -1<<4)+16|0;break}}else{b=(c[h>>2]|0)+(e<<4)|0;n=b>>>0<(c[a+8>>2]|0)>>>0?b:4320}}while(0);if((j|0)==4320|(n|0)==4320){o=0;i=g;return o|0}if((f|0)==1){o=Rj(a,j,n)|0;i=g;return o|0}else if((f|0)==2){o=Sj(a,j,n)|0;i=g;return o|0}else if((f|0)==0){if((c[j+8>>2]|0)==(c[n+8>>2]|0)){p=(Tj(a,j,n)|0)!=0}else{p=0}o=p&1;i=g;return o|0}else{o=0;i=g;return o|0}return 0}function gd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0;f=i;i=i+16|0;g=f;j=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){k=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){k=(c[a+12>>2]|0)+40|0;break}l=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)!=22?(n=c[m>>2]|0,(l|0)<=(d[n+6|0]|0|0)):0){k=n+(l+ -1<<4)+16|0}else{k=4320}}else{l=(c[j>>2]|0)+(b<<4)|0;k=l>>>0<(c[a+8>>2]|0)>>>0?l:4320}}while(0);if((c[k+8>>2]|0)!=3){a=Nj(k,g)|0;if((a|0)==0){if((e|0)==0){o=0.0;i=f;return+o}c[e>>2]=0;o=0.0;i=f;return+o}else{p=a}}else{p=k}if((e|0)!=0){c[e>>2]=1}o=+h[p>>3];i=f;return+o}function hd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;g=f;j=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){k=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){k=(c[a+12>>2]|0)+40|0;break}l=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)!=22?(n=c[m>>2]|0,(l|0)<=(d[n+6|0]|0|0)):0){k=n+(l+ -1<<4)+16|0}else{k=4320}}else{l=(c[j>>2]|0)+(b<<4)|0;k=l>>>0<(c[a+8>>2]|0)>>>0?l:4320}}while(0);if((c[k+8>>2]|0)!=3){a=Nj(k,g)|0;if((a|0)==0){if((e|0)==0){o=0;i=f;return o|0}c[e>>2]=0;o=0;i=f;return o|0}else{p=a}}else{p=k}k=~~+h[p>>3];if((e|0)==0){o=k;i=f;return o|0}c[e>>2]=1;o=k;i=f;return o|0}function id(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+32|0;g=f+8|0;j=f;k=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}m=-1001e3-b|0;n=c[k>>2]|0;if((c[n+8>>2]|0)!=22?(o=c[n>>2]|0,(m|0)<=(d[o+6|0]|0|0)):0){l=o+(m+ -1<<4)+16|0}else{l=4320}}else{m=(c[k>>2]|0)+(b<<4)|0;l=m>>>0<(c[a+8>>2]|0)>>>0?m:4320}}while(0);if((c[l+8>>2]|0)!=3){a=Nj(l,g)|0;if((a|0)==0){if((e|0)==0){p=0;i=f;return p|0}c[e>>2]=0;p=0;i=f;return p|0}else{q=a}}else{q=l}h[j>>3]=+h[q>>3]+6755399441055744.0;q=c[j>>2]|0;if((e|0)==0){p=q;i=f;return p|0}c[e>>2]=1;p=q;i=f;return p|0}function jd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);a=c[g+8>>2]|0;if((a|0)==0){l=0;m=l&1;i=e;return m|0}if((a|0)!=1){l=1;m=l&1;i=e;return m|0}l=(c[g>>2]|0)!=0;m=l&1;i=e;return m|0}function kd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=a+16|0;h=c[g>>2]|0;j=(b|0)>0;do{if(!j){if(!((b|0)<-1000999)){k=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){k=(c[a+12>>2]|0)+40|0;break}l=-1001e3-b|0;m=c[h>>2]|0;if((c[m+8>>2]|0)!=22?(n=c[m>>2]|0,(l|0)<=(d[n+6|0]|0|0)):0){k=n+(l+ -1<<4)+16|0}else{k=4320}}else{l=(c[h>>2]|0)+(b<<4)|0;k=l>>>0<(c[a+8>>2]|0)>>>0?l:4320}}while(0);do{if((c[k+8>>2]&15|0)!=4){if((Oj(a,k)|0)==0){if((e|0)==0){o=0;i=f;return o|0}c[e>>2]=0;o=0;i=f;return o|0}h=a+12|0;if((c[(c[h>>2]|0)+12>>2]|0)>0){gg(a)}l=c[g>>2]|0;if(j){n=(c[l>>2]|0)+(b<<4)|0;p=n>>>0<(c[a+8>>2]|0)>>>0?n:4320;break}if(!((b|0)<-1000999)){p=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){p=(c[h>>2]|0)+40|0;break}h=-1001e3-b|0;n=c[l>>2]|0;if((c[n+8>>2]|0)!=22?(l=c[n>>2]|0,(h|0)<=(d[l+6|0]|0|0)):0){p=l+(h+ -1<<4)+16|0}else{p=4320}}else{p=k}}while(0);k=c[p>>2]|0;if((e|0)!=0){c[e>>2]=c[k+12>>2]}o=k+16|0;i=f;return o|0}function ld(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);a=c[g+8>>2]&15;if((a|0)==7){l=c[(c[g>>2]|0)+16>>2]|0;i=e;return l|0}else if((a|0)==5){l=vj(c[g>>2]|0)|0;i=e;return l|0}else if((a|0)==4){l=c[(c[g>>2]|0)+12>>2]|0;i=e;return l|0}else{l=0;i=e;return l|0}return 0}function md(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);a=c[g+8>>2]&15;if((a|0)==2){l=c[g>>2]|0;i=e;return l|0}else if((a|0)==7){l=(c[g>>2]|0)+24|0;i=e;return l|0}else{l=0;i=e;return l|0}return 0}function nd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);if((c[g+8>>2]|0)!=72){l=0;i=e;return l|0}l=c[g>>2]|0;i=e;return l|0}function od(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=c[a+16>>2]|0;g=(b|0)>0;do{if(!g){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[f>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[f>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);switch(c[h+8>>2]&63|0){case 6:{m=c[h>>2]|0;i=e;return m|0};case 38:{m=c[h>>2]|0;i=e;return m|0};case 22:{m=c[h>>2]|0;i=e;return m|0};case 5:{m=c[h>>2]|0;i=e;return m|0};case 8:{m=c[h>>2]|0;i=e;return m|0};case 2:case 7:{do{if(!g){if(!((b|0)<-1000999)){n=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){n=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(l=c[j>>2]|0,(h|0)<=(d[l+6|0]|0|0)):0){n=l+(h+ -1<<4)+16|0}else{n=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;n=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);a=c[n+8>>2]&15;if((a|0)==7){m=(c[n>>2]|0)+24|0;i=e;return m|0}else if((a|0)==2){m=c[n>>2]|0;i=e;return m|0}else{m=0;i=e;return m|0}break};default:{m=0;i=e;return m|0}}return 0}function pd(a){a=a|0;var b=0;b=a+8|0;a=c[b>>2]|0;c[a+8>>2]=0;c[b>>2]=a+16;return}function qd(a,b){a=a|0;b=+b;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=b;c[a+8>>2]=3;c[d>>2]=a+16;return}function rd(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=+(b|0);c[a+8>>2]=3;c[d>>2]=a+16;return}function sd(a,b){a=a|0;b=b|0;var d=0.0;if((b|0)>-1){d=+(b|0)}else{d=+(b>>>0)}b=a+8|0;a=c[b>>2]|0;h[a>>3]=d;c[a+8>>2]=3;c[b>>2]=a+16;return}function td(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=i;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}g=Mi(a,b,e)|0;e=a+8|0;a=c[e>>2]|0;c[a>>2]=g;c[a+8>>2]=d[g+4|0]|0|64;c[e>>2]=(c[e>>2]|0)+16;i=f;return g+16|0}function ud(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=i;if((b|0)==0){f=a+8|0;g=c[f>>2]|0;c[g+8>>2]=0;c[f>>2]=g+16;h=0;i=e;return h|0}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}g=Ni(a,b)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=g;c[a+8>>2]=d[g+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;h=g+16|0;i=e;return h|0}function vd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}f=Qh(a,b,d)|0;i=e;return f|0}function wd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}c[f>>2]=d;d=Qh(a,b,f)|0;i=e;return d|0}function xd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;if((d|0)==0){f=c[a+8>>2]|0;c[f>>2]=b;c[f+8>>2]=22;g=a+8|0;h=c[g>>2]|0;j=h+16|0;c[g>>2]=j;i=e;return}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}f=Lf(a,d)|0;c[f+12>>2]=b;b=a+8|0;k=(c[b>>2]|0)+(0-d<<4)|0;c[b>>2]=k;l=d;d=k;do{l=l+ -1|0;k=d+(l<<4)|0;m=c[k+4>>2]|0;n=f+(l<<4)+16|0;c[n>>2]=c[k>>2];c[n+4>>2]=m;c[f+(l<<4)+24>>2]=c[d+(l<<4)+8>>2];d=c[b>>2]|0}while((l|0)!=0);c[d>>2]=f;c[d+8>>2]=102;g=a+8|0;h=c[g>>2]|0;j=h+16|0;c[g>>2]=j;i=e;return}function yd(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=(b|0)!=0;c[a+8>>2]=1;c[d>>2]=a+16;return}function zd(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=b;c[a+8>>2]=2;c[d>>2]=(c[d>>2]|0)+16;return}function Ad(a){a=a|0;var b=0,d=0;b=a+8|0;d=c[b>>2]|0;c[d>>2]=a;c[d+8>>2]=72;c[b>>2]=(c[b>>2]|0)+16;return(c[(c[a+12>>2]|0)+172>>2]|0)==(a|0)|0}function Bd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=sj(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;g=a+8|0;h=c[g>>2]|0;c[g>>2]=h+16;j=Ni(a,b)|0;c[h>>2]=j;c[h+8>>2]=d[j+4|0]|0|64;j=(c[g>>2]|0)+ -16|0;Pj(a,f,j,j);i=e;return}function Cd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=(c[a+8>>2]|0)+ -16|0;Pj(a,g,b,b);i=e;return}function Dd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);b=a+8|0;g=c[b>>2]|0;j=Ni(a,e)|0;c[g>>2]=j;c[g+8>>2]=d[j+4|0]|0|64;j=c[b>>2]|0;c[b>>2]=j+16;Pj(a,h,j,j);i=f;return}function Ed(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=a+8|0;a=uj(c[g>>2]|0,(c[b>>2]|0)+ -16|0)|0;g=c[b>>2]|0;b=a;f=c[b+4>>2]|0;h=g+ -16|0;c[h>>2]=c[b>>2];c[h+4>>2]=f;c[g+ -8>>2]=c[a+8>>2];i=e;return}function Fd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);b=sj(c[h>>2]|0,e)|0;e=a+8|0;a=c[e>>2]|0;h=b;g=c[h+4>>2]|0;j=a;c[j>>2]=c[h>>2];c[j+4>>2]=g;c[a+8>>2]=c[b+8>>2];c[e>>2]=(c[e>>2]|0)+16;i=f;return}function Gd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}f=oj(a)|0;g=a+8|0;h=c[g>>2]|0;c[h>>2]=f;c[h+8>>2]=69;c[g>>2]=(c[g>>2]|0)+16;if(!((b|0)>0|(d|0)>0)){i=e;return}jj(a,f,b,d);i=e;return}function Hd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=c[g+8>>2]&15;if((b|0)==5){l=c[(c[g>>2]|0)+8>>2]|0}else if((b|0)==7){l=c[(c[g>>2]|0)+8>>2]|0}else{l=c[(c[a+12>>2]|0)+(b<<2)+252>>2]|0}if((l|0)==0){m=0;i=e;return m|0}b=a+8|0;a=c[b>>2]|0;c[a>>2]=l;c[a+8>>2]=69;c[b>>2]=(c[b>>2]|0)+16;m=1;i=e;return m|0}function Id(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=c[(c[g>>2]|0)+12>>2]|0;g=a+8|0;a=c[g>>2]|0;if((b|0)==0){c[a+8>>2]=0;l=a;m=l+16|0;c[g>>2]=m;i=e;return}else{c[a>>2]=b;c[a+8>>2]=69;l=c[g>>2]|0;m=l+16|0;c[g>>2]=m;i=e;return}}function Jd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=sj(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;g=a+8|0;h=c[g>>2]|0;c[g>>2]=h+16;j=Ni(a,b)|0;c[h>>2]=j;c[h+8>>2]=d[j+4|0]|0|64;j=c[g>>2]|0;Qj(a,f,j+ -16|0,j+ -32|0);c[g>>2]=(c[g>>2]|0)+ -32;i=e;return}function Kd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=a+8|0;f=c[b>>2]|0;Qj(a,g,f+ -32|0,f+ -16|0);c[b>>2]=(c[b>>2]|0)+ -32;i=e;return}function Ld(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);b=a+8|0;g=c[b>>2]|0;c[b>>2]=g+16;j=Ni(a,e)|0;c[g>>2]=j;c[g+8>>2]=d[j+4|0]|0|64;j=c[b>>2]|0;Qj(a,h,j+ -16|0,j+ -32|0);c[b>>2]=(c[b>>2]|0)+ -32;i=f;return}function Md(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;g=c[b+16>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}j=-1001e3-e|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(e<<4)|0;h=j>>>0<(c[b+8>>2]|0)>>>0?j:4320}}while(0);e=b+8|0;g=c[e>>2]|0;j=mj(b,c[h>>2]|0,g+ -32|0)|0;l=g+ -16|0;k=c[l+4>>2]|0;m=j;c[m>>2]=c[l>>2];c[m+4>>2]=k;c[j+8>>2]=c[g+ -8>>2];a[(c[h>>2]|0)+6|0]=0;g=c[e>>2]|0;if((c[g+ -8>>2]&64|0)==0){n=g;o=n+ -32|0;c[e>>2]=o;i=f;return}if((a[(c[g+ -16>>2]|0)+5|0]&3)==0){n=g;o=n+ -32|0;c[e>>2]=o;i=f;return}j=c[h>>2]|0;if((a[j+5|0]&4)==0){n=g;o=n+ -32|0;c[e>>2]=o;i=f;return}Wf(b,j);n=c[e>>2]|0;o=n+ -32|0;c[e>>2]=o;i=f;return}function Nd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;h=c[b+16>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){j=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){j=(c[b+12>>2]|0)+40|0;break}k=-1001e3-e|0;l=c[h>>2]|0;if((c[l+8>>2]|0)!=22?(m=c[l>>2]|0,(k|0)<=(d[m+6|0]|0|0)):0){j=m+(k+ -1<<4)+16|0}else{j=4320}}else{k=(c[h>>2]|0)+(e<<4)|0;j=k>>>0<(c[b+8>>2]|0)>>>0?k:4320}}while(0);e=b+8|0;lj(b,c[j>>2]|0,f,(c[e>>2]|0)+ -16|0);f=c[e>>2]|0;if((c[f+ -8>>2]&64|0)==0){n=f;o=n+ -16|0;c[e>>2]=o;i=g;return}if((a[(c[f+ -16>>2]|0)+5|0]&3)==0){n=f;o=n+ -16|0;c[e>>2]=o;i=g;return}h=c[j>>2]|0;if((a[h+5|0]&4)==0){n=f;o=n+ -16|0;c[e>>2]=o;i=g;return}Wf(b,h);n=c[e>>2]|0;o=n+ -16|0;c[e>>2]=o;i=g;return}function Od(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;g=c[b+16>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}j=-1001e3-e|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(e<<4)|0;h=j>>>0<(c[b+8>>2]|0)>>>0?j:4320}}while(0);e=b+8|0;g=c[e>>2]|0;if((c[g+ -8>>2]|0)==0){m=0}else{m=c[g+ -16>>2]|0}g=c[h+8>>2]&15;if((g|0)==7){c[(c[h>>2]|0)+8>>2]=m;if((m|0)==0){n=c[e>>2]|0;o=n+ -16|0;c[e>>2]=o;i=f;return 1}if(!((a[m+5|0]&3)==0)?(j=c[h>>2]|0,!((a[j+5|0]&4)==0)):0){Uf(b,j,m)}_f(b,c[h>>2]|0,m);n=c[e>>2]|0;o=n+ -16|0;c[e>>2]=o;i=f;return 1}else if((g|0)==5){c[(c[h>>2]|0)+8>>2]=m;if((m|0)==0){n=c[e>>2]|0;o=n+ -16|0;c[e>>2]=o;i=f;return 1}if(!((a[m+5|0]&3)==0)?(j=c[h>>2]|0,!((a[j+5|0]&4)==0)):0){Wf(b,j)}_f(b,c[h>>2]|0,m);n=c[e>>2]|0;o=n+ -16|0;c[e>>2]=o;i=f;return 1}else{c[(c[b+12>>2]|0)+(g<<2)+252>>2]=m;n=c[e>>2]|0;o=n+ -16|0;c[e>>2]=o;i=f;return 1}return 0}function Pd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=c[b+16>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}j=-1001e3-e|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(e<<4)|0;h=j>>>0<(c[b+8>>2]|0)>>>0?j:4320}}while(0);e=b+8|0;g=c[e>>2]|0;if((c[g+ -8>>2]|0)!=0){c[(c[h>>2]|0)+12>>2]=c[g+ -16>>2];g=c[(c[e>>2]|0)+ -16>>2]|0;if(!((a[g+5|0]&3)==0)?(j=c[h>>2]|0,!((a[j+5|0]&4)==0)):0){Uf(b,j,g)}}else{c[(c[h>>2]|0)+12>>2]=0}c[e>>2]=(c[e>>2]|0)+ -16;i=f;return}function Qd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=c[b+16>>2]|0;if((a[g+18|0]&8)==0){h=0;i=f;return h|0}if((e|0)!=0){c[e>>2]=c[g+24>>2]}h=d[g+37|0]|0;i=f;return h|0}function Rd(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0;h=i;j=a+8|0;k=(c[j>>2]|0)+(~d<<4)|0;if((g|0)!=0?(b[a+36>>1]|0)==0:0){d=a+16|0;c[(c[d>>2]|0)+28>>2]=g;c[(c[d>>2]|0)+24>>2]=f;Af(a,k,e,1)}else{Af(a,k,e,0)}if(!((e|0)==-1)){i=h;return}e=(c[a+16>>2]|0)+4|0;a=c[j>>2]|0;if(!((c[e>>2]|0)>>>0<a>>>0)){i=h;return}c[e>>2]=a;i=h;return}function Sd(e,f,g,h,j,k){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;l=i;i=i+16|0;m=l;if((h|0)==0){n=0}else{o=c[e+16>>2]|0;do{if((h|0)<=0){if(!((h|0)<-1000999)){p=(c[e+8>>2]|0)+(h<<4)|0;break}if((h|0)==-1001e3){p=(c[e+12>>2]|0)+40|0;break}q=-1001e3-h|0;r=c[o>>2]|0;if((c[r+8>>2]|0)!=22?(s=c[r>>2]|0,(q|0)<=(d[s+6|0]|0)):0){p=s+(q+ -1<<4)+16|0}else{p=4320}}else{q=(c[o>>2]|0)+(h<<4)|0;p=q>>>0<(c[e+8>>2]|0)>>>0?q:4320}}while(0);n=p-(c[e+28>>2]|0)|0}p=e+8|0;h=(c[p>>2]|0)+(~f<<4)|0;c[m>>2]=h;if((k|0)!=0?(b[e+36>>1]|0)==0:0){f=c[e+16>>2]|0;c[f+28>>2]=k;c[f+24>>2]=j;c[f+20>>2]=(c[m>>2]|0)-(c[e+28>>2]|0);a[f+36|0]=a[e+41|0]|0;j=e+68|0;k=f+32|0;c[k>>2]=c[j>>2];c[j>>2]=n;o=f+18|0;a[o]=d[o]|16;Af(e,c[m>>2]|0,g,1);a[o]=a[o]&239;c[j>>2]=c[k>>2];t=0}else{c[m+4>>2]=g;t=Ff(e,2,m,h-(c[e+28>>2]|0)|0,n)|0}if(!((g|0)==-1)){i=l;return t|0}g=(c[e+16>>2]|0)+4|0;e=c[p>>2]|0;if(!((c[g>>2]|0)>>>0<e>>>0)){i=l;return t|0}c[g>>2]=e;i=l;return t|0}function Td(a,b){a=a|0;b=b|0;var d=0;d=i;Af(a,c[b>>2]|0,c[b+4>>2]|0,0);i=d;return}function Ud(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;i=i+32|0;j=h;$j(b,j,d,e);e=Gf(b,j,(f|0)==0?48:f,g)|0;if((e|0)!=0){i=h;return e|0}g=c[(c[b+8>>2]|0)+ -16>>2]|0;if((a[g+6|0]|0)!=1){i=h;return e|0}f=sj(c[(c[b+12>>2]|0)+40>>2]|0,2)|0;j=g+16|0;g=c[(c[j>>2]|0)+8>>2]|0;d=f;k=c[d+4>>2]|0;l=g;c[l>>2]=c[d>>2];c[l+4>>2]=k;k=f+8|0;c[g+8>>2]=c[k>>2];if((c[k>>2]&64|0)==0){i=h;return e|0}k=c[f>>2]|0;if((a[k+5|0]&3)==0){i=h;return e|0}f=c[j>>2]|0;if((a[f+5|0]&4)==0){i=h;return e|0}Uf(b,f,k);i=h;return e|0}function Vd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=c[a+8>>2]|0;if((c[f+ -8>>2]|0)!=70){g=1;i=e;return g|0}g=Jf(a,c[(c[f+ -16>>2]|0)+12>>2]|0,b,d,0)|0;i=e;return g|0}function Wd(a){a=a|0;return d[a+6|0]|0|0}function Xd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;h=c[b+12>>2]|0;a:do{switch(e|0){case 7:{j=h+164|0;k=c[j>>2]|0;c[j>>2]=f;l=k;break};case 11:{$f(b,0);l=0;break};case 1:{zi(h,0);a[h+63|0]=1;l=0;break};case 0:{a[h+63|0]=0;l=0;break};case 9:{l=d[h+63|0]|0;break};case 8:{k=h+160|0;j=c[k>>2]|0;c[k>>2]=f;l=j;break};case 6:{j=h+156|0;k=c[j>>2]|0;c[j>>2]=f;l=k;break};case 3:{l=((c[h+12>>2]|0)+(c[h+8>>2]|0)|0)>>>10;break};case 5:{if((a[h+62|0]|0)==2){k=(c[h+20>>2]|0)==0|0;eg(b);l=k;break a}k=(f<<10)+ -1600|0;if((a[h+63|0]|0)==0){m=k;zi(h,m);eg(b);n=h+61|0;o=a[n]|0;p=o<<24>>24==5;q=p&1;i=g;return q|0}m=(c[h+12>>2]|0)+k|0;zi(h,m);eg(b);n=h+61|0;o=a[n]|0;p=o<<24>>24==5;q=p&1;i=g;return q|0};case 4:{l=(c[h+12>>2]|0)+(c[h+8>>2]|0)&1023;break};case 10:{$f(b,2);l=0;break};case 2:{hg(b,0);l=0;break};default:{l=-1}}}while(0);i=g;return l|0}function Yd(a){a=a|0;rf(a);return 0}function Zd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=a+8|0;f=ij(a,c[g>>2]|0,(c[b>>2]|0)+ -16|0)|0;g=c[b>>2]|0;c[b>>2]=(f|0)==0?g+ -16|0:g+16|0;i=e;return f|0}function _d(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=i;if((b|0)>1){if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}Vj(a,b);i=e;return}else{if((b|0)!=0){i=e;return}b=a+8|0;f=c[b>>2]|0;g=Mi(a,56,0)|0;c[f>>2]=g;c[f+8>>2]=d[g+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;i=e;return}}function $d(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)!=22?(k=c[j>>2]|0,(h|0)<=(d[k+6|0]|0|0)):0){g=k+(h+ -1<<4)+16|0}else{g=4320}}else{h=(c[f>>2]|0)+(b<<4)|0;g=h>>>0<(c[a+8>>2]|0)>>>0?h:4320}}while(0);b=a+8|0;Wj(a,c[b>>2]|0,g);c[b>>2]=(c[b>>2]|0)+16;i=e;return}function ae(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){gg(a)}e=Oi(a,b,0)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=e;c[a+8>>2]=71;c[b>>2]=(c[b>>2]|0)+16;i=d;return e+24|0}function be(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;g=c[a+16>>2]|0;do{if((b|0)<=0){if(!((b|0)<-1000999)){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}j=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)!=22?(l=c[k>>2]|0,(j|0)<=(d[l+6|0]|0|0)):0){h=l+(j+ -1<<4)+16|0}else{h=4320}}else{j=(c[g>>2]|0)+(b<<4)|0;h=j>>>0<(c[a+8>>2]|0)>>>0?j:4320}}while(0);b=c[h+8>>2]&63;do{if((b|0)==6){g=c[h>>2]|0;j=c[g+12>>2]|0;if((e|0)<=0){m=0;i=f;return m|0}if((c[j+40>>2]|0)<(e|0)){m=0;i=f;return m|0}l=e+ -1|0;k=c[(c[g+16+(l<<2)>>2]|0)+8>>2]|0;g=c[(c[j+28>>2]|0)+(l<<3)>>2]|0;if((g|0)==0){n=56;o=k}else{n=g+16|0;o=k}}else if((b|0)==38){k=c[h>>2]|0;if((e|0)<=0){m=0;i=f;return m|0}if((d[k+6|0]|0|0)>=(e|0)){n=56;o=k+(e+ -1<<4)+16|0;break}else{m=0;i=f;return m|0}}else{m=0;i=f;return m|0}}while(0);e=a+8|0;a=c[e>>2]|0;h=o;b=c[h+4>>2]|0;k=a;c[k>>2]=c[h>>2];c[k+4>>2]=b;c[a+8>>2]=c[o+8>>2];c[e>>2]=(c[e>>2]|0)+16;m=n;i=f;return m|0}function ce(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;h=c[b+16>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){j=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){j=(c[b+12>>2]|0)+40|0;break}k=-1001e3-e|0;l=c[h>>2]|0;if((c[l+8>>2]|0)!=22?(m=c[l>>2]|0,(k|0)<=(d[m+6|0]|0|0)):0){j=m+(k+ -1<<4)+16|0}else{j=4320}}else{k=(c[h>>2]|0)+(e<<4)|0;j=k>>>0<(c[b+8>>2]|0)>>>0?k:4320}}while(0);e=c[j+8>>2]&63;do{if((e|0)==38){h=c[j>>2]|0;if((f|0)<=0){n=0;i=g;return n|0}if((d[h+6|0]|0|0)<(f|0)){n=0;i=g;return n|0}else{o=56;p=h+(f+ -1<<4)+16|0;q=h;break}}else if((e|0)==6){h=c[j>>2]|0;k=c[h+12>>2]|0;if((f|0)<=0){n=0;i=g;return n|0}if((c[k+40>>2]|0)<(f|0)){n=0;i=g;return n|0}m=f+ -1|0;l=c[h+16+(m<<2)>>2]|0;h=c[l+8>>2]|0;r=c[(c[k+28>>2]|0)+(m<<3)>>2]|0;if((r|0)==0){o=56;p=h;q=l}else{o=r+16|0;p=h;q=l}}else{n=0;i=g;return n|0}}while(0);f=b+8|0;j=c[f>>2]|0;e=j+ -16|0;c[f>>2]=e;l=e;e=c[l+4>>2]|0;h=p;c[h>>2]=c[l>>2];c[h+4>>2]=e;c[p+8>>2]=c[j+ -8>>2];j=c[f>>2]|0;if((c[j+8>>2]&64|0)==0){n=o;i=g;return n|0}f=c[j>>2]|0;if((a[f+5|0]&3)==0){n=o;i=g;return n|0}if((a[q+5|0]&4)==0){n=o;i=g;return n|0}Uf(b,q,f);n=o;i=g;return n|0}function de(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=c[a+16>>2]|0;h=(b|0)>0;do{if(!h){if(!((b|0)<-1000999)){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;l=c[g>>2]|0;if((c[l+8>>2]|0)!=22?(m=c[l>>2]|0,(k|0)<=(d[m+6|0]|0|0)):0){j=m+(k+ -1<<4)+16|0}else{j=4320}}else{k=(c[g>>2]|0)+(b<<4)|0;j=k>>>0<(c[a+8>>2]|0)>>>0?k:4320}}while(0);k=c[j+8>>2]&63;if((k|0)==6){do{if(!h){if(!((b|0)<-1000999)){n=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){n=(c[a+12>>2]|0)+40|0;break}m=-1001e3-b|0;l=c[g>>2]|0;if((c[l+8>>2]|0)!=22?(o=c[l>>2]|0,(m|0)<=(d[o+6|0]|0|0)):0){n=o+(m+ -1<<4)+16|0}else{n=4320}}else{m=(c[g>>2]|0)+(b<<4)|0;n=m>>>0<(c[a+8>>2]|0)>>>0?m:4320}}while(0);p=c[(c[n>>2]|0)+16+(e+ -1<<2)>>2]|0;i=f;return p|0}else if((k|0)==38){p=(c[j>>2]|0)+(e+ -1<<4)+16|0;i=f;return p|0}else{p=0;i=f;return p|0}return 0}function ee(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0;j=i;k=c[b+16>>2]|0;do{if((e|0)<=0){if(!((e|0)<-1000999)){l=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[b+12>>2]|0)+40|0;break}m=-1001e3-e|0;n=c[k>>2]|0;if((c[n+8>>2]|0)!=22?(o=c[n>>2]|0,(m|0)<=(d[o+6|0]|0|0)):0){l=o+(m+ -1<<4)+16|0}else{l=4320}}else{m=(c[k>>2]|0)+(e<<4)|0;l=m>>>0<(c[b+8>>2]|0)>>>0?m:4320}}while(0);e=c[l>>2]|0;l=e+16+(f+ -1<<2)|0;do{if((g|0)<=0){if(!((g|0)<-1000999)){p=(c[b+8>>2]|0)+(g<<4)|0;break}if((g|0)==-1001e3){p=(c[b+12>>2]|0)+40|0;break}f=-1001e3-g|0;m=c[k>>2]|0;if((c[m+8>>2]|0)!=22?(o=c[m>>2]|0,(f|0)<=(d[o+6|0]|0|0)):0){p=o+(f+ -1<<4)+16|0}else{p=4320}}else{f=(c[k>>2]|0)+(g<<4)|0;p=f>>>0<(c[b+8>>2]|0)>>>0?f:4320}}while(0);g=(c[p>>2]|0)+16+(h+ -1<<2)|0;c[l>>2]=c[g>>2];l=c[g>>2]|0;if((a[l+5|0]&3)==0){i=j;return}if((a[e+5|0]&4)==0){i=j;return}Uf(b,e,l);i=j;return}function fe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+208|0;h=g;j=g+100|0;k=Uc(b)|0;l=1;m=1;while(1){if((ff(d,l,h)|0)==0){break}else{n=l;l=l<<1;m=n}}if((m|0)<(l|0)){n=l;o=m;while(1){m=(n+o|0)/2|0;p=(ff(d,m,h)|0)==0;q=p?m:n;r=p?o:m+1|0;if((r|0)<(q|0)){n=q;o=r}else{s=q;break}}}else{s=l}l=(s+ -1|0)>22?12:0;if((e|0)!=0){c[h>>2]=e;wd(b,64,h)|0}td(b,72,16)|0;if((ff(d,f,j)|0)==0){t=Uc(b)|0;u=t-k|0;_d(b,u);i=g;return}e=s+ -11|0;s=j+36|0;o=j+20|0;n=j+8|0;q=j+12|0;r=j+24|0;m=j+35|0;p=j+4|0;v=f;while(1){f=v+1|0;if((f|0)==(l|0)){td(b,96,5)|0;w=e}else{kf(d,104,j)|0;c[h>>2]=s;wd(b,112,h)|0;x=c[o>>2]|0;if((x|0)>0){c[h>>2]=x;wd(b,120,h)|0}td(b,128,4)|0;do{if((a[c[n>>2]|0]|0)==0){x=a[c[q>>2]|0]|0;if(x<<24>>24==109){td(b,920,10)|0;break}else if(x<<24>>24==67){if((ie(b,j)|0)==0){td(b,232,1)|0;break}else{c[h>>2]=kd(b,-1,0)|0;wd(b,904,h)|0;Wc(b,-2);break}}else{x=c[r>>2]|0;c[h>>2]=s;c[h+4>>2]=x;wd(b,936,h)|0;break}}else{c[h>>2]=c[p>>2];wd(b,904,h)|0}}while(0);if((a[m]|0)!=0){td(b,136,20)|0}_d(b,(Uc(b)|0)-k|0);w=f}if((ff(d,w,j)|0)==0){break}else{v=w}}t=Uc(b)|0;u=t-k|0;_d(b,u);i=g;return}function ge(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+112|0;f=e;g=e+12|0;if((ff(a,0,g)|0)==0){c[f>>2]=b;c[f+4>>2]=d;h=he(a,160,f)|0;i=e;return h|0}kf(a,184,g)|0;if((Tm(c[g+8>>2]|0,192)|0)==0){j=b+ -1|0;if((j|0)==0){c[f>>2]=c[g+4>>2];c[f+4>>2]=d;h=he(a,200,f)|0;i=e;return h|0}else{k=j}}else{k=b}b=g+4|0;j=c[b>>2]|0;if((j|0)==0){if((ie(a,g)|0)==0){l=232}else{l=kd(a,-1,0)|0}c[b>>2]=l;m=l}else{m=j}c[f>>2]=k;c[f+4>>2]=m;c[f+8>>2]=d;h=he(a,240,f)|0;i=e;return h|0}function he(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+128|0;f=e;g=e+24|0;h=e+8|0;c[h>>2]=d;if((ff(a,1,g)|0)!=0?(kf(a,272,g)|0,d=c[g+20>>2]|0,(d|0)>0):0){c[f>>2]=g+36;c[f+4>>2]=d;wd(a,280,f)|0;vd(a,b,h)|0;_d(a,2);Yd(a)|0}td(a,288,0)|0;vd(a,b,h)|0;_d(a,2);Yd(a)|0;return 0}function ie(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;d=Uc(a)|0;kf(a,888,b)|0;Fd(a,-1001e3,2);b=d+1|0;if((af(a,b,2)|0)==0){Vc(a,d);e=0;i=c;return e|0}else{Zc(a,-1,b);Vc(a,-3);e=1;i=c;return e|0}return 0}function je(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+112|0;e=d;f=d+8|0;if((ff(a,b,f)|0)!=0?(kf(a,272,f)|0,b=c[f+20>>2]|0,(b|0)>0):0){c[e>>2]=f+36;c[e+4>>2]=b;wd(a,280,e)|0;i=d;return}td(a,288,0)|0;i=d;return}function ke(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e;g=c[(jc()|0)>>2]|0;if((b|0)!=0){yd(a,1);h=1;i=e;return h|0}pd(a);b=mc(g|0)|0;if((d|0)==0){ud(a,b)|0}else{c[f>>2]=d;c[f+4>>2]=b;wd(a,296,f)|0}rd(a,g);h=3;i=e;return h|0}function le(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;if((b|0)==-1){e=c[(jc()|0)>>2]|0;pd(a);ud(a,mc(e|0)|0)|0;rd(a,e);i=d;return 3}else if((b|0)==0){yd(a,1)}else{pd(a)}ud(a,304)|0;rd(a,b);i=d;return 3}function me(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;Dd(a,-1001e3,b);if(($c(a,-1)|0)!=0){d=0;i=c;return d|0}Vc(a,-2);Gd(a,0,0);_c(a,-1);Ld(a,-1001e3,b);d=1;i=c;return d|0}function ne(a,b){a=a|0;b=b|0;var c=0;c=i;Dd(a,-1001e3,b);Od(a,-2)|0;i=c;return}function oe(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;e=md(a,b)|0;if((e|0)!=0?(Hd(a,b)|0)!=0:0){Dd(a,-1001e3,c);c=(ed(a,-1,-2)|0)==0;Vc(a,-3);f=c?0:e}else{f=0}i=d;return f|0}function pe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e;g=md(a,b)|0;if(((g|0)!=0?(Hd(a,b)|0)!=0:0)?(Dd(a,-1001e3,d),h=(ed(a,-1,-2)|0)==0,j=h?0:g,Vc(a,-3),(j|0)!=0):0){k=j;i=e;return k|0}j=ad(a,$c(a,b)|0)|0;c[f>>2]=d;c[f+4>>2]=j;ge(a,b,wd(a,864,f)|0)|0;k=0;i=e;return k|0}function qe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f;if((d|0)==0){h=kd(a,b,0)|0;if((h|0)==0){j=ad(a,4)|0;k=ad(a,$c(a,b)|0)|0;c[g>>2]=j;c[g+4>>2]=k;ge(a,b,wd(a,864,g)|0)|0;l=0}else{l=h}}else{l=re(a,b,d,0)|0}d=c[e>>2]|0;a:do{if((d|0)!=0){h=d;k=0;while(1){j=k;k=k+1|0;if((Tm(h,l)|0)==0){m=j;break}h=c[e+(k<<2)>>2]|0;if((h|0)==0){break a}}i=f;return m|0}}while(0);c[g>>2]=l;m=ge(a,b,wd(a,312,g)|0)|0;i=f;return m|0}function re(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+16|0;g=f;if(($c(a,b)|0)>=1){h=kd(a,b,e)|0;if((h|0)!=0){j=h;i=f;return j|0}h=ad(a,4)|0;k=ad(a,$c(a,b)|0)|0;c[g>>2]=h;c[g+4>>2]=k;ge(a,b,wd(a,864,g)|0)|0;j=0;i=f;return j|0}if((e|0)==0){j=d;i=f;return j|0}if((d|0)==0){l=0}else{l=Zm(d|0)|0}c[e>>2]=l;j=d;i=f;return j|0}function se(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e;g=kd(a,b,d)|0;if((g|0)!=0){i=e;return g|0}d=ad(a,4)|0;h=ad(a,$c(a,b)|0)|0;c[f>>2]=d;c[f+4>>2]=h;ge(a,b,wd(a,864,f)|0)|0;i=e;return g|0}function te(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;if((Oc(a,b+20|0)|0)!=0){i=e;return}if((d|0)==0){he(a,360,f)|0;i=e;return}else{c[f>>2]=d;he(a,336,f)|0;i=e;return}}function ue(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e;if(($c(a,b)|0)==(d|0)){i=e;return}g=ad(a,d)|0;d=ad(a,$c(a,b)|0)|0;c[f>>2]=g;c[f+4>>2]=d;ge(a,b,wd(a,864,f)|0)|0;i=e;return}function ve(a,b){a=a|0;b=b|0;var c=0;c=i;if(($c(a,b)|0)==-1){ge(a,b,376)|0}i=c;return}function we(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0.0,h=0;d=i;i=i+16|0;e=d;f=d+8|0;g=+gd(a,b,f);if((c[f>>2]|0)!=0){i=d;return+g}f=ad(a,3)|0;h=ad(a,$c(a,b)|0)|0;c[e>>2]=f;c[e+4>>2]=h;ge(a,b,wd(a,864,e)|0)|0;i=d;return+g}function xe(a,b,c){a=a|0;b=b|0;c=+c;var d=0,e=0.0;d=i;if(($c(a,b)|0)<1){e=c}else{e=+we(a,b)}i=d;return+e}function ye(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d;f=d+8|0;g=hd(a,b,f)|0;if((c[f>>2]|0)!=0){i=d;return g|0}f=ad(a,3)|0;h=ad(a,$c(a,b)|0)|0;c[e>>2]=f;c[e+4>>2]=h;ge(a,b,wd(a,864,e)|0)|0;i=d;return g|0}function ze(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d;f=d+8|0;g=id(a,b,f)|0;if((c[f>>2]|0)!=0){i=d;return g|0}f=ad(a,3)|0;h=ad(a,$c(a,b)|0)|0;c[e>>2]=f;c[e+4>>2]=h;ge(a,b,wd(a,864,e)|0)|0;i=d;return g|0}function Ae(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;if(($c(a,b)|0)<1){e=c}else{e=ye(a,b)|0}i=d;return e|0}function Be(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;e=c[a+12>>2]|0;f=a+4|0;g=c[f>>2]|0;h=a+8|0;j=c[h>>2]|0;if(!((g-j|0)>>>0<b>>>0)){k=c[a>>2]|0;l=j;m=k+l|0;i=d;return m|0}n=g<<1;g=(n-j|0)>>>0<b>>>0?j+b|0:n;if(g>>>0<j>>>0|(g-j|0)>>>0<b>>>0){he(e,392,d)|0}b=ae(e,g)|0;an(b|0,c[a>>2]|0,c[h>>2]|0)|0;if((c[a>>2]|0)!=(a+16|0)){Wc(e,-2)}c[a>>2]=b;c[f>>2]=g;k=b;l=c[h>>2]|0;m=k+l|0;i=d;return m|0}function Ce(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+16|0;f=c[a+12>>2]|0;g=a+4|0;h=c[g>>2]|0;j=a+8|0;k=c[j>>2]|0;if(!((h-k|0)>>>0<d>>>0)){l=c[a>>2]|0;m=k;n=l+m|0;an(n|0,b|0,d|0)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}q=h<<1;h=(q-k|0)>>>0<d>>>0?k+d|0:q;if(h>>>0<k>>>0|(h-k|0)>>>0<d>>>0){he(f,392,e)|0}k=ae(f,h)|0;an(k|0,c[a>>2]|0,c[j>>2]|0)|0;if((c[a>>2]|0)!=(a+16|0)){Wc(f,-2)}c[a>>2]=k;c[g>>2]=h;l=k;m=c[j>>2]|0;n=l+m|0;an(n|0,b|0,d|0)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}function De(a,b){a=a|0;b=b|0;var c=0;c=i;Ce(a,b,Zm(b|0)|0);i=c;return}function Ee(a){a=a|0;var b=0,d=0;b=i;d=c[a+12>>2]|0;td(d,c[a>>2]|0,c[a+8>>2]|0)|0;if((c[a>>2]|0)==(a+16|0)){i=b;return}Wc(d,-2);i=b;return}function Fe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a+8|0;f=(c[e>>2]|0)+b|0;c[e>>2]=f;e=c[a+12>>2]|0;td(e,c[a>>2]|0,f)|0;if((c[a>>2]|0)==(a+16|0)){i=d;return}Wc(e,-2);i=d;return}function Ge(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;d=b;e=c[a+12>>2]|0;f=kd(e,-1,d)|0;g=a+16|0;if((c[a>>2]|0)!=(g|0)){Xc(e,-2)}Ce(a,f,c[d>>2]|0);Wc(e,(c[a>>2]|0)!=(g|0)?-2:-1);i=b;return}function He(a,b){a=a|0;b=b|0;c[b+12>>2]=a;c[b>>2]=b+16;c[b+8>>2]=0;c[b+4>>2]=1024;return}function Ie(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;c[b+12>>2]=a;f=b+16|0;c[b>>2]=f;g=b+8|0;c[g>>2]=0;h=b+4|0;c[h>>2]=1024;if(!(d>>>0>1024)){j=f;k=0;l=j+k|0;i=e;return l|0}m=d>>>0>2048?d:2048;d=ae(a,m)|0;an(d|0,c[b>>2]|0,c[g>>2]|0)|0;if((c[b>>2]|0)!=(f|0)){Wc(a,-2)}c[b>>2]=d;c[h>>2]=m;j=d;k=c[g>>2]|0;l=j+k|0;i=e;return l|0}function Je(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,r=0;f=i;i=i+1056|0;g=f;h=f+16|0;j=f+12|0;k=(Uc(b)|0)+1|0;l=(d|0)==0;if(!l){c[g>>2]=d;wd(b,424,g)|0;m=Tb(d|0,432)|0;c[h+4>>2]=m;if((m|0)==0){m=mc(c[(jc()|0)>>2]|0)|0;n=(kd(b,k,0)|0)+1|0;c[g>>2]=440;c[g+4>>2]=n;c[g+8>>2]=m;wd(b,840,g)|0;Wc(b,k);o=7;i=f;return o|0}}else{td(b,416,6)|0;c[h+4>>2]=c[q>>2]}if((Ke(h,j)|0)!=0){m=c[h>>2]|0;c[h>>2]=m+1;a[h+m+8|0]=10}m=c[j>>2]|0;do{if((m|0)!=27|l){p=m}else{n=h+4|0;r=qb(d|0,448,c[n>>2]|0)|0;c[n>>2]=r;if((r|0)!=0){Ke(h,j)|0;p=c[j>>2]|0;break}r=mc(c[(jc()|0)>>2]|0)|0;n=(kd(b,k,0)|0)+1|0;c[g>>2]=456;c[g+4>>2]=n;c[g+8>>2]=r;wd(b,840,g)|0;Wc(b,k);o=7;i=f;return o|0}}while(0);if(!((p|0)==-1)){j=c[h>>2]|0;c[h>>2]=j+1;a[h+j+8|0]=p}p=Ud(b,1,h,kd(b,-1,0)|0,e)|0;e=c[h+4>>2]|0;h=Da(e|0)|0;if(!l){Jb(e|0)|0}if((h|0)==0){Wc(b,k);o=p;i=f;return o|0}else{Vc(b,k);p=mc(c[(jc()|0)>>2]|0)|0;h=(kd(b,k,0)|0)+1|0;c[g>>2]=464;c[g+4>>2]=h;c[g+8>>2]=p;wd(b,840,g)|0;Wc(b,k);o=7;i=f;return o|0}return 0}function Ke(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;c[b>>2]=0;g=b+4|0;h=832;while(1){j=sb(c[g>>2]|0)|0;if((j|0)==-1){k=3;break}l=h+1|0;if((j|0)!=(d[h]|0)){m=j;break}n=c[b>>2]|0;c[b>>2]=n+1;a[b+n+8|0]=j;if((a[l]|0)==0){k=6;break}else{h=l}}if((k|0)==3){c[e>>2]=-1;o=0;i=f;return o|0}else if((k|0)==6){c[b>>2]=0;m=sb(c[g>>2]|0)|0}c[e>>2]=m;if((m|0)!=35){o=0;i=f;return o|0}do{m=sb(c[g>>2]|0)|0}while(!((m|0)==10|(m|0)==-1));c[e>>2]=sb(c[g>>2]|0)|0;o=1;i=f;return o|0}function Le(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;a=i;e=c[b>>2]|0;if((e|0)>0){c[d>>2]=e;c[b>>2]=0;f=b+8|0;i=a;return f|0}e=b+4|0;if((ic(c[e>>2]|0)|0)!=0){f=0;i=a;return f|0}g=b+8|0;c[d>>2]=sa(g|0,1,1024,c[e>>2]|0)|0;f=g;i=a;return f|0}function Me(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+16|0;h=g;c[h>>2]=b;c[h+4>>2]=d;d=Ud(a,2,h,e,f)|0;i=g;return d|0}function Ne(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;a=i;e=b+4|0;f=c[e>>2]|0;if((f|0)==0){g=0;i=a;return g|0}c[d>>2]=f;c[e>>2]=0;g=c[b>>2]|0;i=a;return g|0}function Oe(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;do{if((Hd(a,b)|0)!=0){ud(a,c)|0;Ed(a,-2);if(($c(a,-1)|0)==0){Vc(a,-3);e=0;break}else{Wc(a,-2);e=1;break}}else{e=0}}while(0);i=d;return e|0}function Pe(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;e=Tc(a,b)|0;if((Hd(a,e)|0)==0){f=0;i=d;return f|0}ud(a,c)|0;Ed(a,-2);if(($c(a,-1)|0)==0){Vc(a,-3);f=0;i=d;return f|0}else{Wc(a,-2);_c(a,e);Rd(a,1,1,0,0);f=1;i=d;return f|0}return 0}function Qe(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+16|0;e=d+4|0;$d(a,b);b=hd(a,-1,e)|0;if((c[e>>2]|0)==0){he(a,472,d)|0}Vc(a,-2);i=d;return b|0}function Re(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e;do{if((Pe(a,b,504)|0)==0){g=$c(a,b)|0;if((g|0)==0){td(a,536,3)|0;break}else if((g|0)==4|(g|0)==3){_c(a,b);break}else if((g|0)==1){g=(jd(a,b)|0)!=0;ud(a,g?520:528)|0;break}else{g=ad(a,$c(a,b)|0)|0;h=od(a,b)|0;c[f>>2]=g;c[f+4>>2]=h;wd(a,544,f)|0;break}}}while(0);f=kd(a,-1,d)|0;i=e;return f|0}function Se(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;Te(a,-1001e3,552,1)|0;Dd(a,-1,b);if(($c(a,-1)|0)==5){Wc(a,-2);i=e;return}Vc(a,-2);Fd(a,-1001e3,2);if((Te(a,0,b,d)|0)!=0){c[f>>2]=b;he(a,560,f)|0}_c(a,-1);Ld(a,-3,b);Wc(a,-2);i=e;return}function Te(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;if((c|0)==0){g=d}else{_c(b,c);g=d}while(1){d=xm(g,46)|0;if((d|0)==0){h=g+(Zm(g|0)|0)|0}else{h=d}d=h-g|0;td(b,g,d)|0;Ed(b,-2);if(($c(b,-1)|0)!=0){if(($c(b,-1)|0)!=5){break}}else{Vc(b,-2);Gd(b,0,(a[h]|0)==46?1:e);td(b,g,d)|0;_c(b,-2);Kd(b,-4)}Wc(b,-2);if((a[h]|0)==46){g=h+1|0}else{j=0;k=10;break}}if((k|0)==10){i=f;return j|0}Vc(b,-3);j=g;i=f;return j|0}function Ue(a,b){a=a|0;b=+b;var d=0,e=0,f=0,g=0.0;d=i;i=i+16|0;e=d;f=Sc(a)|0;if((f|0)==(Sc(0)|0)){g=+h[f>>3];if(g!=b){h[k>>3]=b;c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];f=e+8|0;h[k>>3]=g;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];he(a,648,e)|0}}else{he(a,616,e)|0}qd(a,-4660.0);if((hd(a,-1,0)|0)==-4660?(id(a,-1,0)|0)==-4660:0){Vc(a,-2);i=d;return}he(a,704,e)|0;Vc(a,-2);i=d;return}function Ve(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e;Ue(a,502.0);if((Oc(a,d+20|0)|0)==0){c[f>>2]=592;he(a,336,f)|0}if((c[b>>2]|0)==0){g=~d;Vc(a,g);i=e;return}f=-2-d|0;h=0-d|0;if((d|0)>0){j=b}else{k=b;do{xd(a,c[k+4>>2]|0,d);Ld(a,f,c[k>>2]|0);k=k+8|0}while((c[k>>2]|0)!=0);g=~d;Vc(a,g);i=e;return}do{k=0;do{_c(a,h);k=k+1|0}while((k|0)!=(d|0));xd(a,c[j+4>>2]|0,d);Ld(a,f,c[j>>2]|0);j=j+8|0}while((c[j>>2]|0)!=0);g=~d;Vc(a,g);i=e;return}function We(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;Dd(a,b,c);if(($c(a,-1)|0)==5){e=1;i=d;return e|0}Vc(a,-2);f=Tc(a,b)|0;Gd(a,0,0);_c(a,-1);Ld(a,f,c);e=0;i=d;return e|0}function Xe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=i;xd(a,c,0);ud(a,b)|0;Rd(a,1,1,0,0);We(a,-1001e3,552)|0;_c(a,-2);Ld(a,-2,b);Vc(a,-2);if((d|0)==0){i=e;return}_c(a,-1);Jd(a,b);i=e;return}function Ye(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+1056|0;g=f;h=f+8|0;j=Zm(d|0)|0;k=h+12|0;c[k>>2]=a;l=h+16|0;c[h>>2]=l;m=h+8|0;c[m>>2]=0;n=h+4|0;c[n>>2]=1024;o=Dm(b,d)|0;if((o|0)==0){p=b;q=0;r=1024;s=a}else{t=b;b=0;u=1024;v=a;w=o;while(1){o=w-t|0;if((u-b|0)>>>0<o>>>0){x=u<<1;y=(x-b|0)>>>0<o>>>0?b+o|0:x;if(y>>>0<b>>>0|(y-b|0)>>>0<o>>>0){he(v,392,g)|0}x=ae(v,y)|0;an(x|0,c[h>>2]|0,c[m>>2]|0)|0;if((c[h>>2]|0)!=(l|0)){Wc(v,-2)}c[h>>2]=x;c[n>>2]=y;z=x;A=c[m>>2]|0}else{z=c[h>>2]|0;A=b}an(z+A|0,t|0,o|0)|0;x=(c[m>>2]|0)+o|0;c[m>>2]=x;o=Zm(e|0)|0;y=c[k>>2]|0;B=c[n>>2]|0;if((B-x|0)>>>0<o>>>0){C=B<<1;B=(C-x|0)>>>0<o>>>0?x+o|0:C;if(B>>>0<x>>>0|(B-x|0)>>>0<o>>>0){he(y,392,g)|0}C=ae(y,B)|0;an(C|0,c[h>>2]|0,c[m>>2]|0)|0;if((c[h>>2]|0)!=(l|0)){Wc(y,-2)}c[h>>2]=C;c[n>>2]=B;D=C;E=c[m>>2]|0}else{D=c[h>>2]|0;E=x}an(D+E|0,e|0,o|0)|0;x=(c[m>>2]|0)+o|0;c[m>>2]=x;o=w+j|0;C=Dm(o,d)|0;B=c[k>>2]|0;y=c[n>>2]|0;if((C|0)==0){p=o;q=x;r=y;s=B;break}else{t=o;b=x;u=y;v=B;w=C}}}w=Zm(p|0)|0;if((r-q|0)>>>0<w>>>0){v=r<<1;r=(v-q|0)>>>0<w>>>0?q+w|0:v;if(r>>>0<q>>>0|(r-q|0)>>>0<w>>>0){he(s,392,g)|0}g=ae(s,r)|0;an(g|0,c[h>>2]|0,c[m>>2]|0)|0;if((c[h>>2]|0)!=(l|0)){Wc(s,-2)}c[h>>2]=g;c[n>>2]=r;F=g;G=c[m>>2]|0}else{F=c[h>>2]|0;G=q}an(F+G|0,p|0,w|0)|0;p=(c[m>>2]|0)+w|0;c[m>>2]=p;m=c[k>>2]|0;td(m,c[h>>2]|0,p)|0;if((c[h>>2]|0)==(l|0)){H=kd(a,-1,0)|0;i=f;return H|0}Wc(m,-2);H=kd(a,-1,0)|0;i=f;return H|0}function Ze(){var a=0,b=0;a=i;b=Ei(1,0)|0;if((b|0)!=0){Rc(b,143)|0}i=a;return b|0}function _e(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;c=i;if((d|0)==0){Fm(b);e=0}else{e=Gm(b,d)|0}i=c;return e|0}function $e(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;e=c[p>>2]|0;c[d>>2]=kd(a,-1,0)|0;ob(e|0,776,d|0)|0;_b(e|0)|0;i=b;return 0}function af(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=i;a:do{if(((c|0)!=0?($c(a,-1)|0)==5:0)?(pd(a),(Zd(a,-2)|0)!=0):0){e=c+ -1|0;while(1){if(($c(a,-2)|0)==4){if((ed(a,b,-1)|0)!=0){f=7;break}if((af(a,b,e)|0)!=0){f=9;break}}Vc(a,-2);if((Zd(a,-2)|0)==0){g=0;break a}}if((f|0)==7){Vc(a,-2);g=1;break}else if((f|0)==9){Wc(a,-2);td(a,896,1)|0;Xc(a,-2);_d(a,3);g=1;break}}else{g=0}}while(0);i=d;return g|0}function bf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=(d|0)==0|(e|0)==0;h=c[b+16>>2]|0;if(!((a[h+18|0]&1)==0)){c[b+20>>2]=c[h+28>>2]}c[b+52>>2]=g?0:d;c[b+44>>2]=f;c[b+48>>2]=f;a[b+40|0]=g?0:e&255;return 1}function cf(a){a=a|0;return c[a+52>>2]|0}function df(a){a=a|0;return d[a+40|0]|0|0}function ef(a){a=a|0;return c[a+44>>2]|0}function ff(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;a:do{if((b|0)>=0){f=c[a+16>>2]|0;if((b|0)>0){g=a+72|0;h=b;j=f;do{if((j|0)==(g|0)){k=0;break a}h=h+ -1|0;j=c[j+8>>2]|0}while((h|0)>0);if((h|0)==0){l=j}else{k=0;break}}else{l=f}if((l|0)!=(a+72|0)){c[d+96>>2]=l;k=1}else{k=0}}else{k=0}}while(0);i=e;return k|0}function gf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e;if((b|0)==0){g=c[a+8>>2]|0;if((c[g+ -8>>2]|0)!=70){h=0;i=e;return h|0}h=Tf(c[(c[g+ -16>>2]|0)+12>>2]|0,d,0)|0;i=e;return h|0}else{c[f>>2]=0;g=hf(a,c[b+96>>2]|0,d,f)|0;if((g|0)==0){h=0;i=e;return h|0}d=c[f>>2]|0;f=a+8|0;a=c[f>>2]|0;b=d;j=c[b+4>>2]|0;k=a;c[k>>2]=c[b>>2];c[k+4>>2]=j;c[a+8>>2]=c[d+8>>2];c[f>>2]=(c[f>>2]|0)+16;h=g;i=e;return h|0}return 0}function hf(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;do{if((a[e+18|0]&1)==0){j=(c[e>>2]|0)+16|0;k=7}else{if((f|0)>=0){l=c[e+24>>2]|0;m=c[(c[c[e>>2]>>2]|0)+12>>2]|0;n=Tf(m,f,((c[e+28>>2]|0)-(c[m+12>>2]|0)>>2)+ -1|0)|0;if((n|0)==0){j=l;k=7;break}else{o=l;p=n;break}}n=c[e>>2]|0;l=d[(c[(c[n>>2]|0)+12>>2]|0)+76|0]|0;if((((c[e+24>>2]|0)-n>>4)-l|0)<=(0-f|0)){q=0;i=h;return q|0}c[g>>2]=n+(l-f<<4);q=1328;i=h;return q|0}}while(0);if((k|0)==7){if((c[b+16>>2]|0)==(e|0)){r=b+8|0}else{r=c[e+12>>2]|0}if(((c[r>>2]|0)-j>>4|0)>=(f|0)&(f|0)>0){o=j;p=1312}else{q=0;i=h;return q|0}}c[g>>2]=o+(f+ -1<<4);q=p;i=h;return q|0}function jf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;f=e;c[f>>2]=0;g=hf(a,c[b+96>>2]|0,d,f)|0;d=a+8|0;if((g|0)==0){h=c[d>>2]|0;j=h+ -16|0;c[d>>2]=j;i=e;return g|0}a=c[d>>2]|0;b=c[f>>2]|0;f=a+ -16|0;k=c[f+4>>2]|0;l=b;c[l>>2]=c[f>>2];c[l+4>>2]=k;c[b+8>>2]=c[a+ -8>>2];h=c[d>>2]|0;j=h+ -16|0;c[d>>2]=j;i=e;return g|0}function kf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;g=i;i=i+16|0;h=g;if((a[e]|0)==62){j=b+8|0;k=(c[j>>2]|0)+ -16|0;c[j>>2]=k;l=e+1|0;m=0;n=k}else{k=c[f+96>>2]|0;l=e;m=k;n=c[k>>2]|0}k=n+8|0;if((c[k>>2]&31|0)==6){o=c[n>>2]|0}else{o=0}e=a[l]|0;a:do{if(e<<24>>24==0){p=1}else{j=(o|0)==0;q=f+16|0;r=f+24|0;s=f+28|0;t=f+12|0;u=f+36|0;v=o+4|0;w=o+12|0;x=(m|0)==0;y=f+20|0;z=m+18|0;A=m+28|0;B=f+32|0;C=f+34|0;D=f+33|0;E=o+6|0;F=f+35|0;G=f+8|0;H=f+4|0;I=m+8|0;J=b+12|0;K=l;L=e;M=1;while(1){b:do{switch(L<<24>>24|0){case 116:{if(x){N=0}else{N=d[z]&64}a[F]=N;O=M;break};case 110:{c:do{if((!x?(a[z]&64)==0:0)?(P=c[I>>2]|0,!((a[P+18|0]&1)==0)):0){Q=c[(c[c[P>>2]>>2]|0)+12>>2]|0;R=c[Q+12>>2]|0;S=((c[P+28>>2]|0)-R>>2)+ -1|0;P=c[R+(S<<2)>>2]|0;do{switch(P&63|0){case 10:case 8:{T=1;U=46;break};case 24:{T=5;U=46;break};case 13:{T=6;U=46;break};case 14:{T=7;U=46;break};case 15:{T=8;U=46;break};case 16:{T=9;U=46;break};case 17:{T=10;U=46;break};case 18:{T=11;U=46;break};case 19:{T=12;U=46;break};case 21:{T=4;U=46;break};case 25:{T=13;U=46;break};case 26:{T=14;U=46;break};case 22:{T=15;U=46;break};case 30:case 29:{R=mf(Q,S,P>>>6&255,H)|0;c[G>>2]=R;if((R|0)==0){break c}else{O=M;break b}break};case 7:case 6:case 12:{T=0;U=46;break};case 34:{V=1240;W=1240;break};default:{U=47;break c}}}while(0);if((U|0)==46){U=0;V=(c[(c[J>>2]|0)+(T<<2)+184>>2]|0)+16|0;W=1256}c[H>>2]=V;c[G>>2]=W;O=M;break b}else{U=47}}while(0);if((U|0)==47){U=0;c[G>>2]=0}c[G>>2]=1232;c[H>>2]=0;O=M;break};case 108:{if(!x?!((a[z]&1)==0):0){P=c[(c[c[m>>2]>>2]|0)+12>>2]|0;S=c[P+20>>2]|0;if((S|0)==0){X=0}else{X=c[S+(((c[A>>2]|0)-(c[P+12>>2]|0)>>2)+ -1<<2)>>2]|0}}else{X=-1}c[y>>2]=X;O=M;break};case 117:{if(!j){a[B]=a[E]|0;if((a[v]|0)!=38){a[C]=a[(c[w>>2]|0)+77|0]|0;a[D]=a[(c[w>>2]|0)+76|0]|0;O=M;break b}}else{a[B]=0}a[C]=1;a[D]=0;O=M;break};case 83:{if(!j?(a[v]|0)!=38:0){P=c[w>>2]|0;S=c[P+36>>2]|0;if((S|0)==0){Y=1288}else{Y=S+16|0}c[q>>2]=Y;S=c[P+64>>2]|0;c[r>>2]=S;c[s>>2]=c[P+68>>2];Z=Y;_=(S|0)==0?1296:1304}else{c[q>>2]=1272;c[r>>2]=-1;c[s>>2]=-1;Z=1272;_=1280}c[t>>2]=_;Sh(u,Z,60);O=M;break};case 102:case 76:{O=M;break};default:{O=0}}}while(0);S=K+1|0;P=a[S]|0;if(P<<24>>24==0){p=O;break a}else{K=S;L=P;M=O}}}}while(0);if((xm(l,102)|0)!=0){O=b+8|0;Z=c[O>>2]|0;_=n;n=c[_+4>>2]|0;Y=Z;c[Y>>2]=c[_>>2];c[Y+4>>2]=n;c[Z+8>>2]=c[k>>2];c[O>>2]=(c[O>>2]|0)+16}if((xm(l,76)|0)==0){i=g;return p|0}if((o|0)!=0?(a[o+4|0]|0)!=38:0){l=o+12|0;o=c[(c[l>>2]|0)+20>>2]|0;O=oj(b)|0;k=b+8|0;Z=c[k>>2]|0;c[Z>>2]=O;c[Z+8>>2]=69;c[k>>2]=(c[k>>2]|0)+16;c[h>>2]=1;c[h+8>>2]=1;if((c[(c[l>>2]|0)+52>>2]|0)>0){$=0}else{i=g;return p|0}do{lj(b,O,c[o+($<<2)>>2]|0,h);$=$+1|0}while(($|0)<(c[(c[l>>2]|0)+52>>2]|0));i=g;return p|0}l=b+8|0;b=c[l>>2]|0;c[b+8>>2]=0;c[l>>2]=b+16;i=g;return p|0}function lf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+32|0;g=f;h=f+16|0;f=c[b+16>>2]|0;c[h>>2]=0;j=c[7656+((c[d+8>>2]&15)+1<<2)>>2]|0;a:do{if(!((a[f+18|0]&1)==0)){k=c[c[f>>2]>>2]|0;l=a[k+6|0]|0;b:do{if(!(l<<24>>24==0)){m=k+16|0;n=l&255;o=0;while(1){p=o+1|0;if((c[(c[m+(o<<2)>>2]|0)+8>>2]|0)==(d|0)){break}if((p|0)<(n|0)){o=p}else{break b}}n=c[(c[(c[k+12>>2]|0)+28>>2]|0)+(o<<3)>>2]|0;if((n|0)==0){q=1224}else{q=n+16|0}c[h>>2]=q;r=q;s=1192;c[g>>2]=e;t=g+4|0;c[t>>2]=s;u=g+8|0;c[u>>2]=r;v=g+12|0;c[v>>2]=j;nf(b,960,g)}}while(0);l=c[f+24>>2]|0;n=c[f+4>>2]|0;if(l>>>0<n>>>0){m=l;while(1){p=m;m=m+16|0;if((p|0)==(d|0)){break}if(!(m>>>0<n>>>0)){break a}}n=c[k+12>>2]|0;m=mf(n,((c[f+28>>2]|0)-(c[n+12>>2]|0)>>2)+ -1|0,d-l>>4,h)|0;if((m|0)!=0){r=c[h>>2]|0;s=m;c[g>>2]=e;t=g+4|0;c[t>>2]=s;u=g+8|0;c[u>>2]=r;v=g+12|0;c[v>>2]=j;nf(b,960,g)}}}}while(0);c[g>>2]=e;c[g+4>>2]=j;nf(b,1e3,g)}function mf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=b+12|0;j=d;d=e;a:while(1){e=Tf(b,d+1|0,j)|0;c[f>>2]=e;if((e|0)!=0){k=1160;l=42;break}if((j|0)<=0){k=0;l=42;break}m=c[h>>2]|0;e=0;n=-1;while(1){o=c[m+(e<<2)>>2]|0;p=o&63;q=o>>>6&255;switch(p|0){case 27:{r=e;s=(q|0)==(d|0)?e:n;break};case 4:{if((q|0)>(d|0)){r=e;s=n}else{r=e;s=(q+(o>>>23)|0)<(d|0)?n:e}break};case 23:{t=(o>>>14)+ -131071|0;o=e+1+t|0;r=((e|0)>=(o|0)|(o|0)>(j|0)?0:t)+e|0;s=n;break};case 34:{r=e;s=(q+2|0)>(d|0)?n:e;break};case 30:case 29:{r=e;s=(q|0)>(d|0)?n:e;break};default:{r=e;s=(a[4712+p|0]&64)!=0&(q|0)==(d|0)?e:n}}e=r+1|0;if((e|0)>=(j|0)){break}else{n=s}}if((s|0)==-1){k=0;l=42;break}u=c[m+(s<<2)>>2]|0;v=u&63;switch(v|0){case 0:{break};case 7:case 6:{l=17;break a;break};case 1:{l=32;break a;break};case 2:{l=33;break a;break};case 12:{l=36;break a;break};case 5:{l=29;break a;break};default:{k=0;l=42;break a}}n=u>>>23;if(n>>>0<(u>>>6&255)>>>0){j=s;d=n}else{k=0;l=42;break}}if((l|0)==17){d=u>>>14;j=d&511;r=u>>>23;if((v|0)!=7){v=c[(c[b+28>>2]|0)+(r<<3)>>2]|0;if((v|0)==0){w=1224}else{w=v+16|0}}else{w=Tf(b,r+1|0,s)|0}if((d&256|0)==0){r=mf(b,s,j,f)|0;if(!((r|0)!=0?(a[r]|0)==99:0)){l=26}}else{r=d&255;d=c[b+8>>2]|0;if((c[d+(r<<4)+8>>2]&15|0)==4){c[f>>2]=(c[d+(r<<4)>>2]|0)+16}else{l=26}}if((l|0)==26){c[f>>2]=1224}if((w|0)==0){k=1184;i=g;return k|0}r=(Tm(w,1168)|0)==0;k=r?1176:1184;i=g;return k|0}else if((l|0)==29){r=c[(c[b+28>>2]|0)+(u>>>23<<3)>>2]|0;if((r|0)==0){x=1224}else{x=r+16|0}c[f>>2]=x;k=1192;i=g;return k|0}else if((l|0)==32){y=u>>>14}else if((l|0)==33){y=(c[m+(s+1<<2)>>2]|0)>>>6}else if((l|0)==36){m=u>>>14;if((m&256|0)==0){u=mf(b,s,m&511,f)|0;if((u|0)!=0?(a[u]|0)==99:0){k=1216;i=g;return k|0}}else{u=m&255;m=c[b+8>>2]|0;if((c[m+(u<<4)+8>>2]&15|0)==4){c[f>>2]=(c[m+(u<<4)>>2]|0)+16;k=1216;i=g;return k|0}}c[f>>2]=1224;k=1216;i=g;return k|0}else if((l|0)==42){i=g;return k|0}l=c[b+8>>2]|0;if((c[l+(y<<4)+8>>2]&15|0)!=4){k=0;i=g;return k|0}c[f>>2]=(c[l+(y<<4)>>2]|0)+16;k=1200;i=g;return k|0}function nf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+96|0;g=f;h=f+32|0;j=f+16|0;c[j>>2]=e;e=Qh(b,d,j)|0;j=c[b+16>>2]|0;if((a[j+18|0]&1)==0){rf(b)}d=c[(c[c[j>>2]>>2]|0)+12>>2]|0;f=c[d+20>>2]|0;if((f|0)==0){k=0}else{k=c[f+(((c[j+28>>2]|0)-(c[d+12>>2]|0)>>2)+ -1<<2)>>2]|0}j=c[d+36>>2]|0;if((j|0)==0){a[h]=63;a[h+1|0]=0}else{Sh(h,j+16|0,60)}c[g>>2]=h;c[g+4>>2]=k;c[g+8>>2]=e;Rh(b,1144,g)|0;rf(b)}function of(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=c[b+8>>2]|0;lf(a,(e&15|0)==4|(e|0)==3?d:b,1032)}function pf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=(Nj(b,d)|0)==0;lf(a,e?b:c,1048)}function qf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;e=c[7656+((c[b+8>>2]&15)+1<<2)>>2]|0;b=c[7656+((c[d+8>>2]&15)+1<<2)>>2]|0;if((e|0)==(b|0)){c[f>>2]=e;nf(a,1072,f)}else{c[f>>2]=e;c[f+4>>2]=b;nf(a,1112,f)}}function rf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=c[a+68>>2]|0;if((b|0)==0){sf(a,2)}d=c[a+28>>2]|0;e=d+(b+8)|0;if((c[e>>2]&15|0)!=6){sf(a,6)}f=a+8|0;g=c[f>>2]|0;h=g+ -16|0;i=c[h+4>>2]|0;j=g;c[j>>2]=c[h>>2];c[j+4>>2]=i;c[g+8>>2]=c[g+ -8>>2];g=c[f>>2]|0;i=d+b|0;b=c[i+4>>2]|0;d=g+ -16|0;c[d>>2]=c[i>>2];c[d+4>>2]=b;c[g+ -8>>2]=c[e>>2];e=c[f>>2]|0;c[f>>2]=e+16;Af(a,e+ -16|0,1,0);sf(a,2)}function sf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b+64|0;f=c[e>>2]|0;if((f|0)!=0){c[f+160>>2]=d;ua((c[e>>2]|0)+4|0,1)}a[b+6|0]=d;e=b+12|0;f=c[e>>2]|0;g=c[f+172>>2]|0;if((c[g+64>>2]|0)!=0){h=c[b+8>>2]|0;i=g+8|0;g=c[i>>2]|0;c[i>>2]=g+16;i=h+ -16|0;j=c[i+4>>2]|0;k=g;c[k>>2]=c[i>>2];c[k+4>>2]=j;c[g+8>>2]=c[h+ -8>>2];sf(c[(c[e>>2]|0)+172>>2]|0,d)}d=c[f+168>>2]|0;if((d|0)==0){Ua()}rc[d&255](b)|0;Ua()}function tf(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,u=0,v=0;f=i;i=i+176|0;g=i;i=i+168|0;c[g>>2]=0;h=f;j=a+38|0;k=b[j>>1]|0;l=h+160|0;c[l>>2]=0;m=a+64|0;c[h>>2]=c[m>>2];c[m>>2]=h;_m(h+4|0,1,g|0)|0;s=0;n=s;s=0;if((n|0)!=0&(t|0)!=0){o=$m(c[n>>2]|0,g)|0;if((o|0)==0){ua(n|0,t|0)}H=t}else{o=-1}if((o|0)==1){p=H}else{p=0}while(1){if((p|0)!=0){q=6;break}s=0;la(d|0,a|0,e|0);o=s;s=0;if((o|0)!=0&(t|0)!=0){r=$m(c[o>>2]|0,g)|0;if((r|0)==0){ua(o|0,t|0)}H=t}else{r=-1}if((r|0)==1){p=H}else{break}}if((q|0)==6){u=c[h>>2]|0;c[m>>2]=u;b[j>>1]=k;v=c[l>>2]|0;i=f;return v|0}u=c[h>>2]|0;c[m>>2]=u;b[j>>1]=k;v=c[l>>2]|0;i=f;return v|0}function uf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=b+28|0;g=c[f>>2]|0;h=b+32|0;j=c[h>>2]|0;if((d+1|0)>>>0>268435455){th(b)}k=uh(b,g,j<<4,d<<4)|0;c[f>>2]=k;if((j|0)<(d|0)){l=j;do{c[k+(l<<4)+8>>2]=0;l=l+1|0}while((l|0)!=(d|0))}c[h>>2]=d;c[b+24>>2]=k+(d+ -5<<4);d=b+8|0;h=g;c[d>>2]=k+((c[d>>2]|0)-h>>4<<4);d=c[b+56>>2]|0;if((d|0)!=0?(g=d+8|0,c[g>>2]=k+((c[g>>2]|0)-h>>4<<4),g=c[d>>2]|0,(g|0)!=0):0){d=g;do{g=d+8|0;c[g>>2]=(c[f>>2]|0)+((c[g>>2]|0)-h>>4<<4);d=c[d>>2]|0}while((d|0)!=0)}d=c[b+16>>2]|0;if((d|0)==0){i=e;return}else{m=d}do{d=m+4|0;c[d>>2]=(c[f>>2]|0)+((c[d>>2]|0)-h>>4<<4);c[m>>2]=(c[f>>2]|0)+((c[m>>2]|0)-h>>4<<4);if(!((a[m+18|0]&1)==0)){d=m+24|0;c[d>>2]=(c[f>>2]|0)+((c[d>>2]|0)-h>>4<<4)}m=c[m+8>>2]|0}while((m|0)!=0);i=e;return}function vf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=c[a+32>>2]|0;if((e|0)>1e6){sf(a,6)}f=b+5+((c[a+8>>2]|0)-(c[a+28>>2]|0)>>4)|0;b=e<<1;e=(b|0)>1e6?1e6:b;b=(e|0)<(f|0)?f:e;if((b|0)>1e6){uf(a,1000200);nf(a,1344,d)}else{uf(a,b);i=d;return}}function wf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=c[a+8>>2]|0;e=c[a+16>>2]|0;if((e|0)==0){f=d}else{g=e;e=d;while(1){d=c[g+4>>2]|0;h=e>>>0<d>>>0?d:e;d=c[g+8>>2]|0;if((d|0)==0){f=h;break}else{g=d;e=h}}}e=f-(c[a+28>>2]|0)|0;f=(e>>4)+1|0;g=((f|0)/8|0)+10+f|0;f=(g|0)>1e6?1e6:g;if((e|0)>15999984){i=b;return}if((f|0)>=(c[a+32>>2]|0)){i=b;return}uf(a,f);i=b;return}function xf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+112|0;h=g;j=c[b+52>>2]|0;if((j|0)==0){i=g;return}k=b+41|0;if((a[k]|0)==0){i=g;return}l=c[b+16>>2]|0;m=b+8|0;n=c[m>>2]|0;o=b+28|0;p=n;q=c[o>>2]|0;r=p-q|0;s=l+4|0;t=(c[s>>2]|0)-q|0;c[h>>2]=e;c[h+20>>2]=f;c[h+96>>2]=l;do{if(((c[b+24>>2]|0)-p|0)<336){f=c[b+32>>2]|0;if((f|0)>1e6){sf(b,6)}e=(r>>4)+25|0;q=f<<1;f=(q|0)>1e6?1e6:q;q=(f|0)<(e|0)?e:f;if((q|0)>1e6){uf(b,1000200);nf(b,1344,h)}else{uf(b,q);u=c[m>>2]|0;break}}else{u=n}}while(0);c[s>>2]=u+320;a[k]=0;u=l+18|0;a[u]=d[u]|2;tc[j&15](b,h);a[k]=1;c[s>>2]=(c[o>>2]|0)+t;c[m>>2]=(c[o>>2]|0)+r;a[u]=a[u]&253;i=g;return}function yf(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;h=i;i=i+16|0;j=h;k=e+28|0;l=e+8|0;m=e+24|0;n=e+32|0;o=f;while(1){p=c[k>>2]|0;f=o;q=p;r=f-q|0;s=c[o+8>>2]&63;if((s|0)==38){t=4;break}else if((s|0)==22){t=3;break}else if((s|0)==6){t=31;break}s=Ij(e,o,16)|0;u=f-(c[k>>2]|0)|0;f=s+8|0;if((c[f>>2]&15|0)!=6){t=54;break}v=c[l>>2]|0;if(v>>>0>o>>>0){w=v;do{x=w;w=w+ -16|0;y=w;z=c[y+4>>2]|0;A=x;c[A>>2]=c[y>>2];c[A+4>>2]=z;c[x+8>>2]=c[x+ -8>>2]}while(w>>>0>o>>>0);B=c[l>>2]|0}else{B=v}w=B+16|0;c[l>>2]=w;x=w;if(((c[m>>2]|0)-x|0)<16){w=c[n>>2]|0;if((w|0)>1e6){t=60;break}z=(x-(c[k>>2]|0)>>4)+5|0;x=w<<1;w=(x|0)>1e6?1e6:x;x=(w|0)<(z|0)?z:w;if((x|0)>1e6){t=62;break}uf(e,x)}x=c[k>>2]|0;w=x+u|0;z=s;A=c[z+4>>2]|0;y=w;c[y>>2]=c[z>>2];c[y+4>>2]=A;c[x+(u+8)>>2]=c[f>>2];o=w}if((t|0)==3){C=o}else if((t|0)==4){C=(c[o>>2]|0)+12|0}else if((t|0)==31){B=c[(c[o>>2]|0)+12>>2]|0;w=c[l>>2]|0;x=w;A=B+78|0;y=d[A]|0;do{if(((c[m>>2]|0)-x>>4|0)<=(y|0)){z=c[n>>2]|0;if((z|0)>1e6){sf(e,6)}D=y+5+(x-q>>4)|0;E=z<<1;z=(E|0)>1e6?1e6:E;E=(z|0)<(D|0)?D:z;if((E|0)>1e6){uf(e,1000200);nf(e,1344,j)}else{uf(e,E);F=c[k>>2]|0;G=c[l>>2]|0;break}}else{F=p;G=w}}while(0);w=F+r|0;p=G-w>>4;x=p+ -1|0;y=B+76|0;E=a[y]|0;if((p|0)>(E&255|0)){H=E;I=G;J=x}else{E=G;G=x;while(1){x=E+16|0;c[l>>2]=x;c[E+8>>2]=0;p=G+1|0;z=a[y]|0;if((p|0)<(z&255|0)){E=x;G=p}else{H=z;I=x;J=p;break}}}if((a[B+77|0]|0)!=0){G=H&255;if(!(H<<24>>24==0)?(E=0-J|0,c[l>>2]=I+16,y=I+(E<<4)|0,p=c[y+4>>2]|0,x=I,c[x>>2]=c[y>>2],c[x+4>>2]=p,p=I+(E<<4)+8|0,c[I+8>>2]=c[p>>2],c[p>>2]=0,(H&255)>1):0){H=1;while(1){p=c[l>>2]|0;E=H-J|0;c[l>>2]=p+16;x=I+(E<<4)|0;y=c[x+4>>2]|0;z=p;c[z>>2]=c[x>>2];c[z+4>>2]=y;y=I+(E<<4)+8|0;c[p+8>>2]=c[y>>2];c[y>>2]=0;y=H+1|0;if((y|0)<(G|0)){H=y}else{K=I;break}}}else{K=I}}else{K=F+(r+16)|0}F=e+16|0;I=c[(c[F>>2]|0)+12>>2]|0;if((I|0)==0){L=Ai(e)|0}else{L=I}c[F>>2]=L;b[L+16>>1]=g;c[L>>2]=w;c[L+24>>2]=K;w=K+(d[A]<<4)|0;c[L+4>>2]=w;A=L+28|0;c[A>>2]=c[B+12>>2];B=L+18|0;a[B]=1;c[l>>2]=w;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){gg(e)}if((a[e+40|0]&1)==0){M=0;i=h;return M|0}c[A>>2]=(c[A>>2]|0)+4;w=c[L+8>>2]|0;if(!((a[w+18|0]&1)==0)?(c[(c[w+28>>2]|0)+ -4>>2]&63|0)==30:0){a[B]=d[B]|64;N=4}else{N=0}xf(e,N,-1);c[A>>2]=(c[A>>2]|0)+ -4;M=0;i=h;return M|0}else if((t|0)==54){lf(e,o,1640)}else if((t|0)==60){sf(e,6)}else if((t|0)==62){uf(e,1000200);nf(e,1344,j)}t=c[C>>2]|0;C=c[l>>2]|0;do{if(((c[m>>2]|0)-C|0)<336){o=c[n>>2]|0;if((o|0)>1e6){sf(e,6)}A=(C-q>>4)+25|0;N=o<<1;o=(N|0)>1e6?1e6:N;N=(o|0)<(A|0)?A:o;if((N|0)>1e6){uf(e,1000200);nf(e,1344,j)}else{uf(e,N);break}}}while(0);j=e+16|0;q=c[(c[j>>2]|0)+12>>2]|0;if((q|0)==0){O=Ai(e)|0}else{O=q}c[j>>2]=O;b[O+16>>1]=g;c[O>>2]=(c[k>>2]|0)+r;c[O+4>>2]=(c[l>>2]|0)+320;a[O+18|0]=0;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){gg(e)}O=e+40|0;if(!((a[O]&1)==0)){xf(e,0,-1)}r=rc[t&255](e)|0;t=(c[l>>2]|0)+(0-r<<4)|0;r=c[j>>2]|0;g=d[O]|0;if((g&6|0)==0){P=t;Q=r+8|0}else{if((g&2|0)==0){R=t}else{g=t-(c[k>>2]|0)|0;xf(e,1,-1);R=(c[k>>2]|0)+g|0}g=r+8|0;c[e+20>>2]=c[(c[g>>2]|0)+28>>2];P=R;Q=g}g=c[r>>2]|0;R=b[r+16>>1]|0;c[j>>2]=c[Q>>2];a:do{if(!(R<<16>>16==0)){Q=P;j=R<<16>>16;r=g;while(1){if(!(Q>>>0<(c[l>>2]|0)>>>0)){break}e=r+16|0;k=Q;t=c[k+4>>2]|0;O=r;c[O>>2]=c[k>>2];c[O+4>>2]=t;c[r+8>>2]=c[Q+8>>2];t=j+ -1|0;if((t|0)==0){S=e;break a}Q=Q+16|0;j=t;r=e}if((j|0)>0){Q=j;f=r;while(1){Q=Q+ -1|0;c[f+8>>2]=0;if((Q|0)<=0){break}else{f=f+16|0}}S=r+(j<<4)|0}else{S=r}}else{S=g}}while(0);c[l>>2]=S;M=1;i=h;return M|0}function zf(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;g=a+16|0;h=c[g>>2]|0;j=d[a+40|0]|0;if((j&6|0)==0){k=e;l=h+8|0}else{if((j&2|0)==0){m=e}else{j=a+28|0;n=e-(c[j>>2]|0)|0;xf(a,1,-1);m=(c[j>>2]|0)+n|0}n=h+8|0;c[a+20>>2]=c[(c[n>>2]|0)+28>>2];k=m;l=n}n=c[h>>2]|0;m=b[h+16>>1]|0;h=m<<16>>16;c[g>>2]=c[l>>2];l=a+8|0;if(m<<16>>16==0){o=n;c[l>>2]=o;p=h+1|0;i=f;return p|0}else{q=k;r=h;s=n}while(1){if(!(q>>>0<(c[l>>2]|0)>>>0)){break}n=s+16|0;k=q;m=c[k+4>>2]|0;a=s;c[a>>2]=c[k>>2];c[a+4>>2]=m;c[s+8>>2]=c[q+8>>2];m=r+ -1|0;if((m|0)==0){o=n;t=12;break}else{q=q+16|0;r=m;s=n}}if((t|0)==12){c[l>>2]=o;p=h+1|0;i=f;return p|0}if((r|0)>0){u=r;v=s}else{o=s;c[l>>2]=o;p=h+1|0;i=f;return p|0}while(1){u=u+ -1|0;c[v+8>>2]=0;if((u|0)<=0){break}else{v=v+16|0}}o=s+(r<<4)|0;c[l>>2]=o;p=h+1|0;i=f;return p|0}function Af(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+16|0;g=f;h=a+38|0;j=(b[h>>1]|0)+1<<16>>16;b[h>>1]=j;if((j&65535)>199){if(j<<16>>16==200){nf(a,1360,g)}if((j&65535)>224){sf(a,6)}}j=(e|0)!=0;if(!j){e=a+36|0;b[e>>1]=(b[e>>1]|0)+1<<16>>16}if((yf(a,c,d)|0)==0){Zj(a)}if(j){k=b[h>>1]|0;l=k+ -1<<16>>16;b[h>>1]=l;i=f;return}j=a+36|0;b[j>>1]=(b[j>>1]|0)+ -1<<16>>16;k=b[h>>1]|0;l=k+ -1<<16>>16;b[h>>1]=l;i=f;return}function Bf(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;j=i;if((g|0)==0){k=1}else{k=(e[g+38>>1]|0)+1&65535}g=f+38|0;b[g>>1]=k;k=f+36|0;b[k>>1]=0;l=f+8|0;m=tf(f,3,(c[l>>2]|0)+(0-h<<4)|0)|0;if((m|0)==-1){n=2;b[k>>1]=1;o=b[g>>1]|0;p=o+ -1<<16>>16;b[g>>1]=p;i=j;return n|0}if(!(m>>>0>1)){n=m;b[k>>1]=1;o=b[g>>1]|0;p=o+ -1<<16>>16;b[g>>1]=p;i=j;return n|0}h=f+16|0;q=f+28|0;r=f+41|0;s=f+68|0;t=f+32|0;u=f+12|0;v=m;a:while(1){m=c[h>>2]|0;if((m|0)==0){break}else{w=m}while(1){x=w+18|0;if(!((a[x]&16)==0)){break}m=c[w+8>>2]|0;if((m|0)==0){break a}else{w=m}}m=c[q>>2]|0;y=c[w+20>>2]|0;z=m+y|0;Qf(f,z);if((v|0)==4){A=c[(c[u>>2]|0)+180>>2]|0;c[z>>2]=A;c[m+(y+8)>>2]=d[A+4|0]|0|64}else if((v|0)==6){A=Mi(f,1544,23)|0;c[z>>2]=A;c[m+(y+8)>>2]=d[A+4|0]|0|64}else{A=c[l>>2]|0;B=A+ -16|0;C=c[B+4>>2]|0;D=z;c[D>>2]=c[B>>2];c[D+4>>2]=C;c[m+(y+8)>>2]=c[A+ -8>>2]}A=m+(y+16)|0;c[l>>2]=A;c[h>>2]=w;a[r]=a[w+36|0]|0;b[k>>1]=0;if((w|0)==0){E=A}else{y=w;m=A;while(1){A=c[y+4>>2]|0;C=m>>>0<A>>>0?A:m;A=c[y+8>>2]|0;if((A|0)==0){E=C;break}else{y=A;m=C}}}m=E-(c[q>>2]|0)|0;y=(m>>4)+1|0;C=((y|0)/8|0)+10+y|0;y=(C|0)>1e6?1e6:C;if((m|0)<=15999984?(y|0)<(c[t>>2]|0):0){uf(f,y)}c[s>>2]=c[w+32>>2];a[x]=d[x]|0|32;a[w+37|0]=v;y=tf(f,4,0)|0;if(y>>>0>1){v=y}else{n=y;F=24;break}}if((F|0)==24){b[k>>1]=1;o=b[g>>1]|0;p=o+ -1<<16>>16;b[g>>1]=p;i=j;return n|0}a[f+6|0]=v;F=c[l>>2]|0;if((v|0)==4){w=c[(c[u>>2]|0)+180>>2]|0;c[F>>2]=w;c[F+8>>2]=d[w+4|0]|0|64}else if((v|0)==6){w=Mi(f,1544,23)|0;c[F>>2]=w;c[F+8>>2]=d[w+4|0]|0|64}else{w=F+ -16|0;f=c[w+4>>2]|0;u=F;c[u>>2]=c[w>>2];c[u+4>>2]=f;c[F+8>>2]=c[F+ -8>>2]}f=F+16|0;c[l>>2]=f;c[(c[h>>2]|0)+4>>2]=f;n=v;b[k>>1]=1;o=b[g>>1]|0;p=o+ -1<<16>>16;b[g>>1]=p;i=j;return n|0}function Cf(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;h=i;j=f+16|0;k=c[j>>2]|0;if((e[f+38>>1]|0)>199){If(f,1360,g)}l=f+6|0;m=a[l]|0;if(m<<24>>24==1){a[l]=0;l=f+28|0;c[k>>2]=(c[l>>2]|0)+(c[k+20>>2]|0);n=k+18|0;o=a[n]|0;if((o&1)==0){p=c[k+28>>2]|0;if((p|0)==0){q=g}else{a[k+37|0]=1;a[n]=o&255|8;o=rc[p&255](f)|0;q=(c[f+8>>2]|0)+(0-o<<4)|0}o=c[j>>2]|0;p=d[f+40|0]|0;if((p&6|0)==0){r=q;s=o+8|0}else{if((p&2|0)==0){t=q}else{p=q-(c[l>>2]|0)|0;xf(f,1,-1);t=(c[l>>2]|0)+p|0}p=o+8|0;c[f+20>>2]=c[(c[p>>2]|0)+28>>2];r=t;s=p}p=c[o>>2]|0;t=b[o+16>>1]|0;c[j>>2]=c[s>>2];s=f+8|0;a:do{if(!(t<<16>>16==0)){j=r;o=t<<16>>16;l=p;while(1){if(!(j>>>0<(c[s>>2]|0)>>>0)){break}q=l+16|0;n=j;u=c[n+4>>2]|0;v=l;c[v>>2]=c[n>>2];c[v+4>>2]=u;c[l+8>>2]=c[j+8>>2];u=o+ -1|0;if((u|0)==0){w=q;break a}j=j+16|0;o=u;l=q}if((o|0)>0){j=o;q=l;while(1){j=j+ -1|0;c[q+8>>2]=0;if((j|0)<=0){break}else{q=q+16|0}}w=l+(o<<4)|0}else{w=l}}else{w=p}}while(0);c[s>>2]=w}else{Zj(f)}Df(f,0);i=h;return}else if(m<<24>>24==0){if((k|0)!=(f+72|0)){If(f,1568,g)}if((yf(f,g+ -16|0,-1)|0)!=0){i=h;return}Zj(f);i=h;return}else{If(f,1608,g)}}function Df(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;f=i;g=e+16|0;h=c[g>>2]|0;j=e+72|0;if((h|0)==(j|0)){i=f;return}k=e+8|0;l=e+40|0;m=e+20|0;n=e+28|0;o=e+68|0;p=h;do{h=p+18|0;q=a[h]|0;if((q&1)==0){r=q&255;if((r&16|0)!=0){a[h]=r&239;c[o>>2]=c[p+32>>2]}if((b[p+16>>1]|0)==-1?(r=(c[g>>2]|0)+4|0,q=c[k>>2]|0,(c[r>>2]|0)>>>0<q>>>0):0){c[r>>2]=q}q=a[h]|0;if((q&32)==0){a[p+37|0]=1}a[h]=q&199|8;q=rc[c[p+28>>2]&255](e)|0;h=(c[k>>2]|0)+(0-q<<4)|0;q=c[g>>2]|0;r=d[l]|0;if((r&6|0)==0){s=h;t=q+8|0}else{if((r&2|0)==0){u=h}else{r=h-(c[n>>2]|0)|0;xf(e,1,-1);u=(c[n>>2]|0)+r|0}r=q+8|0;c[m>>2]=c[(c[r>>2]|0)+28>>2];s=u;t=r}r=c[q>>2]|0;h=b[q+16>>1]|0;c[g>>2]=c[t>>2];a:do{if(!(h<<16>>16==0)){q=h<<16>>16;if(s>>>0<(c[k>>2]|0)>>>0){v=s;w=q;x=r;while(1){y=x+16|0;z=v;A=c[z+4>>2]|0;B=x;c[B>>2]=c[z>>2];c[B+4>>2]=A;c[x+8>>2]=c[v+8>>2];A=w+ -1|0;B=v+16|0;if((A|0)==0){C=y;break a}if(B>>>0<(c[k>>2]|0)>>>0){v=B;w=A;x=y}else{D=A;E=y;break}}}else{D=q;E=r}if((D|0)>0){x=D;w=E;while(1){x=x+ -1|0;c[w+8>>2]=0;if((x|0)<=0){break}else{w=w+16|0}}C=E+(D<<4)|0}else{C=E}}else{C=r}}while(0);c[k>>2]=C}else{Yj(e);Zj(e)}p=c[g>>2]|0}while((p|0)!=(j|0));i=f;return}function Ef(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;i=i+16|0;j=h;k=c[d+16>>2]|0;if((b[d+36>>1]|0)!=0){if((c[(c[d+12>>2]|0)+172>>2]|0)==(d|0)){nf(d,1432,j)}else{nf(d,1384,j)}}a[d+6|0]=1;c[k+20>>2]=(c[k>>2]|0)-(c[d+28>>2]|0);if(!((a[k+18|0]&1)==0)){i=h;return 0}c[k+28>>2]=g;if((g|0)==0){l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;sf(d,1)}c[k+24>>2]=f;l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;sf(d,1);return 0}function Ff(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;l=e+16|0;m=c[l>>2]|0;n=e+41|0;o=a[n]|0;p=e+36|0;q=b[p>>1]|0;r=e+68|0;s=c[r>>2]|0;c[r>>2]=j;j=tf(e,f,g)|0;if((j|0)==0){c[r>>2]=s;i=k;return j|0}g=e+28|0;f=c[g>>2]|0;t=f+h|0;Qf(e,t);if((j|0)==6){u=Mi(e,1544,23)|0;c[t>>2]=u;c[f+(h+8)>>2]=d[u+4|0]|0|64}else if((j|0)==4){u=c[(c[e+12>>2]|0)+180>>2]|0;c[t>>2]=u;c[f+(h+8)>>2]=d[u+4|0]|0|64}else{u=c[e+8>>2]|0;v=u+ -16|0;w=c[v+4>>2]|0;x=t;c[x>>2]=c[v>>2];c[x+4>>2]=w;c[f+(h+8)>>2]=c[u+ -8>>2]}u=f+(h+16)|0;c[e+8>>2]=u;c[l>>2]=m;a[n]=o;b[p>>1]=q;if((m|0)==0){y=u}else{q=m;m=u;while(1){u=c[q+4>>2]|0;p=m>>>0<u>>>0?u:m;u=c[q+8>>2]|0;if((u|0)==0){y=p;break}else{q=u;m=p}}}m=y-(c[g>>2]|0)|0;g=(m>>4)+1|0;y=((g|0)/8|0)+10+g|0;g=(y|0)>1e6?1e6:y;if((m|0)>15999984){c[r>>2]=s;i=k;return j|0}if((g|0)>=(c[e+32>>2]|0)){c[r>>2]=s;i=k;return j|0}uf(e,g);c[r>>2]=s;i=k;return j|0}function Gf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+64|0;h=g;j=a+36|0;b[j>>1]=(b[j>>1]|0)+1<<16>>16;c[h>>2]=d;c[h+56>>2]=e;c[h+52>>2]=f;f=h+16|0;c[f>>2]=0;e=h+24|0;c[e>>2]=0;d=h+28|0;c[d>>2]=0;k=h+36|0;c[k>>2]=0;l=h+40|0;c[l>>2]=0;m=h+48|0;c[m>>2]=0;n=h+4|0;c[n>>2]=0;o=h+12|0;c[o>>2]=0;p=Ff(a,5,h,(c[a+8>>2]|0)-(c[a+28>>2]|0)|0,c[a+68>>2]|0)|0;c[n>>2]=uh(a,c[n>>2]|0,c[o>>2]|0,0)|0;c[o>>2]=0;uh(a,c[f>>2]|0,c[e>>2]<<1,0)|0;uh(a,c[d>>2]|0,c[k>>2]<<4,0)|0;uh(a,c[l>>2]|0,c[m>>2]<<4,0)|0;b[j>>1]=(b[j>>1]|0)+ -1<<16>>16;i=g;return p|0}function Hf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+16|0;g=f;h=c[e>>2]|0;j=c[h>>2]|0;c[h>>2]=j+ -1;if((j|0)==0){k=_j(h)|0}else{j=h+4|0;h=c[j>>2]|0;c[j>>2]=h+1;k=d[h]|0}h=c[e+52>>2]|0;j=(h|0)==0;if((k|0)==27){if(!j?(xm(h,98)|0)==0:0){c[g>>2]=1480;c[g+4>>2]=h;Rh(b,1496,g)|0;sf(b,3)}l=Jj(b,c[e>>2]|0,e+4|0,c[e+56>>2]|0)|0}else{if(!j?(xm(h,116)|0)==0:0){c[g>>2]=1488;c[g+4>>2]=h;Rh(b,1496,g)|0;sf(b,3)}l=di(b,c[e>>2]|0,e+4|0,e+16|0,c[e+56>>2]|0,k)|0}k=l+6|0;if((a[k]|0)==0){i=f;return}e=l+16|0;g=l+5|0;h=0;do{j=Nf(b)|0;c[e+(h<<2)>>2]=j;if(!((a[j+5|0]&3)==0)?!((a[g]&4)==0):0){Uf(b,l,j)}h=h+1|0}while((h|0)<(d[k]|0));i=f;return}function If(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=a+8|0;c[f>>2]=e;g=Ni(a,b)|0;c[e>>2]=g;c[e+8>>2]=d[g+4|0]|0|64;c[f>>2]=(c[f>>2]|0)+16;sf(a,-1)}function Jf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+48|0;h=g+20|0;j=g;c[j>>2]=a;c[j+4>>2]=d;c[j+8>>2]=e;c[j+12>>2]=f;f=j+16|0;Lj(h);c[f>>2]=vc[d&3](a,h,18,e)|0;Kf(b,j);i=g;return c[f>>2]|0}function Kf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0;e=i;i=i+64|0;f=e+56|0;g=e+52|0;j=e+48|0;k=e;l=e+60|0;m=e+44|0;n=e+40|0;o=e+36|0;p=e+32|0;q=e+28|0;r=e+24|0;s=e+20|0;t=e+16|0;u=e+12|0;v=e+8|0;c[f>>2]=c[b+64>>2];w=d+16|0;x=c[w>>2]|0;if((x|0)==0){y=vc[c[d+4>>2]&3](c[d>>2]|0,f,4,c[d+8>>2]|0)|0;c[w>>2]=y;z=y}else{z=x}c[f>>2]=c[b+68>>2];if((z|0)==0){x=vc[c[d+4>>2]&3](c[d>>2]|0,f,4,c[d+8>>2]|0)|0;c[w>>2]=x;A=x}else{A=z}a[f]=a[b+76|0]|0;if((A|0)==0){z=vc[c[d+4>>2]&3](c[d>>2]|0,f,1,c[d+8>>2]|0)|0;c[w>>2]=z;B=z}else{B=A}a[f]=a[b+77|0]|0;if((B|0)==0){A=vc[c[d+4>>2]&3](c[d>>2]|0,f,1,c[d+8>>2]|0)|0;c[w>>2]=A;C=A}else{C=B}a[f]=a[b+78|0]|0;if((C|0)==0){B=vc[c[d+4>>2]&3](c[d>>2]|0,f,1,c[d+8>>2]|0)|0;c[w>>2]=B;D=B}else{D=C}C=c[b+12>>2]|0;B=c[b+48>>2]|0;c[p>>2]=B;if((D|0)==0){A=d+4|0;z=d+8|0;x=vc[c[A>>2]&3](c[d>>2]|0,p,4,c[z>>2]|0)|0;c[w>>2]=x;if((x|0)==0){p=vc[c[A>>2]&3](c[d>>2]|0,C,B<<2,c[z>>2]|0)|0;c[w>>2]=p;z=c[b+44>>2]|0;c[m>>2]=z;if((p|0)==0){B=vc[c[d+4>>2]&3](c[d>>2]|0,m,4,c[d+8>>2]|0)|0;c[w>>2]=B;E=B;F=z}else{E=p;F=z}}else{G=x;H=13}}else{G=D;H=13}if((H|0)==13){D=c[b+44>>2]|0;c[m>>2]=D;E=G;F=D}if((F|0)>0){D=b+8|0;G=d+4|0;m=d+8|0;x=E;z=0;while(1){p=c[D>>2]|0;B=p+(z<<4)|0;C=p+(z<<4)+8|0;p=c[C>>2]|0;a[f]=p&15;if((x|0)==0){A=vc[c[G>>2]&3](c[d>>2]|0,f,1,c[m>>2]|0)|0;c[w>>2]=A;I=c[C>>2]|0;J=A}else{I=p;J=x}p=I&15;do{if((p|0)==1){a[l]=c[B>>2];if((J|0)==0){A=vc[c[G>>2]&3](c[d>>2]|0,l,1,c[m>>2]|0)|0;c[w>>2]=A;K=A}else{K=J}}else if((p|0)==3){h[k>>3]=+h[B>>3];if((J|0)==0){A=vc[c[G>>2]&3](c[d>>2]|0,k,8,c[m>>2]|0)|0;c[w>>2]=A;K=A}else{K=J}}else if((p|0)==4){A=c[B>>2]|0;if((A|0)==0){c[g>>2]=0;if((J|0)!=0){K=J;break}C=vc[c[G>>2]&3](c[d>>2]|0,g,4,c[m>>2]|0)|0;c[w>>2]=C;K=C;break}c[j>>2]=(c[A+12>>2]|0)+1;if((J|0)==0){C=vc[c[G>>2]&3](c[d>>2]|0,j,4,c[m>>2]|0)|0;c[w>>2]=C;if((C|0)==0){y=vc[c[G>>2]&3](c[d>>2]|0,A+16|0,c[j>>2]|0,c[m>>2]|0)|0;c[w>>2]=y;K=y}else{K=C}}else{K=J}}else{K=J}}while(0);B=z+1|0;if((B|0)==(F|0)){L=K;break}else{x=K;z=B}}}else{L=E}E=c[b+56>>2]|0;c[f>>2]=E;if((L|0)==0){z=vc[c[d+4>>2]&3](c[d>>2]|0,f,4,c[d+8>>2]|0)|0;c[w>>2]=z;M=z}else{M=L}if((E|0)>0){L=b+16|0;z=0;do{Kf(c[(c[L>>2]|0)+(z<<2)>>2]|0,d);z=z+1|0}while((z|0)!=(E|0));N=c[w>>2]|0}else{N=M}M=b+40|0;E=c[M>>2]|0;c[o>>2]=E;if((N|0)==0){z=vc[c[d+4>>2]&3](c[d>>2]|0,o,4,c[d+8>>2]|0)|0;c[w>>2]=z;O=z}else{O=N}if((E|0)>0){N=b+28|0;z=d+4|0;o=d+8|0;L=O;f=0;while(1){K=c[N>>2]|0;a[n]=a[K+(f<<3)+4|0]|0;if((L|0)==0){x=vc[c[z>>2]&3](c[d>>2]|0,n,1,c[o>>2]|0)|0;c[w>>2]=x;P=c[N>>2]|0;Q=x}else{P=K;Q=L}a[n]=a[P+(f<<3)+5|0]|0;if((Q|0)==0){K=vc[c[z>>2]&3](c[d>>2]|0,n,1,c[o>>2]|0)|0;c[w>>2]=K;R=K}else{R=Q}K=f+1|0;if((K|0)==(E|0)){S=R;break}else{L=R;f=K}}}else{S=O}O=d+12|0;if((c[O>>2]|0)==0?(f=c[b+36>>2]|0,(f|0)!=0):0){c[v>>2]=(c[f+12>>2]|0)+1;if((S|0)==0?(R=d+4|0,L=d+8|0,E=vc[c[R>>2]&3](c[d>>2]|0,v,4,c[L>>2]|0)|0,c[w>>2]=E,(E|0)==0):0){c[w>>2]=vc[c[R>>2]&3](c[d>>2]|0,f+16|0,c[v>>2]|0,c[L>>2]|0)|0;T=v;U=u}else{T=v;U=u}}else{V=u;W=v;H=50}if((H|0)==50){c[u>>2]=0;if((S|0)==0){c[w>>2]=vc[c[d+4>>2]&3](c[d>>2]|0,V,4,c[d+8>>2]|0)|0;T=W;U=V}else{T=W;U=V}}if((c[O>>2]|0)==0){X=c[b+52>>2]|0}else{X=0}V=c[b+20>>2]|0;c[t>>2]=X;U=c[w>>2]|0;if((U|0)==0){W=d+4|0;T=d+8|0;S=vc[c[W>>2]&3](c[d>>2]|0,t,4,c[T>>2]|0)|0;c[w>>2]=S;if((S|0)==0){t=vc[c[W>>2]&3](c[d>>2]|0,V,X<<2,c[T>>2]|0)|0;c[w>>2]=t;Y=t}else{Y=S}}else{Y=U}if((c[O>>2]|0)==0){Z=c[b+60>>2]|0}else{Z=0}c[s>>2]=Z;if((Y|0)==0){U=vc[c[d+4>>2]&3](c[d>>2]|0,s,4,c[d+8>>2]|0)|0;c[w>>2]=U;_=U}else{_=Y}if((Z|0)>0){Y=b+24|0;U=d+4|0;s=d+8|0;S=_;t=0;while(1){T=c[(c[Y>>2]|0)+(t*12|0)>>2]|0;if((T|0)==0){c[n>>2]=0;if((S|0)==0){X=vc[c[U>>2]&3](c[d>>2]|0,n,4,c[s>>2]|0)|0;c[w>>2]=X;$=X}else{$=S}}else{c[q>>2]=(c[T+12>>2]|0)+1;if((S|0)==0){X=vc[c[U>>2]&3](c[d>>2]|0,q,4,c[s>>2]|0)|0;c[w>>2]=X;if((X|0)==0){V=vc[c[U>>2]&3](c[d>>2]|0,T+16|0,c[q>>2]|0,c[s>>2]|0)|0;c[w>>2]=V;$=V}else{$=X}}else{$=S}}X=c[Y>>2]|0;c[n>>2]=c[X+(t*12|0)+4>>2];if(($|0)==0){V=vc[c[U>>2]&3](c[d>>2]|0,n,4,c[s>>2]|0)|0;c[w>>2]=V;aa=c[Y>>2]|0;ba=V}else{aa=X;ba=$}c[n>>2]=c[aa+(t*12|0)+8>>2];if((ba|0)==0){X=vc[c[U>>2]&3](c[d>>2]|0,n,4,c[s>>2]|0)|0;c[w>>2]=X;ca=X}else{ca=ba}X=t+1|0;if((X|0)==(Z|0)){da=ca;break}else{S=ca;t=X}}}else{da=_}if((c[O>>2]|0)==0){ea=c[M>>2]|0}else{ea=0}c[r>>2]=ea;if((da|0)==0){M=vc[c[d+4>>2]&3](c[d>>2]|0,r,4,c[d+8>>2]|0)|0;c[w>>2]=M;fa=M}else{fa=da}if((ea|0)<=0){i=e;return}da=b+28|0;b=d+4|0;M=d+8|0;r=fa;fa=0;while(1){O=c[(c[da>>2]|0)+(fa<<3)>>2]|0;if((O|0)==0){c[n>>2]=0;if((r|0)==0){_=vc[c[b>>2]&3](c[d>>2]|0,n,4,c[M>>2]|0)|0;c[w>>2]=_;ga=_}else{ga=r}}else{c[q>>2]=(c[O+12>>2]|0)+1;if((r|0)==0){_=vc[c[b>>2]&3](c[d>>2]|0,q,4,c[M>>2]|0)|0;c[w>>2]=_;if((_|0)==0){t=vc[c[b>>2]&3](c[d>>2]|0,O+16|0,c[q>>2]|0,c[M>>2]|0)|0;c[w>>2]=t;ga=t}else{ga=_}}else{ga=r}}fa=fa+1|0;if((fa|0)==(ea|0)){break}else{r=ga}}i=e;return}function Lf(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;e=Zf(b,38,(c<<4)+16|0,0,0)|0;a[e+6|0]=c;i=d;return e|0}function Mf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=Zf(b,6,(d<<2)+16|0,0,0)|0;c[f+12>>2]=0;a[f+6|0]=d;if((d|0)==0){i=e;return f|0}b=f+16|0;g=d;do{g=g+ -1|0;c[b+(g<<2)>>2]=0}while((g|0)!=0);i=e;return f|0}function Nf(a){a=a|0;var b=0,d=0;b=i;d=Zf(a,10,32,0,0)|0;c[d+8>>2]=d+16;c[d+24>>2]=0;i=b;return d|0}function Of(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=c[b+12>>2]|0;h=b+56|0;j=c[h>>2]|0;a:do{if((j|0)==0){k=h}else{l=j;m=h;while(1){n=c[l+8>>2]|0;if(n>>>0<e>>>0){k=m;break a}if((n|0)==(e|0)){break}n=c[l>>2]|0;if((n|0)==0){k=l;break a}else{o=l;l=n;m=o}}m=l+5|0;o=(d[m]|0)^3;if((((d[g+60|0]|0)^3)&o|0)!=0){p=l;i=f;return p|0}a[m]=o;p=l;i=f;return p|0}}while(0);h=Zf(b,10,32,k,0)|0;c[h+8>>2]=e;e=h+16|0;c[e>>2]=g+112;k=g+132|0;g=c[k>>2]|0;c[e+4>>2]=g;c[g+16>>2]=h;c[k>>2]=h;p=h;i=f;return p|0}function Pf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;if((c[b+8>>2]|0)==(b+16|0)){uh(a,b,32,0)|0;i=d;return}e=b+16|0;f=e+4|0;c[(c[f>>2]|0)+16>>2]=c[e>>2];c[(c[e>>2]|0)+20>>2]=c[f>>2];uh(a,b,32,0)|0;i=d;return}function Qf(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;f=c[a+12>>2]|0;g=a+56|0;h=c[g>>2]|0;if((h|0)==0){i=e;return}j=f+60|0;k=f+68|0;l=h;while(1){h=l+8|0;if((c[h>>2]|0)>>>0<b>>>0){m=10;break}c[g>>2]=c[l>>2];if((((d[j]|0)^3)&((d[l+5|0]|0)^3)|0)==0){if((c[h>>2]|0)!=(l+16|0)){n=l+16|0;o=n+4|0;c[(c[o>>2]|0)+16>>2]=c[n>>2];c[(c[n>>2]|0)+20>>2]=c[o>>2]}uh(a,l,32,0)|0}else{o=l+16|0;n=o+4|0;c[(c[n>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[n>>2];n=c[h>>2]|0;o=l+16|0;p=n;q=c[p+4>>2]|0;r=o;c[r>>2]=c[p>>2];c[r+4>>2]=q;c[l+24>>2]=c[n+8>>2];c[h>>2]=o;c[l>>2]=c[k>>2];c[k>>2]=l;Yf(f,l)}o=c[g>>2]|0;if((o|0)==0){m=10;break}else{l=o}}if((m|0)==10){i=e;return}}function Rf(b){b=b|0;var d=0,e=0;d=i;e=Zf(b,9,80,0,0)|0;c[e+8>>2]=0;c[e+44>>2]=0;c[e+16>>2]=0;c[e+56>>2]=0;c[e+12>>2]=0;c[e+32>>2]=0;c[e+48>>2]=0;c[e+20>>2]=0;c[e+52>>2]=0;c[e+28>>2]=0;c[e+40>>2]=0;a[e+76|0]=0;a[e+77|0]=0;a[e+78|0]=0;c[e+24>>2]=0;c[e+60>>2]=0;c[e+64>>2]=0;c[e+68>>2]=0;c[e+36>>2]=0;i=d;return e|0}function Sf(a,b){a=a|0;b=b|0;var d=0;d=i;uh(a,c[b+12>>2]|0,c[b+48>>2]<<2,0)|0;uh(a,c[b+16>>2]|0,c[b+56>>2]<<2,0)|0;uh(a,c[b+8>>2]|0,c[b+44>>2]<<4,0)|0;uh(a,c[b+20>>2]|0,c[b+52>>2]<<2,0)|0;uh(a,c[b+24>>2]|0,(c[b+60>>2]|0)*12|0,0)|0;uh(a,c[b+28>>2]|0,c[b+40>>2]<<3,0)|0;uh(a,b,80,0)|0;i=d;return}function Tf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=c[a+60>>2]|0;if((f|0)<=0){g=0;i=e;return g|0}h=c[a+24>>2]|0;a=b;b=0;while(1){if((c[h+(b*12|0)+4>>2]|0)>(d|0)){g=0;j=8;break}if((c[h+(b*12|0)+8>>2]|0)>(d|0)){k=a+ -1|0;if((k|0)==0){j=6;break}else{l=k}}else{l=a}k=b+1|0;if((k|0)<(f|0)){a=l;b=k}else{g=0;j=8;break}}if((j|0)==6){g=(c[h+(b*12|0)>>2]|0)+16|0;i=e;return g|0}else if((j|0)==8){i=e;return g|0}return 0}function Uf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=i;h=c[b+12>>2]|0;if((d[h+61|0]|0)<2){Vf(h,f);i=g;return}else{f=e+5|0;a[f]=a[h+60|0]&3|a[f]&184;i=g;return}}function Vf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=e+5|0;a[g]=a[g]&252;switch(d[e+4|0]|0|0){case 10:{h=e+8|0;j=c[h>>2]|0;if((c[j+8>>2]&64|0)!=0?(k=c[j>>2]|0,!((a[k+5|0]&3)==0)):0){Vf(b,k);l=c[h>>2]|0}else{l=j}if((l|0)==(e+16|0)){m=32}else{i=f;return}break};case 38:{l=b+84|0;c[e+8>>2]=c[l>>2];c[l>>2]=e;i=f;return};case 6:{l=b+84|0;c[e+8>>2]=c[l>>2];c[l>>2]=e;i=f;return};case 7:{l=c[e+8>>2]|0;if((l|0)!=0?!((a[l+5|0]&3)==0):0){Vf(b,l)}l=c[e+12>>2]|0;if((l|0)!=0?!((a[l+5|0]&3)==0):0){Vf(b,l)}m=(c[e+16>>2]|0)+24|0;break};case 20:case 4:{m=(c[e+12>>2]|0)+17|0;break};case 9:{l=b+84|0;c[e+72>>2]=c[l>>2];c[l>>2]=e;i=f;return};case 8:{l=b+84|0;c[e+60>>2]=c[l>>2];c[l>>2]=e;i=f;return};case 5:{l=b+84|0;c[e+24>>2]=c[l>>2];c[l>>2]=e;i=f;return};default:{i=f;return}}a[g]=d[g]|0|4;g=b+16|0;c[g>>2]=(c[g>>2]|0)+m;i=f;return}function Wf(b,d){b=b|0;d=d|0;var e=0;e=c[b+12>>2]|0;b=d+5|0;a[b]=a[b]&251;b=e+88|0;c[d+24>>2]=c[b>>2];c[b>>2]=d;return}function Xf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;if((c[e+32>>2]|0)!=0){h=c[b+12>>2]|0;j=e+5|0;a[j]=a[j]&251;j=h+88|0;c[e+72>>2]=c[j>>2];c[j>>2]=e;i=g;return}if((a[f+5|0]&3)==0){i=g;return}j=e+5|0;e=a[j]|0;if((e&4)==0){i=g;return}h=c[b+12>>2]|0;if((d[h+61|0]|0)<2){Vf(h,f);i=g;return}else{a[j]=a[h+60|0]&3|e&184;i=g;return}}function Yf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=e+5|0;h=d[g]|0;if((h&7|0)!=0){i=f;return}if((a[b+62|0]|0)!=2?(d[b+61|0]|0)>=2:0){a[g]=a[b+60|0]&3|h&184;i=f;return}a[g]=h&187|4;h=c[e+8>>2]|0;if((c[h+8>>2]&64|0)==0){i=f;return}e=c[h>>2]|0;if((a[e+5|0]&3)==0){i=f;return}Vf(b,e);i=f;return}function Zf(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0;h=i;j=c[b+12>>2]|0;k=uh(b,0,d&15,e)|0;e=k+g|0;b=(f|0)==0?j+68|0:f;a[k+(g+5)|0]=a[j+60|0]&3;a[k+(g+4)|0]=d;c[e>>2]=c[b>>2];c[b>>2]=e;i=h;return e|0}function _f(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;h=c[b+12>>2]|0;j=e+5|0;if((a[j]&24)!=0|(f|0)==0){i=g;return}if(!((a[f+6|0]&4)==0)){i=g;return}if((Hj(f,2,c[h+192>>2]|0)|0)==0){i=g;return}f=h+76|0;k=c[f>>2]|0;if((k|0)==(e|0)){do{l=cg(b,k,1)|0}while((l|0)==(k|0));c[f>>2]=l}l=h+68|0;while(1){f=c[l>>2]|0;if((f|0)==(e|0)){break}else{l=f}}c[l>>2]=c[e>>2];l=h+72|0;c[e>>2]=c[l>>2];c[l>>2]=e;e=d[j]|0|16;a[j]=e;if((d[h+61|0]|0)<2){a[j]=e&191;i=g;return}else{a[j]=a[h+60|0]&3|e&184;i=g;return}}function $f(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=b+12|0;h=c[g>>2]|0;j=h+62|0;if((d[j]|0)==(e|0)){i=f;return}if((e|0)==2){e=h+61|0;if((a[e]|0)!=0){do{dg(b)|0}while((a[e]|0)!=0)}c[h+20>>2]=(c[h+12>>2]|0)+(c[h+8>>2]|0);a[j]=2;i=f;return}a[j]=0;j=c[g>>2]|0;a[j+61|0]=2;c[j+64>>2]=0;h=j+72|0;do{k=cg(b,h,1)|0}while((k|0)==(h|0));c[j+80>>2]=k;k=j+68|0;do{l=cg(b,k,1)|0}while((l|0)==(k|0));c[j+76>>2]=l;l=(c[g>>2]|0)+61|0;if((1<<d[l]&-29|0)!=0){i=f;return}do{dg(b)|0}while((1<<d[l]&-29|0)==0);i=f;return}function ag(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;f=(c[a+12>>2]|0)+61|0;if((1<<(d[f]|0)&b|0)!=0){i=e;return}do{dg(a)|0}while((1<<(d[f]|0)&b|0)==0);i=e;return}function bg(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=b+12|0;g=c[f>>2]|0;h=g+104|0;while(1){j=c[h>>2]|0;if((j|0)==0){break}else{h=j}}j=g+72|0;k=c[j>>2]|0;if((k|0)==0){l=g}else{m=k;k=h;while(1){h=m+5|0;a[h]=d[h]|0|8;c[j>>2]=c[m>>2];c[m>>2]=c[k>>2];c[k>>2]=m;h=c[j>>2]|0;if((h|0)==0){break}else{n=m;m=h;k=n}}l=c[f>>2]|0}f=l+104|0;l=c[f>>2]|0;if((l|0)!=0){k=l;do{l=k+5|0;a[l]=a[l]&191;fg(b,0);k=c[f>>2]|0}while((k|0)!=0)}a[g+60|0]=3;a[g+62|0]=0;cg(b,j,-3)|0;cg(b,g+68|0,-3)|0;j=g+32|0;if((c[j>>2]|0)<=0){i=e;return}k=g+24|0;g=0;do{cg(b,(c[k>>2]|0)+(g<<2)|0,-3)|0;g=g+1|0}while((g|0)<(c[j>>2]|0));i=e;return}function cg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=b+12|0;j=c[h>>2]|0;k=d[j+60|0]|0;l=k^3;m=(a[j+62|0]|0)==2;j=m?255:184;n=m?64:k&3;k=m?64:0;m=c[e>>2]|0;a:do{if((m|0)==0){o=e;p=0}else{q=e;r=f;s=m;b:while(1){t=r+ -1|0;if((r|0)==0){o=q;p=s;break a}u=s+5|0;v=d[u]|0;c:do{if(((v^3)&l|0)==0){c[q>>2]=c[s>>2];switch(d[s+4|0]|0){case 6:{uh(b,s,(d[s+6|0]<<2)+16|0,0)|0;w=q;break c;break};case 7:{uh(b,s,(c[s+16>>2]|0)+24|0,0)|0;w=q;break c;break};case 20:{break};case 9:{Sf(b,s);w=q;break c;break};case 4:{x=(c[h>>2]|0)+28|0;c[x>>2]=(c[x>>2]|0)+ -1;break};case 5:{pj(b,s);w=q;break c;break};case 8:{Di(b,s);w=q;break c;break};case 10:{Pf(b,s);w=q;break c;break};case 38:{uh(b,s,(d[s+6|0]<<4)+16|0,0)|0;w=q;break c;break};default:{w=q;break c}}uh(b,s,(c[s+12>>2]|0)+17|0,0)|0;w=q}else{if((v&k|0)!=0){y=0;break b}if(((a[s+4|0]|0)==8?(c[s+28>>2]|0)!=0:0)?(cg(b,s+56|0,-3)|0,Bi(s),(a[(c[h>>2]|0)+62|0]|0)!=1):0){wf(s)}a[u]=v&j|n;w=s}}while(0);v=c[w>>2]|0;if((v|0)==0){o=w;p=0;break a}else{q=w;r=t;s=v}}i=g;return y|0}}while(0);y=(p|0)==0?0:o;i=g;return y|0}function dg(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+16|0;f=e;g=b+12|0;h=c[g>>2]|0;j=h+61|0;switch(d[j]|0){case 0:{if((c[h+84>>2]|0)!=0){k=h+16|0;l=c[k>>2]|0;jg(h);m=(c[k>>2]|0)-l|0;i=e;return m|0}a[j]=1;l=h+20|0;c[l>>2]=c[h+16>>2];k=c[g>>2]|0;n=k+16|0;o=c[n>>2]|0;if((b|0)!=0?!((a[b+5|0]&3)==0):0){Vf(k,b)}if((c[k+48>>2]&64|0)!=0?(p=c[k+40>>2]|0,!((a[p+5|0]&3)==0)):0){Vf(k,p)}kg(k);p=k+112|0;q=c[k+132>>2]|0;if((q|0)!=(p|0)){r=q;do{if(((a[r+5|0]&7)==0?(q=c[r+8>>2]|0,(c[q+8>>2]&64|0)!=0):0)?(s=c[q>>2]|0,!((a[s+5|0]&3)==0)):0){Vf(k,s)}r=c[r+20>>2]|0}while((r|0)!=(p|0))}p=k+84|0;if((c[p>>2]|0)!=0){do{jg(k)}while((c[p>>2]|0)!=0)}r=(c[n>>2]|0)-o|0;o=k+92|0;s=c[o>>2]|0;q=k+88|0;t=c[q>>2]|0;u=k+96|0;v=c[u>>2]|0;c[u>>2]=0;c[q>>2]=0;c[o>>2]=0;c[p>>2]=t;if((t|0)!=0){do{jg(k)}while((c[p>>2]|0)!=0)}c[p>>2]=s;if((s|0)!=0){do{jg(k)}while((c[p>>2]|0)!=0)}c[p>>2]=v;if((v|0)!=0){do{jg(k)}while((c[p>>2]|0)!=0)}v=c[n>>2]|0;while(1){s=c[u>>2]|0;c[u>>2]=0;t=0;q=s;a:while(1){s=q;do{if((s|0)==0){break a}w=s;s=c[s+24>>2]|0}while((mg(k,w)|0)==0);if((c[p>>2]|0)==0){t=1;q=s;continue}while(1){jg(k);if((c[p>>2]|0)==0){t=1;q=s;continue a}}}if((t|0)==0){break}}lg(k,c[o>>2]|0,0);q=k+100|0;lg(k,c[q>>2]|0,0);s=c[o>>2]|0;w=c[q>>2]|0;x=c[n>>2]|0;y=c[g>>2]|0;z=y+104|0;while(1){A=c[z>>2]|0;if((A|0)==0){break}else{z=A}}A=r-v+x|0;x=y+72|0;y=c[x>>2]|0;b:do{if((y|0)!=0){v=y;r=z;B=x;while(1){C=v;D=r;while(1){E=C+5|0;F=a[E]|0;if((F&3)==0){break}a[E]=F&255|8;c[B>>2]=c[C>>2];c[C>>2]=c[D>>2];c[D>>2]=C;F=c[B>>2]|0;if((F|0)==0){break b}else{E=C;C=F;D=E}}v=c[C>>2]|0;if((v|0)==0){break}else{r=D;B=C}}}}while(0);x=c[k+104>>2]|0;if((x|0)!=0){z=k+60|0;y=x;do{x=y+5|0;a[x]=a[z]&3|a[x]&184;Vf(k,y);y=c[y>>2]|0}while((y|0)!=0)}if((c[p>>2]|0)!=0){do{jg(k)}while((c[p>>2]|0)!=0)}y=c[n>>2]|0;while(1){z=c[u>>2]|0;c[u>>2]=0;x=0;B=z;c:while(1){z=B;do{if((z|0)==0){break c}r=z;z=c[z+24>>2]|0}while((mg(k,r)|0)==0);if((c[p>>2]|0)==0){x=1;B=z;continue}while(1){jg(k);if((c[p>>2]|0)==0){x=1;B=z;continue c}}}if((x|0)==0){break}}p=A-y|0;y=c[u>>2]|0;if((y|0)!=0){u=y;do{y=1<<d[u+7|0];A=c[u+16>>2]|0;B=A+(y<<5)|0;if((y|0)>0){y=A;do{A=y+8|0;do{if((c[A>>2]|0)!=0?(z=y+24|0,C=c[z>>2]|0,(C&64|0)!=0):0){D=c[y+16>>2]|0;if((C&15|0)==4){if((D|0)==0){break}if((a[D+5|0]&3)==0){break}Vf(k,D);break}else{C=D+5|0;if((a[C]&3)==0){break}c[A>>2]=0;if((a[C]&3)==0){break}c[z>>2]=11;break}}}while(0);y=y+32|0}while(y>>>0<B>>>0)}u=c[u+24>>2]|0}while((u|0)!=0)}u=c[q>>2]|0;if((u|0)!=0){B=u;do{u=1<<d[B+7|0];y=c[B+16>>2]|0;x=y+(u<<5)|0;if((u|0)>0){u=y;do{y=u+8|0;do{if((c[y>>2]|0)!=0?(A=u+24|0,z=c[A>>2]|0,(z&64|0)!=0):0){C=c[u+16>>2]|0;if((z&15|0)==4){if((C|0)==0){break}if((a[C+5|0]&3)==0){break}Vf(k,C);break}else{z=C+5|0;if((a[z]&3)==0){break}c[y>>2]=0;if((a[z]&3)==0){break}c[A>>2]=11;break}}}while(0);u=u+32|0}while(u>>>0<x>>>0)}B=c[B+24>>2]|0}while((B|0)!=0)}lg(k,c[o>>2]|0,s);lg(k,c[q>>2]|0,w);w=k+60|0;a[w]=d[w]^3;w=p+(c[n>>2]|0)|0;c[l>>2]=(c[l>>2]|0)+w;l=c[g>>2]|0;a[l+61|0]=2;c[l+64>>2]=0;n=l+72|0;p=0;do{p=p+1|0;G=cg(b,n,1)|0}while((G|0)==(n|0));c[l+80>>2]=G;G=l+68|0;n=0;do{n=n+1|0;H=cg(b,G,1)|0}while((H|0)==(G|0));c[l+76>>2]=H;m=((n+p|0)*5|0)+w|0;i=e;return m|0};case 2:{w=h+64|0;p=h+32|0;n=h+24|0;H=0;while(1){l=c[w>>2]|0;G=l+H|0;k=c[p>>2]|0;if((G|0)>=(k|0)){I=l;J=k;K=H;break}cg(b,(c[n>>2]|0)+(G<<2)|0,-3)|0;L=H+1|0;if((L|0)<80){H=L}else{M=96;break}}if((M|0)==96){I=c[w>>2]|0;J=c[p>>2]|0;K=L}L=I+K|0;c[w>>2]=L;if((L|0)>=(J|0)){a[j]=3}m=K*5|0;i=e;return m|0};case 5:{K=h+16|0;c[K>>2]=c[h+32>>2]<<2;J=h+84|0;L=h+172|0;c[J+0>>2]=0;c[J+4>>2]=0;c[J+8>>2]=0;c[J+12>>2]=0;c[J+16>>2]=0;J=c[L>>2]|0;if((J|0)!=0?!((a[J+5|0]&3)==0):0){Vf(h,J)}if((c[h+48>>2]&64|0)!=0?(J=c[h+40>>2]|0,!((a[J+5|0]&3)==0)):0){Vf(h,J)}kg(h);J=c[h+104>>2]|0;if((J|0)!=0){L=h+60|0;w=J;do{J=w+5|0;a[J]=a[L]&3|a[J]&184;Vf(h,w);w=c[w>>2]|0}while((w|0)!=0)}a[j]=0;m=c[K>>2]|0;i=e;return m|0};case 3:{K=h+80|0;w=c[K>>2]|0;if((w|0)==0){a[j]=4;m=0;i=e;return m|0}else{c[K>>2]=cg(b,w,80)|0;m=400;i=e;return m|0}break};case 4:{w=h+76|0;K=c[w>>2]|0;if((K|0)!=0){c[w>>2]=cg(b,K,80)|0;m=400;i=e;return m|0}c[f>>2]=c[h+172>>2];cg(b,f,1)|0;f=c[g>>2]|0;if((a[f+62|0]|0)!=1){g=(c[f+32>>2]|0)/2|0;if((c[f+28>>2]|0)>>>0<g>>>0){Li(b,g)}g=f+144|0;h=f+152|0;c[g>>2]=uh(b,c[g>>2]|0,c[h>>2]|0,0)|0;c[h>>2]=0}a[j]=5;m=5;i=e;return m|0};default:{m=0;i=e;return m|0}}return 0}function eg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;e=c[b+12>>2]|0;do{if((a[e+62|0]|0)==2){f=e+20|0;g=c[f>>2]|0;do{if((g|0)!=0){h=e+61|0;if((a[h]|0)!=5){do{dg(b)|0}while((a[h]|0)!=5)}a[h]=0;j=c[e+8>>2]|0;k=c[e+12>>2]|0;if((k+j|0)>>>0>(da(c[e+160>>2]|0,(g>>>0)/100|0)|0)>>>0){c[f>>2]=0;l=k;m=j;break}else{c[f>>2]=g;l=k;m=j;break}}else{hg(b,0);j=c[e+8>>2]|0;k=c[e+12>>2]|0;c[f>>2]=k+j;l=k;m=j}}while(0);f=m+l|0;g=(f|0)/100|0;j=c[e+156>>2]|0;if((j|0)<(2147483644/(g|0)|0|0)){n=da(j,g)|0}else{n=2147483644}zi(e,f-n|0);o=e+61|0}else{f=e+12|0;g=c[e+164>>2]|0;j=(g|0)<40?40:g;g=((c[f>>2]|0)/200|0)+1|0;if((g|0)<(2147483644/(j|0)|0|0)){p=da(g,j)|0}else{p=2147483644}g=e+61|0;k=p;do{k=k-(dg(b)|0)|0;q=(a[g]|0)==5;if(!((k|0)>-1600)){r=17;break}}while(!q);if((r|0)==17?!q:0){zi(e,((k|0)/(j|0)|0)*200|0);o=g;break}s=(c[e+20>>2]|0)/100|0;t=c[e+156>>2]|0;if((t|0)<(2147483644/(s|0)|0|0)){u=da(t,s)|0}else{u=2147483644}zi(e,(c[e+8>>2]|0)-u+(c[f>>2]|0)|0);o=g}}while(0);u=e+104|0;if((c[u>>2]|0)==0){i=d;return}else{v=0}while(1){if((v|0)>=4?(a[o]|0)!=5:0){r=26;break}fg(b,1);if((c[u>>2]|0)==0){r=26;break}else{v=v+1|0}}if((r|0)==26){i=d;return}}function fg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+32|0;g=f+16|0;h=f;j=c[b+12>>2]|0;k=j+104|0;l=c[k>>2]|0;c[k>>2]=c[l>>2];k=j+68|0;c[l>>2]=c[k>>2];c[k>>2]=l;k=l+5|0;m=d[k]|0;a[k]=m&239;if((d[j+61|0]|0)>=2){a[k]=a[j+60|0]&3|m&168}c[h>>2]=l;m=h+8|0;c[m>>2]=d[l+4|0]|0|64;l=Ij(b,h,2)|0;if((l|0)==0){i=f;return}k=l+8|0;if((c[k>>2]&15|0)!=6){i=f;return}n=b+41|0;o=a[n]|0;p=j+63|0;j=a[p]|0;a[n]=0;a[p]=0;q=b+8|0;r=c[q>>2]|0;s=l;l=c[s+4>>2]|0;t=r;c[t>>2]=c[s>>2];c[t+4>>2]=l;c[r+8>>2]=c[k>>2];k=c[q>>2]|0;r=h;h=c[r+4>>2]|0;l=k+16|0;c[l>>2]=c[r>>2];c[l+4>>2]=h;c[k+24>>2]=c[m>>2];m=c[q>>2]|0;c[q>>2]=m+32;k=Ff(b,6,0,m-(c[b+28>>2]|0)|0,0)|0;a[n]=o;a[p]=j;if((k|0)==0|(e|0)==0){i=f;return}if((k|0)!=2){u=k;sf(b,u)}k=c[q>>2]|0;if((c[k+ -8>>2]&15|0)==4){v=(c[k+ -16>>2]|0)+16|0}else{v=1648}c[g>>2]=v;Rh(b,1664,g)|0;u=5;sf(b,u)}function gg(b){b=b|0;var d=0,e=0;d=i;e=c[b+12>>2]|0;if((a[e+63|0]|0)==0){zi(e,-1600);i=d;return}else{eg(b);i=d;return}}function hg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;g=b+12|0;h=c[g>>2]|0;j=h+62|0;k=a[j]|0;l=(e|0)!=0;if(!l){a[j]=0;e=(c[g>>2]|0)+104|0;m=c[e>>2]|0;if((m|0)!=0){n=m;do{m=n+5|0;a[m]=a[m]&191;fg(b,1);n=c[e>>2]|0}while((n|0)!=0);if((a[j]|0)==2){o=7}else{o=6}}else{o=6}}else{a[j]=1;o=6}if((o|0)==6?(d[h+61|0]|0)<2:0){o=7}if((o|0)==7){o=c[g>>2]|0;a[o+61|0]=2;c[o+64>>2]=0;n=o+72|0;do{p=cg(b,n,1)|0}while((p|0)==(n|0));c[o+80>>2]=p;p=o+68|0;do{q=cg(b,p,1)|0}while((q|0)==(p|0));c[o+76>>2]=q}q=c[g>>2]|0;o=q+61|0;if((a[o]|0)==5){r=q;s=5}else{do{dg(b)|0}while((a[o]|0)!=5);o=c[g>>2]|0;r=o;s=a[o+61|0]|0}o=r+61|0;if((1<<(s&255)&-33|0)==0){do{dg(b)|0}while((1<<d[o]&-33|0)==0);o=c[g>>2]|0;t=o;u=a[o+61|0]|0}else{t=r;u=s}s=t+61|0;if(!(u<<24>>24==5)){do{dg(b)|0}while((a[s]|0)!=5)}if(k<<24>>24==2?(s=(c[g>>2]|0)+61|0,(a[s]|0)!=0):0){do{dg(b)|0}while((a[s]|0)!=0)}a[j]=k;k=c[h+8>>2]|0;j=c[h+12>>2]|0;s=(j+k|0)/100|0;u=c[h+156>>2]|0;if((u|0)<(2147483644/(s|0)|0|0)){v=da(u,s)|0}else{v=2147483644}zi(h,k-v+j|0);if(l){i=f;return}l=(c[g>>2]|0)+104|0;g=c[l>>2]|0;if((g|0)==0){i=f;return}else{w=g}do{g=w+5|0;a[g]=a[g]&191;fg(b,1);w=c[l>>2]|0}while((w|0)!=0);i=f;return}function ig(a,b){a=a|0;b=b|0;b=i;Af(a,(c[a+8>>2]|0)+ -32|0,0,0);i=b;return}function jg(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;e=i;f=b+84|0;g=c[f>>2]|0;h=g+5|0;a[h]=d[h]|4;switch(d[g+4|0]|0){case 5:{j=g+24|0;c[f>>2]=c[j>>2];k=g+8|0;l=c[k>>2]|0;do{if((l|0)!=0){if((a[l+6|0]&8)==0){m=Hj(l,3,c[b+196>>2]|0)|0;n=c[k>>2]|0;if((n|0)==0){o=m}else{p=m;q=n;r=5}}else{p=0;q=l;r=5}if((r|0)==5){if((a[q+5|0]&3)==0){o=p}else{Vf(b,q);o=p}}if(((o|0)!=0?(c[o+8>>2]&15|0)==4:0)?(n=(c[o>>2]|0)+16|0,m=xm(n,107)|0,s=(m|0)!=0,m=(xm(n,118)|0)==0,!(m&(s^1))):0){a[h]=a[h]&251;if(s){if(m){mg(b,g)|0;break}else{m=b+100|0;c[j>>2]=c[m>>2];c[m>>2]=g;break}}m=1<<d[g+7|0];s=c[g+16>>2]|0;n=s+(m<<5)|0;t=(c[g+28>>2]|0)>0|0;if((m|0)>0){m=t;u=s;while(1){s=u+8|0;v=u+24|0;w=(c[v>>2]&64|0)==0;do{if((c[s>>2]|0)==0){if(!w?!((a[(c[u+16>>2]|0)+5|0]&3)==0):0){c[v>>2]=11;x=m}else{x=m}}else{if(!w?(y=c[u+16>>2]|0,!((a[y+5|0]&3)==0)):0){Vf(b,y)}if((m|0)==0){y=c[s>>2]|0;if((y&64|0)!=0){z=c[u>>2]|0;if((y&15|0)!=4){x=(a[z+5|0]&3)!=0|0;break}if((z|0)!=0?!((a[z+5|0]&3)==0):0){Vf(b,z);x=0}else{x=0}}else{x=0}}else{x=m}}}while(0);s=u+32|0;if(s>>>0<n>>>0){m=x;u=s}else{A=x;break}}}else{A=t}if((A|0)==0){u=b+88|0;c[j>>2]=c[u>>2];c[u>>2]=g;break}else{u=b+92|0;c[j>>2]=c[u>>2];c[u>>2]=g;break}}else{r=33}}else{r=33}}while(0);if((r|0)==33){r=g+16|0;j=c[r>>2]|0;A=j+(1<<d[g+7|0]<<5)|0;x=g+28|0;o=c[x>>2]|0;if((o|0)>0){p=g+12|0;q=o;o=0;while(1){l=c[p>>2]|0;if((c[l+(o<<4)+8>>2]&64|0)!=0?(k=c[l+(o<<4)>>2]|0,!((a[k+5|0]&3)==0)):0){Vf(b,k);B=c[x>>2]|0}else{B=q}o=o+1|0;if((o|0)>=(B|0)){break}else{q=B}}C=c[r>>2]|0}else{C=j}if(C>>>0<A>>>0){j=C;do{C=j+8|0;r=c[C>>2]|0;B=j+24|0;q=(c[B>>2]&64|0)==0;if((r|0)==0){if(!q?!((a[(c[j+16>>2]|0)+5|0]&3)==0):0){c[B>>2]=11}}else{if(!q?(q=c[j+16>>2]|0,!((a[q+5|0]&3)==0)):0){Vf(b,q);D=c[C>>2]|0}else{D=r}if((D&64|0)!=0?(r=c[j>>2]|0,!((a[r+5|0]&3)==0)):0){Vf(b,r)}}j=j+32|0}while(j>>>0<A>>>0)}}E=(c[g+28>>2]<<4)+32+(32<<d[g+7|0])|0;break};case 6:{c[f>>2]=c[g+8>>2];A=c[g+12>>2]|0;if((A|0)!=0?!((a[A+5|0]&3)==0):0){Vf(b,A)}A=g+6|0;j=a[A]|0;if(j<<24>>24==0){F=j&255}else{D=j;j=0;while(1){r=c[g+(j<<2)+16>>2]|0;if((r|0)!=0?!((a[r+5|0]&3)==0):0){Vf(b,r);G=a[A]|0}else{G=D}r=j+1|0;C=G&255;if((r|0)<(C|0)){D=G;j=r}else{F=C;break}}}E=(F<<2)+16|0;break};case 8:{F=g+60|0;c[f>>2]=c[F>>2];j=b+88|0;c[F>>2]=c[j>>2];c[j>>2]=g;a[h]=a[h]&251;h=g+28|0;j=c[h>>2]|0;if((j|0)==0){E=1}else{F=g+8|0;G=c[F>>2]|0;if(j>>>0<G>>>0){D=G;G=j;while(1){if((c[G+8>>2]&64|0)!=0?(A=c[G>>2]|0,!((a[A+5|0]&3)==0)):0){Vf(b,A);H=c[F>>2]|0}else{H=D}A=G+16|0;if(A>>>0<H>>>0){D=H;G=A}else{I=A;break}}}else{I=j}if((a[b+61|0]|0)==1){j=g+32|0;G=(c[h>>2]|0)+(c[j>>2]<<4)|0;if(I>>>0<G>>>0){h=I;while(1){c[h+8>>2]=0;I=h+16|0;if(I>>>0<G>>>0){h=I}else{J=j;break}}}else{J=j}}else{J=g+32|0}E=(c[J>>2]<<4)+112|0}break};case 9:{c[f>>2]=c[g+72>>2];J=g+32|0;j=c[J>>2]|0;if((j|0)!=0?!((a[j+5|0]&3)==0):0){c[J>>2]=0}J=c[g+36>>2]|0;if((J|0)!=0?!((a[J+5|0]&3)==0):0){Vf(b,J)}J=g+44|0;j=c[J>>2]|0;if((j|0)>0){h=g+8|0;G=j;j=0;while(1){I=c[h>>2]|0;if((c[I+(j<<4)+8>>2]&64|0)!=0?(H=c[I+(j<<4)>>2]|0,!((a[H+5|0]&3)==0)):0){Vf(b,H);K=c[J>>2]|0}else{K=G}j=j+1|0;if((j|0)>=(K|0)){break}else{G=K}}}K=g+40|0;G=c[K>>2]|0;if((G|0)>0){j=g+28|0;h=G;G=0;while(1){H=c[(c[j>>2]|0)+(G<<3)>>2]|0;if((H|0)!=0?!((a[H+5|0]&3)==0):0){Vf(b,H);L=c[K>>2]|0}else{L=h}G=G+1|0;if((G|0)>=(L|0)){break}else{h=L}}}L=g+56|0;h=c[L>>2]|0;if((h|0)>0){G=g+16|0;j=h;H=0;while(1){I=c[(c[G>>2]|0)+(H<<2)>>2]|0;if((I|0)!=0?!((a[I+5|0]&3)==0):0){Vf(b,I);M=c[L>>2]|0}else{M=j}I=H+1|0;if((I|0)<(M|0)){j=M;H=I}else{N=M;break}}}else{N=h}h=g+60|0;M=c[h>>2]|0;if((M|0)>0){H=g+24|0;j=M;G=0;while(1){I=c[(c[H>>2]|0)+(G*12|0)>>2]|0;if((I|0)!=0?!((a[I+5|0]&3)==0):0){Vf(b,I);O=c[h>>2]|0}else{O=j}G=G+1|0;if((G|0)>=(O|0)){break}else{j=O}}P=O;Q=c[L>>2]|0}else{P=M;Q=N}E=(P*12|0)+80+(c[J>>2]<<4)+(c[K>>2]<<3)+((c[g+48>>2]|0)+Q+(c[g+52>>2]|0)<<2)|0;break};case 38:{c[f>>2]=c[g+8>>2];f=g+6|0;Q=a[f]|0;if(Q<<24>>24==0){R=Q&255}else{K=Q;Q=0;while(1){if((c[g+(Q<<4)+24>>2]&64|0)!=0?(J=c[g+(Q<<4)+16>>2]|0,!((a[J+5|0]&3)==0)):0){Vf(b,J);S=a[f]|0}else{S=K}J=Q+1|0;P=S&255;if((J|0)<(P|0)){K=S;Q=J}else{R=P;break}}}E=(R<<4)+16|0;break};default:{i=e;return}}R=b+16|0;c[R>>2]=(c[R>>2]|0)+E;i=e;return}function kg(b){b=b|0;var d=0,e=0;d=i;e=c[b+252>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+256>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+260>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+264>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+268>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+272>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+276>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+280>>2]|0;if((e|0)!=0?!((a[e+5|0]&3)==0):0){Vf(b,e)}e=c[b+284>>2]|0;if((e|0)==0){i=d;return}if((a[e+5|0]&3)==0){i=d;return}Vf(b,e);i=d;return}function lg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;if((e|0)==(f|0)){i=g;return}else{h=e}do{e=h+16|0;j=c[e>>2]|0;k=j+(1<<(d[h+7|0]|0)<<5)|0;l=h+28|0;if((c[l>>2]|0)>0){m=h+12|0;n=0;do{o=c[m>>2]|0;p=o+(n<<4)+8|0;q=c[p>>2]|0;do{if((q&64|0)!=0){r=c[o+(n<<4)>>2]|0;if((q&15|0)!=4){if((a[r+5|0]&3)==0){break}c[p>>2]=0;break}if((r|0)!=0?!((a[r+5|0]&3)==0):0){Vf(b,r)}}}while(0);n=n+1|0}while((n|0)<(c[l>>2]|0));s=c[e>>2]|0}else{s=j}if(s>>>0<k>>>0){l=s;do{n=l+8|0;m=c[n>>2]|0;do{if(!((m|0)==0|(m&64|0)==0)){p=c[l>>2]|0;if((m&15|0)==4){if((p|0)==0){break}if((a[p+5|0]&3)==0){break}Vf(b,p);break}if((!((a[p+5|0]&3)==0)?(c[n>>2]=0,p=l+24|0,(c[p>>2]&64|0)!=0):0)?!((a[(c[l+16>>2]|0)+5|0]&3)==0):0){c[p>>2]=11}}}while(0);l=l+32|0}while(l>>>0<k>>>0)}h=c[h+24>>2]|0}while((h|0)!=(f|0));i=g;return}function mg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;g=e+16|0;h=c[g>>2]|0;j=h+(1<<(d[e+7|0]|0)<<5)|0;k=e+28|0;l=c[k>>2]|0;if((l|0)>0){m=e+12|0;n=l;l=0;o=0;while(1){p=c[m>>2]|0;if((c[p+(l<<4)+8>>2]&64|0)!=0?(q=c[p+(l<<4)>>2]|0,!((a[q+5|0]&3)==0)):0){Vf(b,q);r=c[k>>2]|0;s=1}else{r=n;s=o}l=l+1|0;if((l|0)>=(r|0)){break}else{n=r;o=s}}t=c[g>>2]|0;u=s}else{t=h;u=0}if(t>>>0<j>>>0){h=0;s=u;g=t;t=0;while(1){o=g+8|0;r=c[o>>2]|0;n=g+24|0;l=c[n>>2]|0;k=(l&64|0)==0;a:do{if((r|0)==0){if(!k?!((a[(c[g+16>>2]|0)+5|0]&3)==0):0){c[n>>2]=11;v=h;w=s;x=t}else{v=h;w=s;x=t}}else{do{if(k){y=r;z=18}else{m=c[g+16>>2]|0;if((l&15|0)==4){if((m|0)==0){y=r;z=18;break}if((a[m+5|0]&3)==0){y=r;z=18;break}Vf(b,m);y=c[o>>2]|0;z=18;break}q=(r&64|0)==0;if((a[m+5|0]&3)==0){if(q){v=h;w=s;x=t;break a}else{break}}if(q){v=1;w=s;x=t;break a}v=1;w=s;x=(a[(c[g>>2]|0)+5|0]&3)==0?t:1;break a}}while(0);if((z|0)==18?(z=0,(y&64|0)==0):0){v=h;w=s;x=t;break}q=c[g>>2]|0;if((a[q+5|0]&3)==0){v=h;w=s;x=t}else{Vf(b,q);v=h;w=1;x=t}}}while(0);g=g+32|0;if(!(g>>>0<j>>>0)){break}else{h=v;s=w;t=x}}if((x|0)!=0){x=b+96|0;c[e+24>>2]=c[x>>2];c[x>>2]=e;A=w;i=f;return A|0}if((v|0)==0){B=w}else{v=b+100|0;c[e+24>>2]=c[v>>2];c[v>>2]=e;A=w;i=f;return A|0}}else{B=u}u=b+88|0;c[e+24>>2]=c[u>>2];c[u>>2]=e;A=B;i=f;return A|0}function ng(a){a=a|0;var b=0;b=i;Xe(a,1712,144,1);Vc(a,-2);Xe(a,1720,145,1);Vc(a,-2);Xe(a,1728,146,1);Vc(a,-2);Xe(a,1744,147,1);Vc(a,-2);Xe(a,1752,148,1);Vc(a,-2);Xe(a,1760,149,1);Vc(a,-2);Xe(a,1768,150,1);Vc(a,-2);Xe(a,1776,151,1);Vc(a,-2);Xe(a,1784,152,1);Vc(a,-2);Xe(a,1792,153,1);Vc(a,-2);Xe(a,1800,154,1);Vc(a,-2);We(a,-1001e3,1696)|0;Vc(a,-2);i=b;return}function og(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;Gd(a,0,11);Ve(a,1808,0);me(a,1960)|0;_c(a,-1);Ld(a,-2,2e3);Ve(a,2008,0);Vc(a,-2);d=c[q>>2]|0;e=ae(a,8)|0;f=e+4|0;c[f>>2]=0;ne(a,1960);c[e>>2]=d;c[f>>2]=155;_c(a,-1);Ld(a,-1001e3,1904);Ld(a,-2,1920);f=c[r>>2]|0;d=ae(a,8)|0;e=d+4|0;c[e>>2]=0;ne(a,1960);c[d>>2]=f;c[e>>2]=155;_c(a,-1);Ld(a,-1001e3,1928);Ld(a,-2,1944);e=c[p>>2]|0;f=ae(a,8)|0;d=f+4|0;c[d>>2]=0;ne(a,1960);c[f>>2]=e;c[d>>2]=155;Ld(a,-2,1952);i=b;return 1}function pg(a){a=a|0;var b=0;b=i;c[(pe(a,1,1960)|0)+4>>2]=155;pd(a);td(a,1968,26)|0;i=b;return 2}function qg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;if(($c(a,1)|0)==-1){Dd(a,-1001e3,1928)}if((c[(pe(a,1,1960)|0)+4>>2]|0)==0){he(a,2208,b)|0}d=(pe(a,1,1960)|0)+4|0;e=c[d>>2]|0;c[d>>2]=0;d=rc[e&255](a)|0;i=b;return d|0}function rg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=pe(a,1,1960)|0;if((c[d+4>>2]|0)==0){he(a,2208,b)|0}e=ke(a,(_b(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function sg(a){a=a|0;var b=0;b=i;i=i+16|0;if((c[(pe(a,1,1960)|0)+4>>2]|0)==0){he(a,2208,b)|0}Cg(a,0);i=b;return 1}function tg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=pe(a,1,1960)|0;if((c[d+4>>2]|0)==0){he(a,2208,b)|0}e=Ag(a,c[d>>2]|0,2)|0;i=b;return e|0}function ug(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0,h=0;b=i;i=i+16|0;d=pe(a,1,1960)|0;if((c[d+4>>2]|0)==0){he(a,2208,b)|0}e=c[d>>2]|0;d=qe(a,2,2336,2312)|0;f=+xe(a,3,0.0);g=~~f;if(!(+(g|0)==f)){ge(a,3,2352)|0}if((Gb(e|0,g|0,c[2296+(d<<2)>>2]|0)|0)==0){qd(a,+(La(e|0)|0));h=1;i=b;return h|0}else{h=ke(a,0,0)|0;i=b;return h|0}return 0}function vg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;d=pe(a,1,1960)|0;if((c[d+4>>2]|0)==0){he(a,2208,b)|0}e=c[d>>2]|0;d=qe(a,2,0,2256)|0;f=Ae(a,3,1024)|0;g=ke(a,(Va(e|0,0,c[2240+(d<<2)>>2]|0,f|0)|0)==0|0,0)|0;i=b;return g|0}function wg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=pe(a,1,1960)|0;if((c[d+4>>2]|0)==0){he(a,2208,b)|0}e=c[d>>2]|0;_c(a,1);d=zg(a,e,2)|0;i=b;return d|0}function xg(a){a=a|0;var b=0,d=0,e=0;b=i;d=pe(a,1,1960)|0;if((c[d+4>>2]|0)==0){i=b;return 0}if((c[d>>2]|0)==0){i=b;return 0}d=(pe(a,1,1960)|0)+4|0;e=c[d>>2]|0;c[d>>2]=0;rc[e&255](a)|0;i=b;return 0}function yg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;e=pe(a,1,1960)|0;if((c[e+4>>2]|0)==0){td(a,2168,13)|0;i=b;return 1}else{c[d>>2]=c[e>>2];wd(a,2184,d)|0;i=b;return 1}return 0}function zg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0.0,q=0;e=i;i=i+16|0;f=e;g=e+8|0;j=Uc(a)|0;if((j|0)==(d|0)){l=1;i=e;return l|0}m=d;n=j-d|0;d=1;while(1){n=n+ -1|0;if(($c(a,m)|0)==3){if((d|0)==0){o=0}else{p=+gd(a,m,0);h[k>>3]=p;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];o=(ob(b|0,2200,f|0)|0)>0}}else{j=se(a,m,g)|0;if((d|0)==0){o=0}else{q=mb(j|0,1,c[g>>2]|0,b|0)|0;o=(q|0)==(c[g>>2]|0)}}if((n|0)==0){break}else{m=m+1|0;d=o&1}}if(o){l=1;i=e;return l|0}l=ke(a,0,0)|0;i=e;return l|0}function Ag(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+1056|0;g=f+8|0;j=f;k=Uc(b)|0;kc(d|0);a:do{if((k|0)==1){l=e+1|0;m=Bg(b,d,1)|0}else{te(b,k+19|0,2384);n=g+8|0;o=g+8|0;p=k+ -2|0;q=e;b:while(1){do{if(($c(b,q)|0)==3){r=hd(b,q,0)|0;if((r|0)==0){s=sb(d|0)|0;Yb(s|0,d|0)|0;td(b,0,0)|0;t=(s|0)!=-1|0;break}else{He(b,g);s=sa(Be(g,r)|0,1,r|0,d|0)|0;c[n>>2]=(c[n>>2]|0)+s;Ee(g);t=(s|0)!=0|0;break}}else{s=kd(b,q,0)|0;if(!((s|0)!=0?(a[s]|0)==42:0)){ge(b,q,2408)|0}r=a[s+1|0]|0;if((r|0)==76){t=Bg(b,d,0)|0;break}else if((r|0)==108){t=Bg(b,d,1)|0;break}else if((r|0)==110){c[g>>2]=j;if((ab(d|0,2440,g|0)|0)!=1){u=14;break b}qd(b,+h[j>>3]);t=1;break}else if((r|0)==97){He(b,g);r=sa(Be(g,1024)|0,1,1024,d|0)|0;c[o>>2]=(c[o>>2]|0)+r;if(!(r>>>0<1024)){r=1024;do{r=r<<(r>>>0<1073741824);s=sa(Be(g,r)|0,1,r|0,d|0)|0;c[o>>2]=(c[o>>2]|0)+s}while(!(s>>>0<r>>>0))}Ee(g);t=1;break}else{break b}}}while(0);r=q+1|0;if((p|0)==0|(t|0)==0){l=r;m=t;break a}else{p=p+ -1|0;q=r}}if((u|0)==14){pd(b);l=q+1|0;m=0;break}v=ge(b,q,2424)|0;i=f;return v|0}}while(0);if((Da(d|0)|0)!=0){v=ke(b,0,0)|0;i=f;return v|0}if((m|0)==0){Vc(b,-2);pd(b)}v=l-e|0;i=f;return v|0}function Bg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+1040|0;g=f;He(b,g);h=Be(g,1024)|0;a:do{if((dc(h|0,1024,d|0)|0)!=0){j=g+8|0;k=h;while(1){l=Zm(k|0)|0;if((l|0)!=0?(a[k+(l+ -1)|0]|0)==10:0){break}c[j>>2]=(c[j>>2]|0)+l;k=Be(g,1024)|0;if((dc(k|0,1024,d|0)|0)==0){break a}}c[j>>2]=l-e+(c[j>>2]|0);Ee(g);m=1;i=f;return m|0}}while(0);Ee(g);m=(ld(b,-1)|0)!=0|0;i=f;return m|0}function Cg(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=i;d=Uc(a)|0;e=d+ -1|0;if((d|0)>=19){ge(a,17,2448)|0}_c(a,1);rd(a,e);yd(a,b);if((d|0)>=2){b=1;do{f=b;b=b+1|0;_c(a,b)}while((f|0)<(e|0))}xd(a,156,d+2|0);i=c;return}function Dg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b;e=md(a,-1001001)|0;f=hd(a,-1001002,0)|0;if((c[e+4>>2]|0)==0){g=he(a,2472,d)|0;i=b;return g|0}Vc(a,1);if((f|0)>=1){h=1;while(1){_c(a,-1001003-h|0);if((h|0)==(f|0)){break}else{h=h+1|0}}}h=Ag(a,c[e>>2]|0,2)|0;if(($c(a,0-h|0)|0)!=0){g=h;i=b;return g|0}if((h|0)>1){c[d>>2]=kd(a,1-h|0,0)|0;g=he(a,2496,d)|0;i=b;return g|0}if((jd(a,-1001003)|0)==0){g=0;i=b;return g|0}Vc(a,0);_c(a,-1001001);d=(pe(a,1,1960)|0)+4|0;h=c[d>>2]|0;c[d>>2]=0;rc[h&255](a)|0;g=0;i=b;return g|0}function Eg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;Dd(a,-1001e3,1928);e=md(a,-1)|0;if((c[e+4>>2]|0)==0){c[d>>2]=1932;he(a,2552,d)|0}d=ke(a,(_b(c[e>>2]|0)|0)==0|0,0)|0;i=b;return d|0}function Fg(a){a=a|0;var b=0;b=i;Qg(a,1904,2608);i=b;return 1}function Gg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b;if(($c(a,1)|0)==-1){pd(a)}if(($c(a,1)|0)==0){Dd(a,-1001e3,1904);Yc(a,1);if((c[(pe(a,1,1960)|0)+4>>2]|0)!=0){e=0;Cg(a,e);i=b;return 1}he(a,2208,d)|0;e=0;Cg(a,e);i=b;return 1}else{f=se(a,1,0)|0;g=ae(a,8)|0;h=g+4|0;c[h>>2]=0;ne(a,1960);c[g>>2]=0;c[h>>2]=157;h=Tb(f|0,2608)|0;c[g>>2]=h;if((h|0)==0){h=mc(c[(jc()|0)>>2]|0)|0;c[d>>2]=f;c[d+4>>2]=h;he(a,2648,d)|0}Yc(a,1);e=1;Cg(a,e);i=b;return 1}return 0}function Hg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=se(b,1,0)|0;f=re(b,2,2608,0)|0;g=ae(b,8)|0;h=g+4|0;c[h>>2]=0;ne(b,1960);c[g>>2]=0;c[h>>2]=157;h=a[f]|0;if(!((!(h<<24>>24==0)?(j=f+1|0,(vm(2680,h<<24>>24,4)|0)!=0):0)?(h=(a[j]|0)==43?f+2|0:j,(a[(a[h]|0)==98?h+1|0:h]|0)==0):0)){ge(b,2,2688)|0}h=Tb(e|0,f|0)|0;c[g>>2]=h;if((h|0)!=0){k=1;i=d;return k|0}k=ke(b,0,e)|0;i=d;return k|0}function Ig(a){a=a|0;var b=0;b=i;Qg(a,1928,2640);i=b;return 1}function Jg(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=se(a,1,0)|0;re(a,2,2608,0)|0;e=ae(a,8)|0;f=e+4|0;c[f>>2]=0;ne(a,1960);he(a,2616,b)|0;c[e>>2]=0;c[f>>2]=158;f=ke(a,0,d)|0;i=b;return f|0}function Kg(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;Dd(a,-1001e3,1904);e=md(a,-1)|0;if((c[e+4>>2]|0)==0){c[d>>2]=1908;he(a,2552,d)|0}d=Ag(a,c[e>>2]|0,1)|0;i=b;return d|0}function Lg(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=ae(a,8)|0;e=d+4|0;c[e>>2]=0;ne(a,1960);c[d>>2]=0;c[e>>2]=157;e=Qa()|0;c[d>>2]=e;if((e|0)!=0){f=1;i=b;return f|0}f=ke(a,0,0)|0;i=b;return f|0}function Mg(a){a=a|0;var b=0,d=0;b=i;ve(a,1);d=oe(a,1,1960)|0;if((d|0)==0){pd(a);i=b;return 1}if((c[d+4>>2]|0)==0){td(a,2584,11)|0;i=b;return 1}else{td(a,2600,4)|0;i=b;return 1}return 0}function Ng(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;Dd(a,-1001e3,1928);e=md(a,-1)|0;if((c[e+4>>2]|0)==0){c[d>>2]=1932;he(a,2552,d)|0}d=zg(a,c[e>>2]|0,1)|0;i=b;return d|0}function Og(a){a=a|0;var b=0,d=0;b=i;d=ke(a,(Jb(c[(pe(a,1,1960)|0)>>2]|0)|0)==0|0,0)|0;i=b;return d|0}function Pg(a){a=a|0;var b=0,c=0;b=i;pe(a,1,1960)|0;c=le(a,-1)|0;i=b;return c|0}function Qg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+16|0;f=e;if(($c(a,1)|0)<1){Dd(a,-1001e3,b);i=e;return}g=kd(a,1,0)|0;if((g|0)!=0){h=ae(a,8)|0;j=h+4|0;c[j>>2]=0;ne(a,1960);c[h>>2]=0;c[j>>2]=157;j=Tb(g|0,d|0)|0;c[h>>2]=j;if((j|0)==0){j=mc(c[(jc()|0)>>2]|0)|0;c[f>>2]=g;c[f+4>>2]=j;he(a,2648,f)|0}}else{if((c[(pe(a,1,1960)|0)+4>>2]|0)==0){he(a,2208,f)|0}_c(a,1)}Ld(a,-1001e3,b);Dd(a,-1001e3,b);i=e;return}function Rg(a){a=a|0;var b=0;b=i;Gd(a,0,28);Ve(a,2704,0);qd(a,3.141592653589793);Ld(a,-2,2936);qd(a,x);Ld(a,-2,2944);i=b;return 1}function Sg(a){a=a|0;var b=0;b=i;qd(a,+S(+(+we(a,1))));i=b;return 1}function Tg(a){a=a|0;var b=0;b=i;qd(a,+Y(+(+we(a,1))));i=b;return 1}function Ug(a){a=a|0;var b=0;b=i;qd(a,+Z(+(+we(a,1))));i=b;return 1}function Vg(a){a=a|0;var b=0,c=0.0;b=i;c=+we(a,1);qd(a,+$(+c,+(+we(a,2))));i=b;return 1}function Wg(a){a=a|0;var b=0;b=i;qd(a,+_(+(+we(a,1))));i=b;return 1}function Xg(a){a=a|0;var b=0;b=i;qd(a,+ca(+(+we(a,1))));i=b;return 1}function Yg(a){a=a|0;var b=0;b=i;qd(a,+Wb(+(+we(a,1))));i=b;return 1}function Zg(a){a=a|0;var b=0;b=i;qd(a,+V(+(+we(a,1))));i=b;return 1}function _g(a){a=a|0;var b=0;b=i;qd(a,+we(a,1)/.017453292519943295);i=b;return 1}function $g(a){a=a|0;var b=0;b=i;qd(a,+aa(+(+we(a,1))));i=b;return 1}function ah(a){a=a|0;var b=0;b=i;qd(a,+R(+(+we(a,1))));i=b;return 1}function bh(a){a=a|0;var b=0,c=0.0;b=i;c=+we(a,1);qd(a,+tb(+c,+(+we(a,2))));i=b;return 1}function ch(a){a=a|0;var b=0,d=0;b=i;i=i+16|0;d=b;qd(a,+qa(+(+we(a,1)),d|0));rd(a,c[d>>2]|0);i=b;return 2}function dh(a){a=a|0;var b=0,c=0.0;b=i;c=+we(a,1);qd(a,+um(c,ye(a,2)|0));i=b;return 1}function eh(a){a=a|0;var b=0;b=i;qd(a,+ta(+(+we(a,1))));i=b;return 1}function fh(a){a=a|0;var b=0,c=0.0,d=0.0,e=0.0;b=i;c=+we(a,1);do{if(($c(a,2)|0)>=1){d=+we(a,2);if(d==10.0){e=+ta(+c);break}else{e=+ba(+c)/+ba(+d);break}}else{e=+ba(+c)}}while(0);qd(a,e);i=b;return 1}function gh(a){a=a|0;var b=0,c=0,d=0.0,e=0.0,f=0.0,g=0,h=0.0;b=i;c=Uc(a)|0;d=+we(a,1);if((c|0)<2){e=d}else{f=d;g=2;while(1){d=+we(a,g);h=d>f?d:f;if((g|0)==(c|0)){e=h;break}else{f=h;g=g+1|0}}}qd(a,e);i=b;return 1}function hh(a){a=a|0;var b=0,c=0,d=0.0,e=0.0,f=0.0,g=0,h=0.0;b=i;c=Uc(a)|0;d=+we(a,1);if((c|0)<2){e=d}else{f=d;g=2;while(1){d=+we(a,g);h=d<f?d:f;if((g|0)==(c|0)){e=h;break}else{f=h;g=g+1|0}}}qd(a,e);i=b;return 1}function ih(a){a=a|0;var b=0,c=0,d=0.0;b=i;i=i+16|0;c=b;d=+Za(+(+we(a,1)),c|0);qd(a,+h[c>>3]);qd(a,d);i=b;return 2}function jh(a){a=a|0;var b=0,c=0.0;b=i;c=+we(a,1);qd(a,+U(+c,+(+we(a,2))));i=b;return 1}function kh(a){a=a|0;var b=0;b=i;qd(a,+we(a,1)*.017453292519943295);i=b;return 1}function lh(a){a=a|0;var b=0,c=0,d=0.0,e=0,f=0.0,g=0.0,h=0;b=i;i=i+16|0;c=b;d=+((Wm()|0)%2147483647|0|0)/2147483647.0;e=Uc(a)|0;if((e|0)==2){f=+we(a,1);g=+we(a,2);if(!(f<=g)){ge(a,2,3184)|0}qd(a,f+ +R(+(d*(g-f+1.0))));h=1;i=b;return h|0}else if((e|0)==1){f=+we(a,1);if(!(f>=1.0)){ge(a,1,3184)|0}qd(a,+R(+(d*f))+1.0);h=1;i=b;return h|0}else if((e|0)==0){qd(a,d);h=1;i=b;return h|0}else{h=he(a,3208,c)|0;i=b;return h|0}return 0}function mh(a){a=a|0;var b=0;b=i;db(ze(a,1)|0);Wm()|0;i=b;return 0}function nh(a){a=a|0;var b=0;b=i;qd(a,+Aa(+(+we(a,1))));i=b;return 1}function oh(a){a=a|0;var b=0;b=i;qd(a,+W(+(+we(a,1))));i=b;return 1}function ph(a){a=a|0;var b=0;b=i;qd(a,+T(+(+we(a,1))));i=b;return 1}function qh(a){a=a|0;var b=0;b=i;qd(a,+Ga(+(+we(a,1))));i=b;return 1}function rh(a){a=a|0;var b=0;b=i;qd(a,+X(+(+we(a,1))));i=b;return 1}function sh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+16|0;k=j;l=c[e>>2]|0;if((l|0)>=((g|0)/2|0|0)){if((l|0)<(g|0)){m=g}else{c[k>>2]=h;c[k+4>>2]=g;nf(b,3240,k)}}else{k=l<<1;m=(k|0)<4?4:k}if((m+1|0)>>>0>(4294967293/(f>>>0)|0)>>>0){th(b)}k=da(l,f)|0;l=da(m,f)|0;f=c[b+12>>2]|0;g=(d|0)!=0;h=f+4|0;n=vc[c[f>>2]&3](c[h>>2]|0,d,k,l)|0;if((n|0)!=0|(l|0)==0){o=n;p=f+12|0;q=c[p>>2]|0;r=0-k|0;s=g?r:0;t=s+l|0;u=t+q|0;c[p>>2]=u;c[e>>2]=m;i=j;return o|0}if((a[f+63|0]|0)==0){sf(b,4)}hg(b,1);n=vc[c[f>>2]&3](c[h>>2]|0,d,k,l)|0;if((n|0)==0){sf(b,4)}else{o=n;p=f+12|0;q=c[p>>2]|0;r=0-k|0;s=g?r:0;t=s+l|0;u=t+q|0;c[p>>2]=u;c[e>>2]=m;i=j;return o|0}return 0}function th(a){a=a|0;var b=0;b=i;i=i+16|0;nf(a,3272,b)}function uh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;h=c[b+12>>2]|0;j=(d|0)!=0;k=h+4|0;l=vc[c[h>>2]&3](c[k>>2]|0,d,e,f)|0;if(!((l|0)!=0|(f|0)==0)){if((a[h+63|0]|0)==0){sf(b,4)}hg(b,1);m=vc[c[h>>2]&3](c[k>>2]|0,d,e,f)|0;if((m|0)==0){sf(b,4)}else{n=m}}else{n=l}l=h+12|0;c[l>>2]=(j?0-e|0:0)+f+(c[l>>2]|0);i=g;return n|0}function vh(a){a=a|0;var b=0;b=i;We(a,-1001e3,3312)|0;Gd(a,0,1);xd(a,159,0);Ld(a,-2,3320);Od(a,-2)|0;Gd(a,0,3);Ve(a,3328,0);Gd(a,4,0);_c(a,-2);xd(a,160,1);Nd(a,-2,1);_c(a,-2);xd(a,161,1);Nd(a,-2,2);_c(a,-2);xd(a,162,1);Nd(a,-2,3);_c(a,-2);xd(a,163,1);Nd(a,-2,4);_c(a,-1);Ld(a,-3,3360);Ld(a,-2,3368);xh(a,3384,3392,3408,3424);xh(a,3568,3576,3592,3608);td(a,3680,10)|0;Ld(a,-2,3696);We(a,-1001e3,3704)|0;Ld(a,-2,3712);We(a,-1001e3,3720)|0;Ld(a,-2,3736);Fd(a,-1001e3,2);_c(a,-2);Ve(a,3744,1);Vc(a,-2);i=b;return 1}function wh(a){a=a|0;var b=0,c=0,d=0;b=i;c=Qe(a,1)|0;if((c|0)>0){d=c}else{i=b;return 0}do{Fd(a,1,d);Vc(a,-2);d=d+ -1|0}while((d|0)>0);i=b;return 0}function xh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=Ib(c|0)|0;if((g|0)==0){c=Ib(d|0)|0;if((c|0)!=0){h=c;j=3}}else{h=g;j=3}if((j|0)==3?(Dd(a,-1001e3,3960),j=jd(a,-1)|0,Vc(a,-2),(j|0)==0):0){Ye(a,Ye(a,h,3936,3944)|0,3952,e)|0;Wc(a,-2);Ld(a,-2,b);i=f;return}ud(a,e)|0;Ld(a,-2,b);i=f;return}function yh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+112|0;c=b;d=b+4|0;e=se(a,1,0)|0;f=Uc(a)|0;Se(a,e,1);Dd(a,-1,3856);g=($c(a,-1)|0)==0;Vc(a,-2);if(g){_c(a,-1);Ld(a,-2,3912);ud(a,e)|0;Ld(a,-2,3856);g=Bm(e,46)|0;td(a,e,((g|0)==0?e:g+1|0)-e|0)|0;Ld(a,-2,3920)}_c(a,-1);if(!(((ff(a,1,d)|0)!=0?(kf(a,3864,d)|0)!=0:0)?(bd(a,-1)|0)==0:0)){he(a,3872,c)|0}_c(a,-2);ce(a,-2,1)|0;Vc(a,-2);if((f|0)<2){i=b;return 1}else{h=2}while(1){if(($c(a,h)|0)==6){_c(a,h);_c(a,-2);Rd(a,1,0,0,0)}if((h|0)==(f|0)){break}else{h=h+1|0}}i=b;return 1}function zh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+1056|0;d=b;e=b+8|0;f=se(a,1,0)|0;Vc(a,1);Dd(a,-1001e3,3704);Dd(a,2,f);if((jd(a,-1)|0)!=0){i=b;return 1}Vc(a,-2);He(a,e);Dd(a,-1001001,3368);if(($c(a,3)|0)==5){g=1}else{he(a,3784,d)|0;g=1}while(1){Fd(a,3,g);if(($c(a,-1)|0)==0){Vc(a,-2);Ee(e);h=kd(a,-1,0)|0;c[d>>2]=f;c[d+4>>2]=h;he(a,3824,d)|0}ud(a,f)|0;Rd(a,1,2,0,0);if(($c(a,-2)|0)==6){break}if((dd(a,-2)|0)==0){Vc(a,-3)}else{Vc(a,-2);Ge(e)}g=g+1|0}ud(a,f)|0;Xc(a,-2);Rd(a,2,1,0,0);if(($c(a,-1)|0)!=0){Ld(a,2,f)}Dd(a,2,f);if(($c(a,-1)|0)!=0){i=b;return 1}yd(a,1);_c(a,-1);Ld(a,2,f);i=b;return 1}function Ah(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;e=se(a,1,0)|0;Dd(a,-1001e3,3720);Dd(a,-1,e);if(($c(a,-1)|0)!=0){i=b;return 1}c[d>>2]=e;wd(a,4224,d)|0;i=b;return 1}function Bh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b;e=se(a,1,0)|0;Dd(a,-1001001,3384);f=kd(a,-1,0)|0;if((f|0)==0){c[d>>2]=3384;he(a,4160,d)|0}g=Gh(a,e,f,4064,3976)|0;if((g|0)==0){h=1;i=b;return h|0}if((Je(a,g,0)|0)==0){ud(a,g)|0;h=2;i=b;return h|0}else{f=kd(a,1,0)|0;e=kd(a,-1,0)|0;c[d>>2]=f;c[d+4>>2]=g;c[d+8>>2]=e;h=he(a,4016,d)|0;i=b;return h|0}return 0}function Ch(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b;e=se(a,1,0)|0;Dd(a,-1001001,3568);f=kd(a,-1,0)|0;if((f|0)==0){c[d>>2]=3568;he(a,4160,d)|0}g=Gh(a,e,f,4064,3976)|0;if((g|0)==0){h=1;i=b;return h|0}if((Eh(a,g,e)|0)==0){ud(a,g)|0;h=2;i=b;return h|0}else{e=kd(a,1,0)|0;f=kd(a,-1,0)|0;c[d>>2]=e;c[d+4>>2]=g;c[d+8>>2]=f;h=he(a,4016,d)|0;i=b;return h|0}return 0}function Dh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+16|0;d=b;e=se(a,1,0)|0;f=xm(e,46)|0;if((f|0)==0){g=0;i=b;return g|0}td(a,e,f-e|0)|0;f=kd(a,-1,0)|0;Dd(a,-1001001,3568);h=kd(a,-1,0)|0;if((h|0)==0){c[d>>2]=3568;he(a,4160,d)|0}j=Gh(a,f,h,4064,3976)|0;if((j|0)==0){g=1;i=b;return g|0}h=Eh(a,j,e)|0;if((h|0)==0){ud(a,j)|0;g=2;i=b;return g|0}else if((h|0)==2){c[d>>2]=e;c[d+4>>2]=j;wd(a,3984,d)|0;g=1;i=b;return g|0}else{e=kd(a,1,0)|0;h=kd(a,-1,0)|0;c[d>>2]=e;c[d+4>>2]=j;c[d+8>>2]=h;g=he(a,4016,d)|0;i=b;return g|0}return 0}function Eh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e;g=Ye(a,d,4064,4072)|0;d=xm(g,45)|0;do{if((d|0)!=0){c[f>>2]=td(a,g,d-g|0)|0;h=Fh(a,b,wd(a,4080,f)|0)|0;if((h|0)==2){j=d+1|0;break}else{k=h;i=e;return k|0}}else{j=g}}while(0);c[f>>2]=j;k=Fh(a,b,wd(a,4080,f)|0)|0;i=e;return k|0}function Fh(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;e=i;Dd(b,-1001e3,3312);Dd(b,-1,c);c=md(b,-1)|0;Vc(b,-3);if((c|0)==0){td(b,4096,58)|0;f=1;i=e;return f|0}if((a[d]|0)==42){yd(b,1);f=0;i=e;return f|0}else{td(b,4096,58)|0;f=2;i=e;return f|0}return 0}function Gh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+1056|0;j=h;k=h+8|0;He(b,k);if((a[f]|0)==0){l=d}else{l=Ye(b,d,f,g)|0}g=e;while(1){e=a[g]|0;if(e<<24>>24==0){m=12;break}else if(e<<24>>24==59){g=g+1|0;continue}e=xm(g,59)|0;if((e|0)==0){n=g+(Zm(g|0)|0)|0}else{n=e}td(b,g,n-g|0)|0;if((n|0)==0){m=12;break}o=Ye(b,kd(b,-1,0)|0,4192,l)|0;Wc(b,-2);p=Tb(o|0,4216)|0;if((p|0)!=0){m=10;break}c[j>>2]=o;wd(b,4200,j)|0;Wc(b,-2);Ge(k);g=n}if((m|0)==10){Jb(p|0)|0;q=o;i=h;return q|0}else if((m|0)==12){Ee(k);q=0;i=h;return q|0}return 0}function Hh(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=se(a,1,0)|0;d=Fh(a,c,se(a,2,0)|0)|0;if((d|0)==0){e=1;i=b;return e|0}pd(a);Xc(a,-2);ud(a,(d|0)==1?4304:4312)|0;e=3;i=b;return e|0}function Ih(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=se(a,1,0)|0;d=se(a,2,0)|0;e=re(a,3,4064,0)|0;if((Gh(a,c,d,e,re(a,4,3976,0)|0)|0)!=0){f=1;i=b;return f|0}pd(a);Xc(a,-2);f=2;i=b;return f|0}function Jh(a){a=a|0;var b=0;b=i;ue(a,1,5);if((Hd(a,1)|0)==0){Gd(a,0,1);_c(a,-1);Od(a,1)|0}Fd(a,-1001e3,2);Ld(a,-2,4296);i=b;return 0}function Kh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;if(a>>>0<8){c=a;i=b;return c|0}if(a>>>0>15){d=a;e=1;do{f=d+1|0;d=f>>>1;e=e+1|0}while(f>>>0>31);g=d;h=e<<3}else{g=a;h=8}c=h|g+ -8;i=b;return c|0}function Lh(a){a=a|0;var b=0,c=0;b=a>>>3&31;if((b|0)==0){c=a}else{c=(a&7|8)<<b+ -1}return c|0}function Mh(a){a=a|0;var b=0,c=0,e=0,f=0,g=0,h=0,j=0;b=i;c=a+ -1|0;if(c>>>0>255){a=c;e=0;while(1){f=e+8|0;g=a>>>8;if(a>>>0>65535){a=g;e=f}else{h=g;j=f;break}}}else{h=c;j=0}i=b;return(d[4336+h|0]|0)+j|0}function Nh(a,b,c){a=a|0;b=+b;c=+c;var d=0.0;switch(a|0){case 0:{d=b+c;break};case 2:{d=b*c;break};case 4:{d=b- +R(+(b/c))*c;break};case 3:{d=b/c;break};case 6:{d=-b;break};case 5:{d=+U(+b,+c);break};case 1:{d=b-c;break};default:{d=0.0}}return+d}function Oh(b){b=b|0;var c=0,d=0;c=i;if((a[b+10097|0]&2)==0){d=(b|32)+ -87|0;i=c;return d|0}else{d=b+ -48|0;i=c;return d|0}return 0}function Ph(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0,J=0,K=0.0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0.0,U=0;g=i;i=i+16|0;j=g;if((Am(b,4592)|0)!=0){k=0;i=g;return k|0}do{if((Am(b,4600)|0)==0){l=+Rm(b,j);m=c[j>>2]|0;n=l}else{c[j>>2]=b;o=b;while(1){p=a[o]|0;q=o+1|0;if((a[(p&255)+10097|0]&8)==0){break}else{o=q}}if(p<<24>>24==45){r=1;s=q}else if(p<<24>>24==43){r=0;s=q}else{r=0;s=o}if((a[s]|0)==48?(t=a[s+1|0]|0,t<<24>>24==88|t<<24>>24==120):0){t=s+2|0;u=a[t]|0;v=u&255;w=a[v+10097|0]|0;if((w&16)==0){x=0.0;y=u;z=t;A=0}else{l=0.0;u=w;w=v;v=0;B=t;while(1){if((u&2)==0){C=(w|32)+ -87|0}else{C=w+ -48|0}D=l*16.0+ +(C|0);t=v+1|0;E=B+1|0;F=a[E]|0;G=F&255;H=a[G+10097|0]|0;if((H&16)==0){x=D;y=F;z=E;A=t;break}else{l=D;u=H;w=G;v=t;B=E}}}if(y<<24>>24==46){B=z+1|0;v=d[B]|0;w=a[v+10097|0]|0;if((w&16)==0){I=0;J=B;K=x}else{l=x;u=w;w=v;v=0;o=B;while(1){if((u&2)==0){L=(w|32)+ -87|0}else{L=w+ -48|0}D=l*16.0+ +(L|0);B=v+1|0;E=o+1|0;t=d[E]|0;G=a[t+10097|0]|0;if((G&16)==0){I=B;J=E;K=D;break}else{l=D;u=G;w=t;v=B;o=E}}}}else{I=0;J=z;K=x}if((I|A|0)!=0){o=da(I,-4)|0;c[j>>2]=J;v=a[J]|0;if(v<<24>>24==80|v<<24>>24==112){v=J+1|0;w=a[v]|0;if(w<<24>>24==45){M=1;N=J+2|0}else if(w<<24>>24==43){M=0;N=J+2|0}else{M=0;N=v}v=a[N]|0;if((a[(v&255)+10097|0]&2)==0){O=o;P=J}else{w=N;u=v;v=0;do{w=w+1|0;v=(u<<24>>24)+ -48+(v*10|0)|0;u=a[w]|0}while(!((a[(u&255)+10097|0]&2)==0));Q=w;R=((M|0)==0?v:0-v|0)+o|0;S=29}}else{Q=J;R=o;S=29}if((S|0)==29){c[j>>2]=Q;O=R;P=Q}if((r|0)==0){T=K}else{T=-K}m=P;n=+um(T,O);break}}h[f>>3]=0.0;k=0;i=g;return k|0}}while(0);h[f>>3]=n;if((m|0)==(b|0)){k=0;i=g;return k|0}if((a[(d[m]|0)+10097|0]&8)==0){U=m}else{f=m;do{f=f+1|0}while(!((a[(d[f]|0)+10097|0]&8)==0));c[j>>2]=f;U=f}k=(U|0)==(b+e|0)|0;i=g;return k|0}function Qh(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0,I=0,J=0,K=0,L=0,M=0;g=i;i=i+48|0;j=g;k=g+32|0;l=g+8|0;m=xm(e,37)|0;n=b+24|0;o=b+8|0;p=c[o>>2]|0;q=(c[n>>2]|0)-p|0;a:do{if((m|0)==0){r=e;s=q;t=p;u=0}else{v=e;w=p;x=m;y=q;z=0;b:while(1){if((y|0)<48){vf(b,2);A=c[o>>2]|0}else{A=w}c[o>>2]=A+16;B=Mi(b,v,x-v|0)|0;c[A>>2]=B;c[A+8>>2]=d[B+4|0]|64;C=a[x+1|0]|0;switch(C|0){case 115:{B=c[f>>2]|0;D=c[B>>2]|0;c[f>>2]=B+4;B=(D|0)==0?4608:D;D=Zm(B|0)|0;E=c[o>>2]|0;c[o>>2]=E+16;F=Mi(b,B,D)|0;c[E>>2]=F;c[E+8>>2]=d[F+4|0]|64;break};case 37:{F=c[o>>2]|0;c[o>>2]=F+16;E=Mi(b,4624,1)|0;c[F>>2]=E;c[F+8>>2]=d[E+4|0]|64;break};case 112:{E=c[f>>2]|0;F=c[E>>2]|0;c[f>>2]=E+4;c[j>>2]=F;F=jb(l|0,4616,j|0)|0;E=c[o>>2]|0;c[o>>2]=E+16;D=Mi(b,l,F)|0;c[E>>2]=D;c[E+8>>2]=d[D+4|0]|64;break};case 99:{D=c[f>>2]|0;E=c[D>>2]|0;c[f>>2]=D+4;a[k]=E;E=c[o>>2]|0;c[o>>2]=E+16;D=Mi(b,k,1)|0;c[E>>2]=D;c[E+8>>2]=d[D+4|0]|64;break};case 102:{D=c[o>>2]|0;c[o>>2]=D+16;E=c[f>>2]|0;G=+h[E>>3];c[f>>2]=E+8;h[D>>3]=G;c[D+8>>2]=3;break};case 100:{D=c[o>>2]|0;c[o>>2]=D+16;E=c[f>>2]|0;F=c[E>>2]|0;c[f>>2]=E+4;h[D>>3]=+(F|0);c[D+8>>2]=3;break};default:{break b}}D=z+2|0;F=x+2|0;E=xm(F,37)|0;B=c[o>>2]|0;H=(c[n>>2]|0)-B|0;if((E|0)==0){r=F;s=H;t=B;u=D;break a}else{v=F;w=B;x=E;y=H;z=D}}c[j>>2]=C;nf(b,4632,j)}}while(0);if((s|0)<32){vf(b,1);I=c[o>>2]|0}else{I=t}t=Zm(r|0)|0;c[o>>2]=I+16;s=Mi(b,r,t)|0;c[I>>2]=s;c[I+8>>2]=d[s+4|0]|64;if((u|0)<=0){J=c[o>>2]|0;K=J+ -16|0;L=c[K>>2]|0;M=L+16|0;i=g;return M|0}Vj(b,u|1);J=c[o>>2]|0;K=J+ -16|0;L=c[K>>2]|0;M=L+16|0;i=g;return M|0}function Rh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;c[f>>2]=d;d=Qh(a,b,f)|0;i=e;return d|0}function Sh(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=Zm(c|0)|0;g=a[c]|0;if(g<<24>>24==61){h=c+1|0;if(f>>>0>d>>>0){j=d+ -1|0;an(b|0,h|0,j|0)|0;a[b+j|0]=0;i=e;return}else{an(b|0,h|0,f|0)|0;i=e;return}}else if(g<<24>>24==64){if(f>>>0>d>>>0){a[b+0|0]=a[4680|0]|0;a[b+1|0]=a[4681|0]|0;a[b+2|0]=a[4682|0]|0;an(b+3|0,c+(4-d+f)|0,d+ -3|0)|0;i=e;return}else{an(b|0,c+1|0,f|0)|0;i=e;return}}else{g=xm(c,10)|0;h=b+0|0;j=4688|0;k=h+9|0;do{a[h]=a[j]|0;h=h+1|0;j=j+1|0}while((h|0)<(k|0));j=b+9|0;h=d+ -15|0;d=(g|0)==0;if(f>>>0<h>>>0&d){an(j|0,c|0,f|0)|0;l=f+9|0}else{if(d){m=f}else{m=g-c|0}g=m>>>0>h>>>0?h:m;an(j|0,c|0,g|0)|0;c=b+(g+9)|0;a[c+0|0]=a[4680|0]|0;a[c+1|0]=a[4681|0]|0;a[c+2|0]=a[4682|0]|0;l=g+12|0}g=b+l|0;a[g+0|0]=a[4704|0]|0;a[g+1|0]=a[4705|0]|0;a[g+2|0]=a[4706|0]|0;i=e;return}}function Th(a){a=a|0;var b=0;b=i;Gd(a,0,11);Ve(a,4752,0);i=b;return 1}function Uh(a){a=a|0;var b=0;b=i;qd(a,+(Ea()|0)/1.0e6);i=b;return 1}function Vh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+1264|0;e=d;f=d+1048|0;g=d+1256|0;h=d+8|0;j=d+1056|0;k=re(b,1,5192,0)|0;if(($c(b,2)|0)<1){l=nb(0)|0}else{l=~~+we(b,2)}c[f>>2]=l;if((a[k]|0)==33){m=k+1|0;n=$a(f|0)|0}else{m=k;n=kb(f|0)|0}if((n|0)==0){pd(b);i=d;return 1}if((Tm(m,5200)|0)==0){Gd(b,0,9);rd(b,c[n>>2]|0);Ld(b,-2,4992);rd(b,c[n+4>>2]|0);Ld(b,-2,5e3);rd(b,c[n+8>>2]|0);Ld(b,-2,5008);rd(b,c[n+12>>2]|0);Ld(b,-2,5016);rd(b,(c[n+16>>2]|0)+1|0);Ld(b,-2,5024);rd(b,(c[n+20>>2]|0)+1900|0);Ld(b,-2,5032);rd(b,(c[n+24>>2]|0)+1|0);Ld(b,-2,5208);rd(b,(c[n+28>>2]|0)+1|0);Ld(b,-2,5216);f=c[n+32>>2]|0;if((f|0)<0){i=d;return 1}yd(b,f);Ld(b,-2,5040);i=d;return 1}a[g]=37;He(b,h);f=h+8|0;k=h+4|0;l=g+1|0;o=g+2|0;p=m;while(1){m=a[p]|0;if(m<<24>>24==0){break}else if(!(m<<24>>24==37)){q=c[f>>2]|0;if(q>>>0<(c[k>>2]|0)>>>0){r=q;s=m}else{Be(h,1)|0;r=c[f>>2]|0;s=a[p]|0}c[f>>2]=r+1;a[(c[h>>2]|0)+r|0]=s;p=p+1|0;continue}m=p+1|0;q=p+2|0;t=a[m]|0;if(!(t<<24>>24==0)?(vm(5224,t<<24>>24,23)|0)!=0:0){a[l]=t;a[o]=0;u=q}else{c[e>>2]=m;ge(b,1,wd(b,5248,e)|0)|0;u=m}Ce(h,j,Fb(j|0,200,g|0,n|0)|0);p=u}Ee(h);i=d;return 1}function Wh(a){a=a|0;var b=0,c=0;b=i;c=~~+we(a,1);qd(a,+Xb(c|0,~~+xe(a,2,0.0)|0));i=b;return 1}function Xh(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=re(a,1,0,0)|0;d=Zb(c|0)|0;if((c|0)==0){yd(a,d);e=1;i=b;return e|0}else{e=le(a,d)|0;i=b;return e|0}return 0}function Yh(a){a=a|0;var b=0,c=0;b=i;if(($c(a,1)|0)==1){c=(jd(a,1)|0)==0|0}else{c=Ae(a,1,0)|0}if((jd(a,2)|0)!=0){Hi(a)}if((a|0)==0){i=b;return 0}else{pb(c|0)}return 0}function Zh(a){a=a|0;var b=0;b=i;ud(a,Ib(se(a,1,0)|0)|0)|0;i=b;return 1}function _h(a){a=a|0;var b=0,c=0,d=0;b=i;c=se(a,1,0)|0;d=ke(a,(Cb(c|0)|0)==0|0,c)|0;i=b;return d|0}function $h(a){a=a|0;var b=0,c=0,d=0;b=i;c=se(a,1,0)|0;d=ke(a,(xa(c|0,se(a,2,0)|0)|0)==0|0,0)|0;i=b;return d|0}function ai(a){a=a|0;var b=0,d=0;b=i;d=re(a,1,0,0)|0;ud(a,Xa(c[5088+((qe(a,2,5144,5112)|0)<<2)>>2]|0,d|0)|0)|0;i=b;return 1}function bi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+64|0;d=b;e=b+48|0;f=b+4|0;if(($c(a,1)|0)<1){g=nb(0)|0}else{ue(a,1,5);Vc(a,1);Dd(a,-1,4992);h=hd(a,-1,d)|0;j=(c[d>>2]|0)==0?0:h;Vc(a,-2);c[f>>2]=j;Dd(a,-1,5e3);j=hd(a,-1,d)|0;h=(c[d>>2]|0)==0?0:j;Vc(a,-2);c[f+4>>2]=h;Dd(a,-1,5008);h=hd(a,-1,d)|0;j=(c[d>>2]|0)==0?12:h;Vc(a,-2);c[f+8>>2]=j;Dd(a,-1,5016);j=hd(a,-1,e)|0;if((c[e>>2]|0)==0){c[d>>2]=5016;k=he(a,5048,d)|0}else{Vc(a,-2);k=j}c[f+12>>2]=k;Dd(a,-1,5024);k=hd(a,-1,e)|0;if((c[e>>2]|0)==0){c[d>>2]=5024;l=he(a,5048,d)|0}else{Vc(a,-2);l=k}c[f+16>>2]=l+ -1;Dd(a,-1,5032);l=hd(a,-1,e)|0;if((c[e>>2]|0)==0){c[d>>2]=5032;m=he(a,5048,d)|0}else{Vc(a,-2);m=l}c[f+20>>2]=m+ -1900;Dd(a,-1,5040);if(($c(a,-1)|0)==0){n=-1}else{n=jd(a,-1)|0}Vc(a,-2);c[f+32>>2]=n;g=eb(f|0)|0}if((g|0)==-1){pd(a);i=b;return 1}else{qd(a,+(g|0));i=b;return 1}return 0}function ci(a){a=a|0;var b=0,c=0,d=0;b=i;i=i+32|0;c=b+4|0;if((Pa(c|0)|0)==0){d=he(a,4952,b)|0;i=b;return d|0}else{ud(a,c)|0;d=1;i=b;return d|0}return 0}function di(d,e,f,g,h,j){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;i=i+176|0;l=k+156|0;m=k+80|0;n=k;o=k+104|0;p=Mf(d,1)|0;q=d+8|0;r=c[q>>2]|0;c[r>>2]=p;c[r+8>>2]=70;r=(c[q>>2]|0)+16|0;c[q>>2]=r;if(((c[d+24>>2]|0)-r|0)<16){vf(d,0)}r=Rf(d)|0;c[p+12>>2]=r;c[o>>2]=r;r=Ni(d,h)|0;c[(c[o>>2]|0)+36>>2]=r;c[n+60>>2]=f;f=n+64|0;c[f>>2]=g;c[g+28>>2]=0;c[g+16>>2]=0;c[g+4>>2]=0;km(d,n,e,c[(c[o>>2]|0)+36>>2]|0,j);j=c[n+52>>2]|0;e=n+48|0;c[o+8>>2]=c[e>>2];d=o+12|0;c[d>>2]=n;c[e>>2]=o;c[o+20>>2]=0;c[o+24>>2]=0;c[o+28>>2]=-1;c[o+32>>2]=0;c[o+36>>2]=0;e=o+44|0;c[e+0>>2]=0;a[e+4|0]=0;c[o+40>>2]=c[(c[f>>2]|0)+4>>2];f=o+16|0;c[f>>2]=0;e=c[o>>2]|0;c[e+36>>2]=c[n+68>>2];a[e+78|0]=2;e=oj(j)|0;c[o+4>>2]=e;g=j+8|0;r=c[g>>2]|0;c[r>>2]=e;c[r+8>>2]=69;r=(c[g>>2]|0)+16|0;c[g>>2]=r;if(((c[j+24>>2]|0)-r|0)<16){vf(j,0)}a[l+10|0]=0;a[l+8|0]=a[o+46|0]|0;j=c[(c[d>>2]|0)+64>>2]|0;b[l+4>>1]=c[j+28>>2];b[l+6>>1]=c[j+16>>2];a[l+9|0]=0;c[l>>2]=c[f>>2];c[f>>2]=l;a[(c[o>>2]|0)+77|0]=1;c[m+16>>2]=-1;c[m+20>>2]=-1;c[m>>2]=7;c[m+8>>2]=0;ei(o,c[n+72>>2]|0,m)|0;lm(n);m=n+16|0;a:while(1){o=c[m>>2]|0;switch(o|0){case 277:case 286:case 262:case 261:case 260:{s=o;break a;break};default:{}}li(n);if((o|0)==274){t=8;break}}if((t|0)==8){s=c[m>>2]|0}if((s|0)==286){fi(n);i=k;return p|0}else{ki(n,286)}return 0}function ei(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+16|0;h=g;j=c[b>>2]|0;k=j+40|0;l=c[k>>2]|0;m=b+47|0;n=d[m]|0;if((n+1|0)>>>0>255){o=b+12|0;p=c[(c[o>>2]|0)+52>>2]|0;q=c[j+64>>2]|0;if((q|0)==0){r=5680;c[h>>2]=6008;s=h+4|0;c[s>>2]=255;t=h+8|0;c[t>>2]=r;u=Rh(p,5720,h)|0;v=c[o>>2]|0;hm(v,u)}c[h>>2]=q;r=Rh(p,5696,h)|0;c[h>>2]=6008;s=h+4|0;c[s>>2]=255;t=h+8|0;c[t>>2]=r;u=Rh(p,5720,h)|0;v=c[o>>2]|0;hm(v,u)}if((n|0)<(l|0)){w=l}else{n=j+28|0;c[n>>2]=sh(c[(c[b+12>>2]|0)+52>>2]|0,c[n>>2]|0,k,8,255,6008)|0;w=c[k>>2]|0}k=j+28|0;if((l|0)<(w|0)){n=l;do{l=n;n=n+1|0;c[(c[k>>2]|0)+(l<<3)>>2]=0}while((n|0)<(w|0))}a[(c[k>>2]|0)+((d[m]|0)<<3)+4|0]=(c[f>>2]|0)==7|0;a[(c[k>>2]|0)+((d[m]|0)<<3)+5|0]=c[f+8>>2];c[(c[k>>2]|0)+((d[m]|0)<<3)>>2]=e;if((a[e+5|0]&3)==0){x=a[m]|0;y=x+1<<24>>24;a[m]=y;z=x&255;i=g;return z|0}if((a[j+5|0]&4)==0){x=a[m]|0;y=x+1<<24>>24;a[m]=y;z=x&255;i=g;return z|0}Uf(c[(c[b+12>>2]|0)+52>>2]|0,j,e);x=a[m]|0;y=x+1<<24>>24;a[m]=y;z=x&255;i=g;return z|0}function fi(a){a=a|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=c[a+52>>2]|0;g=a+48|0;h=c[g>>2]|0;j=c[h>>2]|0;_k(h,0,0);gi(h);k=h+20|0;l=c[k>>2]|0;if((l+1|0)>>>0>1073741823){th(f)}m=j+12|0;n=j+48|0;c[m>>2]=uh(f,c[m>>2]|0,c[n>>2]<<2,l<<2)|0;c[n>>2]=c[k>>2];n=c[k>>2]|0;if((n+1|0)>>>0>1073741823){th(f)}l=j+20|0;m=j+52|0;c[l>>2]=uh(f,c[l>>2]|0,c[m>>2]<<2,n<<2)|0;c[m>>2]=c[k>>2];k=h+32|0;m=c[k>>2]|0;if((m+1|0)>>>0>268435455){th(f)}n=j+8|0;l=j+44|0;c[n>>2]=uh(f,c[n>>2]|0,c[l>>2]<<4,m<<4)|0;c[l>>2]=c[k>>2];k=h+36|0;l=c[k>>2]|0;if((l+1|0)>>>0>1073741823){th(f)}m=j+16|0;n=j+56|0;c[m>>2]=uh(f,c[m>>2]|0,c[n>>2]<<2,l<<2)|0;c[n>>2]=c[k>>2];k=h+44|0;n=b[k>>1]|0;if((n+1|0)>>>0>357913941){th(f)}l=j+24|0;m=j+60|0;c[l>>2]=uh(f,c[l>>2]|0,(c[m>>2]|0)*12|0,n*12|0)|0;c[m>>2]=b[k>>1]|0;k=h+47|0;m=j+28|0;n=j+40|0;c[m>>2]=uh(f,c[m>>2]|0,c[n>>2]<<3,d[k]<<3)|0;c[n>>2]=d[k]|0;c[g>>2]=c[h+8>>2];if(((c[a+16>>2]|0)+ -288|0)>>>0<2){h=c[a+24>>2]|0;jm(a,h+16|0,c[h+12>>2]|0)|0}h=f+8|0;c[h>>2]=(c[h>>2]|0)+ -16;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){i=e;return}gg(f);i=e;return}function gi(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=i;i=i+16|0;g=f;h=e+16|0;j=c[h>>2]|0;k=e+12|0;l=c[k>>2]|0;if((c[j>>2]|0)!=0?(a[j+9|0]|0)!=0:0){m=Xk(e)|0;cl(e,m,d[j+8|0]|0);bl(e,m)}a:do{if((a[j+10|0]|0)!=0){m=l+52|0;n=Ni(c[m>>2]|0,5432)|0;o=l+64|0;p=c[o>>2]|0;q=p+24|0;r=l+48|0;s=c[(c[r>>2]|0)+20>>2]|0;t=p+28|0;u=c[t>>2]|0;v=p+32|0;if((u|0)<(c[v>>2]|0)){w=c[q>>2]|0}else{p=sh(c[m>>2]|0,c[q>>2]|0,v,16,32767,5440)|0;c[q>>2]=p;w=p}c[w+(u<<4)>>2]=n;n=c[q>>2]|0;c[n+(u<<4)+8>>2]=0;a[n+(u<<4)+12|0]=a[(c[r>>2]|0)+46|0]|0;c[(c[q>>2]|0)+(u<<4)+4>>2]=s;c[t>>2]=(c[t>>2]|0)+1;t=c[o>>2]|0;o=(c[t+24>>2]|0)+(u<<4)|0;u=b[(c[(c[r>>2]|0)+16>>2]|0)+6>>1]|0;r=t+16|0;if((u|0)<(c[r>>2]|0)){s=t+12|0;t=u;do{while(1){if((Ji(c[(c[s>>2]|0)+(t<<4)>>2]|0,c[o>>2]|0)|0)==0){break}ji(l,t,o);if((t|0)>=(c[r>>2]|0)){break a}}t=t+1|0}while((t|0)<(c[r>>2]|0))}}}while(0);c[h>>2]=c[j>>2];h=j+8|0;w=a[h]|0;r=e+46|0;t=(c[k>>2]|0)+64|0;o=(c[t>>2]|0)+4|0;c[o>>2]=(w&255)-(d[r]|0)+(c[o>>2]|0);o=a[r]|0;if((o&255)>(w&255)){s=e+20|0;u=e+40|0;q=(c[e>>2]|0)+24|0;n=o;while(1){p=c[s>>2]|0;v=n+ -1<<24>>24;a[r]=v;c[(c[q>>2]|0)+((b[(c[c[t>>2]>>2]|0)+((c[u>>2]|0)+(v&255)<<1)>>1]|0)*12|0)+8>>2]=p;p=a[r]|0;if((p&255)>(w&255)){n=p}else{x=p;break}}}else{x=o}a[e+48|0]=x;x=c[l+64>>2]|0;c[x+28>>2]=b[j+4>>1]|0;o=b[j+6>>1]|0;if((c[j>>2]|0)==0){if((o|0)>=(c[x+16>>2]|0)){i=f;return}n=c[x+12>>2]|0;x=c[n+(o<<4)>>2]|0;if((a[x+4|0]|0)!=4){y=5328;z=l+52|0;A=c[z>>2]|0;B=x+16|0;C=n+(o<<4)+8|0;D=c[C>>2]|0;c[g>>2]=B;E=g+4|0;c[E>>2]=D;F=Rh(A,y,g)|0;hi(l,F)}y=(a[x+6|0]|0)!=0?5288:5328;z=l+52|0;A=c[z>>2]|0;B=x+16|0;C=n+(o<<4)+8|0;D=c[C>>2]|0;c[g>>2]=B;E=g+4|0;c[E>>2]=D;F=Rh(A,y,g)|0;hi(l,F)}F=c[t>>2]|0;t=F+16|0;if((o|0)>=(c[t>>2]|0)){i=f;return}l=F+12|0;F=j+9|0;j=o;do{o=c[l>>2]|0;g=o+(j<<4)+12|0;y=a[h]|0;A=y&255;if((d[g]|0)>(y&255)){if((a[F]|0)==0){G=y}else{cl(e,c[o+(j<<4)+4>>2]|0,A);G=a[h]|0}a[g]=G}j=((ii(c[k>>2]|0,j)|0)==0)+j|0}while((j|0)<(c[t>>2]|0));i=f;return}function hi(a,b){a=a|0;b=b|0;c[a+16>>2]=0;hm(a,b)}function ii(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;h=e+48|0;j=c[(c[h>>2]|0)+16>>2]|0;k=c[e+64>>2]|0;l=c[k+12>>2]|0;m=j+4|0;n=b[m>>1]|0;o=k+28|0;if((n|0)>=(c[o>>2]|0)){p=0;i=g;return p|0}q=k+24|0;k=l+(f<<4)|0;r=n;while(1){s=c[q>>2]|0;t=s+(r<<4)|0;n=r+1|0;if((Ji(c[t>>2]|0,c[k>>2]|0)|0)!=0){break}if((n|0)<(c[o>>2]|0)){r=n}else{p=0;u=10;break}}if((u|0)==10){i=g;return p|0}u=a[s+(r<<4)+12|0]|0;do{if((d[l+(f<<4)+12|0]|0)>(u&255)){if((a[j+9|0]|0)==0?(c[o>>2]|0)<=(b[m>>1]|0):0){break}cl(c[h>>2]|0,c[l+(f<<4)+4>>2]|0,u&255)}}while(0);ji(e,f,t);p=1;i=g;return p|0}function ji(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=i;i=i+16|0;j=h;k=c[e+48>>2]|0;l=c[e+64>>2]|0;m=l+12|0;n=c[m>>2]|0;o=a[n+(f<<4)+12|0]|0;if((o&255)<(d[g+12|0]|0)){p=c[e+52>>2]|0;q=c[n+(f<<4)+8>>2]|0;r=(c[(c[(c[k>>2]|0)+24>>2]|0)+((b[(c[c[(c[k+12>>2]|0)+64>>2]>>2]|0)+((c[k+40>>2]|0)+(o&255)<<1)>>1]|0)*12|0)>>2]|0)+16|0;c[j>>2]=(c[n+(f<<4)>>2]|0)+16;c[j+4>>2]=q;c[j+8>>2]=r;hi(e,Rh(p,5376,j)|0)}al(k,c[n+(f<<4)+4>>2]|0,c[g+4>>2]|0);g=l+16|0;l=(c[g>>2]|0)+ -1|0;if((l|0)>(f|0)){s=f}else{t=l;c[g>>2]=t;i=h;return}while(1){l=c[m>>2]|0;f=l+(s<<4)|0;n=s+1|0;k=l+(n<<4)|0;c[f+0>>2]=c[k+0>>2];c[f+4>>2]=c[k+4>>2];c[f+8>>2]=c[k+8>>2];c[f+12>>2]=c[k+12>>2];k=(c[g>>2]|0)+ -1|0;if((n|0)<(k|0)){s=n}else{t=k;break}}c[g>>2]=t;i=h;return}function ki(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+16|0;e=d;d=c[a+52>>2]|0;c[e>>2]=gm(a,b)|0;hm(a,Rh(d,5456,e)|0)}



function li(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;f=i;i=i+160|0;g=f+120|0;h=f+96|0;j=f+72|0;k=f+48|0;l=f+24|0;m=f;n=e+4|0;o=c[n>>2]|0;p=e+48|0;q=c[p>>2]|0;r=e+52|0;s=(c[r>>2]|0)+38|0;t=(b[s>>1]|0)+1<<16>>16;b[s>>1]=t;if((t&65535)>200){t=q+12|0;s=c[(c[t>>2]|0)+52>>2]|0;u=c[(c[q>>2]|0)+64>>2]|0;if((u|0)==0){v=5680;c[g>>2]=5488;w=g+4|0;c[w>>2]=200;x=g+8|0;c[x>>2]=v;y=Rh(s,5720,g)|0;z=c[t>>2]|0;hm(z,y)}c[g>>2]=u;v=Rh(s,5696,g)|0;c[g>>2]=5488;w=g+4|0;c[w>>2]=200;x=g+8|0;c[x>>2]=v;y=Rh(s,5720,g)|0;z=c[t>>2]|0;hm(z,y)}y=e+16|0;a:do{switch(c[y>>2]|0){case 267:{c[m>>2]=-1;yi(e,m);while(1){z=c[y>>2]|0;if((z|0)==260){A=10;break}else if((z|0)!=261){break}yi(e,m)}if((A|0)==10){lm(e);z=c[p>>2]|0;a[l+10|0]=0;a[l+8|0]=a[z+46|0]|0;t=c[(c[z+12>>2]|0)+64>>2]|0;b[l+4>>1]=c[t+28>>2];b[l+6>>1]=c[t+16>>2];a[l+9|0]=0;t=z+16|0;c[l>>2]=c[t>>2];c[t>>2]=l;b:do{t=c[y>>2]|0;switch(t|0){case 277:case 286:case 262:case 261:case 260:{break b;break};default:{}}li(e)}while((t|0)!=274);gi(z)}mi(e,262,267,o);bl(q,c[m>>2]|0);break};case 59:{lm(e);break};case 278:{lm(e);t=$k(q)|0;pi(e,l,0)|0;if((c[l>>2]|0)==1){c[l>>2]=3}vl(c[p>>2]|0,l);s=c[l+20>>2]|0;a[m+10|0]=1;a[m+8|0]=a[q+46|0]|0;v=c[(c[q+12>>2]|0)+64>>2]|0;b[m+4>>1]=c[v+28>>2];b[m+6>>1]=c[v+16>>2];a[m+9|0]=0;v=q+16|0;c[m>>2]=c[v>>2];c[v>>2]=m;if((c[y>>2]|0)!=259){ki(e,259)}lm(e);v=c[p>>2]|0;a[l+10|0]=0;a[l+8|0]=a[v+46|0]|0;x=c[(c[v+12>>2]|0)+64>>2]|0;b[l+4>>1]=c[x+28>>2];b[l+6>>1]=c[x+16>>2];a[l+9|0]=0;x=v+16|0;c[l>>2]=c[x>>2];c[x>>2]=l;c:do{x=c[y>>2]|0;switch(x|0){case 277:case 286:case 262:case 261:case 260:{break c;break};default:{}}li(e)}while((x|0)!=274);gi(v);al(q,Xk(q)|0,t);mi(e,262,278,o);gi(q);bl(q,s);break};case 269:{lm(e);z=c[y>>2]|0;if((z|0)==265){lm(e);x=c[p>>2]|0;if((c[y>>2]|0)==288){w=c[e+24>>2]|0;lm(e);si(e,w);w=c[p>>2]|0;u=w+46|0;B=(d[u]|0)+1|0;a[u]=B;c[(c[(c[w>>2]|0)+24>>2]|0)+((b[(c[c[(c[w+12>>2]|0)+64>>2]>>2]|0)+((B&255)+ -1+(c[w+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[w+20>>2];ri(e,k,0,c[n>>2]|0);c[(c[(c[x>>2]|0)+24>>2]|0)+((b[(c[c[(c[x+12>>2]|0)+64>>2]>>2]|0)+((c[x+40>>2]|0)+(c[k+8>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[x+20>>2];break a}else{ki(e,288)}}if((z|0)!=288){ki(e,288)}z=e+24|0;x=1;while(1){w=c[z>>2]|0;lm(e);si(e,w);w=c[y>>2]|0;if((w|0)==61){A=81;break}else if((w|0)!=44){A=83;break}lm(e);if((c[y>>2]|0)==288){x=x+1|0}else{A=78;break}}do{if((A|0)==78){ki(e,288)}else if((A|0)==81){lm(e);pi(e,j,0)|0;if((c[y>>2]|0)==44){z=1;while(1){lm(e);nl(c[p>>2]|0,j);pi(e,j,0)|0;s=z+1|0;if((c[y>>2]|0)==44){z=s}else{C=s;break}}}else{C=1}z=c[j>>2]|0;s=c[p>>2]|0;t=x-C|0;if((z|0)==0){D=t;E=s;A=88;break}else if(!((z|0)==13|(z|0)==12)){nl(s,j);D=t;E=s;A=88;break}z=t+1|0;t=(z|0)<0?0:z;kl(s,j,t);if((t|0)>1){gl(s,t+ -1|0)}}else if((A|0)==83){c[j>>2]=0;D=x;E=c[p>>2]|0;A=88}}while(0);if((A|0)==88?(D|0)>0:0){t=d[E+48|0]|0;gl(E,D);Vk(E,t,D)}t=c[p>>2]|0;s=t+46|0;z=(d[s]|0)+x|0;a[s]=z;if((x|0)!=0?(v=t+20|0,w=t+40|0,B=c[(c[t>>2]|0)+24>>2]|0,u=c[c[(c[t+12>>2]|0)+64>>2]>>2]|0,c[B+((b[u+((z&255)-x+(c[w>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[v>>2],z=x+ -1|0,(z|0)!=0):0){t=z;do{c[B+((b[u+((d[s]|0)-t+(c[w>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[v>>2];t=t+ -1|0}while((t|0)!=0)}break};case 259:{lm(e);t=c[p>>2]|0;a[l+10|0]=0;a[l+8|0]=a[t+46|0]|0;v=c[(c[t+12>>2]|0)+64>>2]|0;b[l+4>>1]=c[v+28>>2];b[l+6>>1]=c[v+16>>2];a[l+9|0]=0;v=t+16|0;c[l>>2]=c[v>>2];c[v>>2]=l;d:do{v=c[y>>2]|0;switch(v|0){case 277:case 286:case 262:case 261:case 260:{break d;break};default:{}}li(e)}while((v|0)!=274);gi(t);mi(e,262,259,o);break};case 273:{v=$k(q)|0;a[h+10|0]=1;w=q+46|0;a[h+8|0]=a[w]|0;s=q+12|0;u=c[(c[s>>2]|0)+64>>2]|0;b[h+4>>1]=c[u+28>>2];b[h+6>>1]=c[u+16>>2];a[h+9|0]=0;u=q+16|0;c[h>>2]=c[u>>2];c[u>>2]=h;a[j+10|0]=0;B=j+8|0;a[B]=a[w]|0;w=c[(c[s>>2]|0)+64>>2]|0;b[j+4>>1]=c[w+28>>2];b[j+6>>1]=c[w+16>>2];w=j+9|0;a[w]=0;c[j>>2]=c[u>>2];c[u>>2]=j;lm(e);e:do{u=c[y>>2]|0;switch(u|0){case 277:case 286:case 262:case 261:case 260:{break e;break};default:{}}li(e)}while((u|0)!=274);mi(e,277,273,o);pi(e,g,0)|0;if((c[g>>2]|0)==1){c[g>>2]=3}vl(c[p>>2]|0,g);t=c[g+20>>2]|0;if((a[w]|0)!=0){cl(q,t,d[B]|0)}gi(q);al(q,t,v);gi(q);break};case 265:{lm(e);if((c[y>>2]|0)!=288){ki(e,288)}t=c[e+24>>2]|0;lm(e);u=c[p>>2]|0;if((wi(u,t,l,1)|0)==0){wi(u,c[e+72>>2]|0,l,1)|0;s=hl(c[p>>2]|0,t)|0;c[k+16>>2]=-1;c[k+20>>2]=-1;c[k>>2]=4;c[k+8>>2]=s;xl(u,l,k)}while(1){u=c[y>>2]|0;if((u|0)==58){A=70;break}else if((u|0)!=46){F=0;break}ui(e,l)}if((A|0)==70){ui(e,l);F=1}ri(e,m,F,o);tl(c[p>>2]|0,l,m);Cl(c[p>>2]|0,o);break};case 285:{lm(e);if((c[y>>2]|0)!=288){ki(e,288)}v=c[e+24>>2]|0;lm(e);B=c[p>>2]|0;w=e+64|0;u=c[w>>2]|0;s=u+24|0;t=B+16|0;x=b[(c[t>>2]|0)+4>>1]|0;z=u+28|0;f:do{if((x|0)<(c[z>>2]|0)){G=x;while(1){H=G+1|0;if((Ji(v,c[(c[s>>2]|0)+(G<<4)>>2]|0)|0)!=0){break}if((H|0)<(c[z>>2]|0)){G=H}else{break f}}H=B+12|0;I=c[(c[H>>2]|0)+52>>2]|0;J=c[(c[s>>2]|0)+(G<<4)+8>>2]|0;c[g>>2]=v+16;c[g+4>>2]=J;J=Rh(I,5808,g)|0;hi(c[H>>2]|0,J)}}while(0);if((c[y>>2]|0)!=285){ki(e,285)}lm(e);x=c[B+20>>2]|0;J=c[z>>2]|0;H=u+32|0;if((J|0)<(c[H>>2]|0)){K=c[s>>2]|0}else{I=sh(c[r>>2]|0,c[s>>2]|0,H,16,32767,5440)|0;c[s>>2]=I;K=I}c[K+(J<<4)>>2]=v;I=c[s>>2]|0;c[I+(J<<4)+8>>2]=o;a[I+(J<<4)+12|0]=a[(c[p>>2]|0)+46|0]|0;c[(c[s>>2]|0)+(J<<4)+4>>2]=x;c[z>>2]=(c[z>>2]|0)+1;g:while(1){switch(c[y>>2]|0){case 285:case 59:{break};case 286:case 262:case 261:case 260:{A=108;break g;break};default:{break g}}li(e)}if((A|0)==108){a[(c[s>>2]|0)+(J<<4)+12|0]=a[(c[t>>2]|0)+8|0]|0}z=(c[s>>2]|0)+(J<<4)|0;v=c[w>>2]|0;u=b[(c[(c[p>>2]|0)+16>>2]|0)+6>>1]|0;B=v+16|0;if((u|0)<(c[B>>2]|0)){x=v+12|0;v=u;do{while(1){if((Ji(c[(c[x>>2]|0)+(v<<4)>>2]|0,c[z>>2]|0)|0)==0){break}ji(e,v,z);if((v|0)>=(c[B>>2]|0)){break a}}v=v+1|0}while((v|0)<(c[B>>2]|0))}break};case 264:{a[h+10|0]=1;a[h+8|0]=a[q+46|0]|0;B=c[(c[q+12>>2]|0)+64>>2]|0;b[h+4>>1]=c[B+28>>2];b[h+6>>1]=c[B+16>>2];a[h+9|0]=0;B=q+16|0;c[h>>2]=c[B>>2];c[B>>2]=h;lm(e);if((c[y>>2]|0)!=288){ki(e,288)}B=e+24|0;v=c[B>>2]|0;lm(e);z=c[y>>2]|0;if((z|0)==268|(z|0)==44){x=c[p>>2]|0;w=d[x+48|0]|0;si(e,jm(e,5872,15)|0);si(e,jm(e,5888,11)|0);si(e,jm(e,5904,13)|0);si(e,v);J=c[y>>2]|0;do{if((J|0)==44){s=4;while(1){lm(e);if((c[y>>2]|0)!=288){A=40;break}t=c[B>>2]|0;lm(e);si(e,t);L=c[y>>2]|0;if((L|0)==44){s=s+1|0}else{A=42;break}}if((A|0)==40){ki(e,288)}else if((A|0)==42){M=L;N=s+ -2|0;break}}else{M=J;N=1}}while(0);if((M|0)!=268){ki(e,268)}lm(e);J=c[n>>2]|0;pi(e,g,0)|0;if((c[y>>2]|0)==44){B=1;while(1){lm(e);nl(c[p>>2]|0,g);pi(e,g,0)|0;t=B+1|0;if((c[y>>2]|0)==44){B=t}else{O=t;break}}}else{O=1}B=c[p>>2]|0;t=3-O|0;G=c[g>>2]|0;if((G|0)==13|(G|0)==12){u=t+1|0;I=(u|0)<0?0:u;kl(B,g,I);if((I|0)>1){gl(B,I+ -1|0)}}else if((G|0)==0){A=51}else{nl(B,g);A=51}if((A|0)==51?(t|0)>0:0){G=d[B+48|0]|0;gl(B,t);Vk(B,G,t)}fl(x,3);xi(e,w,J,N,0)}else if((z|0)==61){t=c[p>>2]|0;G=t+48|0;B=d[G]|0;si(e,jm(e,5920,11)|0);si(e,jm(e,5936,11)|0);si(e,jm(e,5952,10)|0);si(e,v);if((c[y>>2]|0)!=61){ki(e,61)}lm(e);pi(e,g,0)|0;nl(c[p>>2]|0,g);if((c[y>>2]|0)!=44){ki(e,44)}lm(e);pi(e,g,0)|0;nl(c[p>>2]|0,g);if((c[y>>2]|0)==44){lm(e);pi(e,g,0)|0;nl(c[p>>2]|0,g)}else{I=d[G]|0;el(t,I,jl(t,1.0)|0)|0;gl(t,1)}xi(e,B,o,1,1)}else{hm(e,5848)}mi(e,262,264,o);gi(q);break};case 274:{lm(e);B=c[p>>2]|0;h:do{switch(c[y>>2]|0){case 59:case 277:case 286:case 262:case 261:case 260:{P=0;Q=0;break};default:{pi(e,h,0)|0;if((c[y>>2]|0)==44){t=1;while(1){lm(e);nl(c[p>>2]|0,h);pi(e,h,0)|0;I=t+1|0;if((c[y>>2]|0)==44){t=I}else{R=I;break}}}else{R=1}if(!(((c[h>>2]|0)+ -12|0)>>>0<2)){if((R|0)==1){P=pl(B,h)|0;Q=1;break h}else{nl(B,h);P=d[B+46|0]|0;Q=R;break h}}else{kl(B,h,-1);if((c[h>>2]|0)==12&(R|0)==1){t=(c[(c[B>>2]|0)+12>>2]|0)+(c[h+8>>2]<<2)|0;c[t>>2]=c[t>>2]&-64|30}P=d[B+46|0]|0;Q=-1;break h}}}}while(0);_k(B,P,Q);if((c[y>>2]|0)==59){lm(e)}break};case 266:case 258:{v=Xk(q)|0;z=c[n>>2]|0;J=(c[y>>2]|0)==266;lm(e);do{if(J){if((c[y>>2]|0)==288){w=c[e+24>>2]|0;lm(e);S=w;break}else{ki(e,288)}}else{S=Ni(c[r>>2]|0,5432)|0}}while(0);J=c[e+64>>2]|0;B=J+12|0;w=J+16|0;x=c[w>>2]|0;t=J+20|0;if((x|0)<(c[t>>2]|0)){T=c[B>>2]|0}else{J=sh(c[r>>2]|0,c[B>>2]|0,t,16,32767,5440)|0;c[B>>2]=J;T=J}c[T+(x<<4)>>2]=S;J=c[B>>2]|0;c[J+(x<<4)+8>>2]=z;a[J+(x<<4)+12|0]=a[(c[p>>2]|0)+46|0]|0;c[(c[B>>2]|0)+(x<<4)+4>>2]=v;c[w>>2]=(c[w>>2]|0)+1;ii(e,x)|0;break};default:{x=g+8|0;ni(e,x);w=c[y>>2]|0;if((w|0)==44|(w|0)==61){c[g>>2]=0;oi(e,g,1);break a}if((c[x>>2]|0)==12){x=(c[(c[q>>2]|0)+12>>2]|0)+(c[g+16>>2]<<2)|0;c[x>>2]=c[x>>2]&-8372225|16384;break a}else{hm(e,5472)}}}}while(0);e=c[p>>2]|0;a[e+48|0]=a[e+46|0]|0;e=(c[r>>2]|0)+38|0;b[e>>1]=(b[e>>1]|0)+ -1<<16>>16;i=f;return}function mi(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f;if((c[a+16>>2]|0)==(b|0)){lm(a);i=f;return}if((c[a+4>>2]|0)==(e|0)){ki(a,b)}else{f=c[a+52>>2]|0;h=gm(a,b)|0;b=gm(a,d)|0;c[g>>2]=h;c[g+4>>2]=b;c[g+8>>2]=e;hm(a,Rh(f,5968,g)|0)}}function ni(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=i;i=i+80|0;e=d+48|0;f=d+24|0;g=d;h=a+48|0;j=c[h>>2]|0;k=c[a+4>>2]|0;l=a+16|0;m=c[l>>2]|0;if((m|0)==40){lm(a);pi(a,b,0)|0;mi(a,41,40,k);ml(c[h>>2]|0,b);n=a+24|0}else if((m|0)==288){m=a+24|0;o=c[m>>2]|0;lm(a);p=c[h>>2]|0;if((wi(p,o,b,1)|0)==0){wi(p,c[a+72>>2]|0,b,1)|0;q=hl(c[h>>2]|0,o)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=q;xl(p,b,e);n=m}else{n=m}}else{hm(a,5784)}m=g+16|0;e=g+20|0;p=g+8|0;a:while(1){switch(c[l>>2]|0){case 91:{ql(j,b);lm(a);pi(a,f,0)|0;rl(c[h>>2]|0,f);if((c[l>>2]|0)!=93){r=10;break a}lm(a);xl(j,b,f);continue a;break};case 46:{ui(a,b);continue a;break};case 58:{lm(a);if((c[l>>2]|0)!=288){r=13;break a}q=c[n>>2]|0;lm(a);o=hl(c[h>>2]|0,q)|0;c[m>>2]=-1;c[e>>2]=-1;c[g>>2]=4;c[p>>2]=o;ul(j,b,g);vi(a,b,k);continue a;break};case 123:case 289:case 40:{nl(j,b);vi(a,b,k);continue a;break};default:{r=16;break a}}}if((r|0)==10){ki(a,93)}else if((r|0)==13){ki(a,288)}else if((r|0)==16){i=d;return}}function oi(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;j=i;i=i+80|0;k=j+56|0;l=j+32|0;m=j;n=g+8|0;if(!(((c[n>>2]|0)+ -7|0)>>>0<3)){hm(f,5472)}o=f+16|0;p=c[o>>2]|0;do{if((p|0)==44){lm(f);c[m>>2]=g;q=m+8|0;ni(f,q);r=f+48|0;if((c[q>>2]|0)!=9?(s=c[r>>2]|0,t=a[s+48|0]|0,u=t&255,(g|0)!=0):0){v=m+16|0;w=t&255;x=g;y=0;while(1){if((c[x+8>>2]|0)==9){z=x+16|0;A=z+3|0;B=d[A]|0;C=c[q>>2]|0;if((B|0)==(C|0)){D=z+2|0;if((d[D]|0)==(c[v>>2]|0)){a[A]=7;a[D]=t;E=c[q>>2]|0;F=1}else{E=B;F=y}}else{E=C;F=y}if((E|0)==7?(b[z>>1]|0)==(c[v>>2]|0):0){b[z>>1]=w;G=1}else{G=F}}else{G=y}x=c[x>>2]|0;if((x|0)==0){break}else{y=G}}if((G|0)!=0){Wk(s,(c[q>>2]|0)==7?0:5,u,c[v>>2]|0,0)|0;gl(s,1)}}y=c[r>>2]|0;if(((e[(c[f+52>>2]|0)+38>>1]|0)+h|0)<=200){oi(f,m,h+1|0);H=l;break}x=y+12|0;w=c[(c[x>>2]|0)+52>>2]|0;t=c[(c[y>>2]|0)+64>>2]|0;if((t|0)==0){I=5680;c[k>>2]=5488;J=k+4|0;c[J>>2]=200;K=k+8|0;c[K>>2]=I;L=Rh(w,5720,k)|0;M=c[x>>2]|0;hm(M,L)}c[k>>2]=t;I=Rh(w,5696,k)|0;c[k>>2]=5488;J=k+4|0;c[J>>2]=200;K=k+8|0;c[K>>2]=I;L=Rh(w,5720,k)|0;M=c[x>>2]|0;hm(M,L)}else if((p|0)==61){lm(f);pi(f,l,0)|0;x=f+48|0;if((c[o>>2]|0)==44){w=1;while(1){lm(f);nl(c[x>>2]|0,l);pi(f,l,0)|0;t=w+1|0;if((c[o>>2]|0)==44){w=t}else{N=t;break}}}else{N=1}w=c[x>>2]|0;if((N|0)==(h|0)){ll(w,l);tl(c[x>>2]|0,n,l);i=j;return}r=h-N|0;s=c[l>>2]|0;if((s|0)==13|(s|0)==12){v=r+1|0;u=(v|0)<0?0:v;kl(w,l,u);if((u|0)>1){gl(w,u+ -1|0)}}else if((s|0)==0){O=30}else{nl(w,l);O=30}if((O|0)==30?(r|0)>0:0){s=d[w+48|0]|0;gl(w,r);Vk(w,s,r)}if((N|0)>(h|0)){s=(c[x>>2]|0)+48|0;a[s]=r+(d[s]|0);H=l}else{H=l}}else{ki(f,61)}}while(0);h=c[f+48>>2]|0;f=(d[h+48|0]|0)+ -1|0;c[l+16>>2]=-1;c[l+20>>2]=-1;c[H>>2]=6;c[l+8>>2]=f;tl(h,n,l);i=j;return}function pi(e,f,g){e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;j=i;i=i+48|0;k=j+24|0;l=j;m=e+48|0;n=c[m>>2]|0;o=e+52|0;p=(c[o>>2]|0)+38|0;q=(b[p>>1]|0)+1<<16>>16;b[p>>1]=q;if((q&65535)>200){q=n+12|0;p=c[(c[q>>2]|0)+52>>2]|0;r=c[(c[n>>2]|0)+64>>2]|0;if((r|0)==0){s=5680;c[k>>2]=5488;t=k+4|0;c[t>>2]=200;u=k+8|0;c[u>>2]=s;v=Rh(p,5720,k)|0;w=c[q>>2]|0;hm(w,v)}c[k>>2]=r;s=Rh(p,5696,k)|0;c[k>>2]=5488;t=k+4|0;c[t>>2]=200;u=k+8|0;c[u>>2]=s;v=Rh(p,5720,k)|0;w=c[q>>2]|0;hm(w,v)}v=e+16|0;a:do{switch(c[v>>2]|0){case 289:{w=hl(n,c[e+24>>2]|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=w;x=20;break};case 45:{y=0;x=8;break};case 287:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=5;c[f+8>>2]=0;h[f+8>>3]=+h[e+24>>3];x=20;break};case 35:{y=2;x=8;break};case 271:{y=1;x=8;break};case 276:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=2;c[f+8>>2]=0;x=20;break};case 123:{qi(e,f);break};case 270:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=1;c[f+8>>2]=0;x=20;break};case 265:{lm(e);ri(e,f,0,c[e+4>>2]|0);break};case 263:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=3;c[f+8>>2]=0;x=20;break};case 280:{if((a[(c[n>>2]|0)+77|0]|0)==0){hm(e,5536)}else{w=Wk(n,38,0,1,0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=13;c[f+8>>2]=w;x=20;break a}break};default:{ni(e,f)}}}while(0);if((x|0)==8){n=c[e+4>>2]|0;lm(e);pi(e,f,8)|0;yl(c[m>>2]|0,y,f,n)}else if((x|0)==20){lm(e)}do{switch(c[v>>2]|0){case 37:{z=4;break};case 94:{z=5;break};case 282:{z=12;break};case 257:{z=13;break};case 281:{z=7;break};case 60:{z=8;break};case 45:{z=1;break};case 42:{z=2;break};case 47:{z=3;break};case 279:{z=6;break};case 284:{z=10;break};case 272:{z=14;break};case 43:{z=0;break};case 283:{z=9;break};case 62:{z=11;break};default:{A=15;B=c[o>>2]|0;C=B+38|0;D=b[C>>1]|0;E=D+ -1<<16>>16;b[C>>1]=E;i=j;return A|0}}}while(0);v=e+4|0;n=z;while(1){if((d[5504+(n<<1)|0]|0)<=(g|0)){A=n;x=39;break}z=c[v>>2]|0;lm(e);Al(c[m>>2]|0,n,f);y=pi(e,l,d[5505+(n<<1)|0]|0)|0;Bl(c[m>>2]|0,n,f,l,z);if((y|0)==15){A=15;x=39;break}else{n=y}}if((x|0)==39){B=c[o>>2]|0;C=B+38|0;D=b[C>>1]|0;E=D+ -1<<16>>16;b[C>>1]=E;i=j;return A|0}return 0}function qi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;d=i;i=i+64|0;e=d+40|0;f=d;g=a+48|0;h=c[g>>2]|0;j=c[a+4>>2]|0;k=Wk(h,11,0,0,0)|0;l=f+36|0;c[l>>2]=0;m=f+28|0;c[m>>2]=0;n=f+32|0;c[n>>2]=0;o=f+24|0;c[o>>2]=b;c[b+16>>2]=-1;c[b+20>>2]=-1;c[b>>2]=11;c[b+8>>2]=k;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=0;c[f+8>>2]=0;nl(c[g>>2]|0,b);b=a+16|0;if((c[b>>2]|0)!=123){ki(a,123)}lm(a);a:do{if((c[b>>2]|0)!=125){b:while(1){if((c[f>>2]|0)!=0?(nl(h,f),c[f>>2]=0,(c[l>>2]|0)==50):0){Dl(h,c[(c[o>>2]|0)+8>>2]|0,c[n>>2]|0,50);c[l>>2]=0}p=c[b>>2]|0;do{if((p|0)==91){ti(a,f)}else if((p|0)==288){if((nm(a)|0)==61){ti(a,f);break}pi(a,f,0)|0;q=c[g>>2]|0;r=c[n>>2]|0;if((r|0)>2147483645){s=10;break b}c[n>>2]=r+1;c[l>>2]=(c[l>>2]|0)+1}else{pi(a,f,0)|0;t=c[g>>2]|0;r=c[n>>2]|0;if((r|0)>2147483645){s=17;break b}c[n>>2]=r+1;c[l>>2]=(c[l>>2]|0)+1}}while(0);p=c[b>>2]|0;if((p|0)==59){lm(a)}else if((p|0)==44){lm(a)}else{break a}if((c[b>>2]|0)==125){break a}}if((s|0)==10){p=q+12|0;r=c[(c[p>>2]|0)+52>>2]|0;u=c[(c[q>>2]|0)+64>>2]|0;if((u|0)==0){v=5680;c[e>>2]=5656;w=e+4|0;c[w>>2]=2147483645;x=e+8|0;c[x>>2]=v;y=Rh(r,5720,e)|0;z=c[p>>2]|0;hm(z,y)}c[e>>2]=u;v=Rh(r,5696,e)|0;c[e>>2]=5656;w=e+4|0;c[w>>2]=2147483645;x=e+8|0;c[x>>2]=v;y=Rh(r,5720,e)|0;z=c[p>>2]|0;hm(z,y)}else if((s|0)==17){p=t+12|0;r=c[(c[p>>2]|0)+52>>2]|0;u=c[(c[t>>2]|0)+64>>2]|0;if((u|0)==0){A=5680;c[e>>2]=5656;B=e+4|0;c[B>>2]=2147483645;C=e+8|0;c[C>>2]=A;D=Rh(r,5720,e)|0;E=c[p>>2]|0;hm(E,D)}c[e>>2]=u;A=Rh(r,5696,e)|0;c[e>>2]=5656;B=e+4|0;c[B>>2]=2147483645;C=e+8|0;c[C>>2]=A;D=Rh(r,5720,e)|0;E=c[p>>2]|0;hm(E,D)}}}while(0);mi(a,125,123,j);j=c[l>>2]|0;do{if((j|0)!=0){a=c[f>>2]|0;if((a|0)==0){F=j}else if((a|0)==13|(a|0)==12){kl(h,f,-1);Dl(h,c[(c[o>>2]|0)+8>>2]|0,c[n>>2]|0,-1);c[n>>2]=(c[n>>2]|0)+ -1;break}else{nl(h,f);F=c[l>>2]|0}Dl(h,c[(c[o>>2]|0)+8>>2]|0,c[n>>2]|0,F)}}while(0);F=c[(c[(c[h>>2]|0)+12>>2]|0)+(k<<2)>>2]&8388607;o=(Kh(c[n>>2]|0)|0)<<23|F;c[(c[(c[h>>2]|0)+12>>2]|0)+(k<<2)>>2]=o;F=(Kh(c[m>>2]|0)|0)<<14&8372224|o&-8372225;c[(c[(c[h>>2]|0)+12>>2]|0)+(k<<2)>>2]=F;i=d;return}function ri(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=i;i=i+64|0;k=j+12|0;l=j;m=e+48|0;n=c[m>>2]|0;o=e+52|0;p=c[o>>2]|0;q=c[n>>2]|0;r=n+36|0;n=q+56|0;s=c[n>>2]|0;t=q+16|0;if(((c[r>>2]|0)>=(s|0)?(u=sh(p,c[t>>2]|0,n,4,262143,5640)|0,c[t>>2]=u,v=c[n>>2]|0,(s|0)<(v|0)):0)?(n=s+1|0,c[u+(s<<2)>>2]=0,(n|0)<(v|0)):0){s=n;do{n=s;s=s+1|0;c[(c[t>>2]|0)+(n<<2)>>2]=0}while((s|0)!=(v|0))}v=Rf(p)|0;s=c[r>>2]|0;c[r>>2]=s+1;c[(c[t>>2]|0)+(s<<2)>>2]=v;if(!((a[v+5|0]&3)==0)?!((a[q+5|0]&4)==0):0){Uf(p,q,v)}c[k>>2]=v;c[v+64>>2]=h;q=c[o>>2]|0;c[k+8>>2]=c[m>>2];o=k+12|0;c[o>>2]=e;c[m>>2]=k;c[k+20>>2]=0;c[k+24>>2]=0;c[k+28>>2]=-1;c[k+32>>2]=0;c[k+36>>2]=0;p=k+44|0;s=e+64|0;c[p+0>>2]=0;a[p+4|0]=0;c[k+40>>2]=c[(c[s>>2]|0)+4>>2];s=k+16|0;c[s>>2]=0;c[v+36>>2]=c[e+68>>2];a[v+78|0]=2;v=oj(q)|0;c[k+4>>2]=v;p=q+8|0;t=c[p>>2]|0;c[t>>2]=v;c[t+8>>2]=69;t=(c[p>>2]|0)+16|0;c[p>>2]=t;if(((c[q+24>>2]|0)-t|0)<16){vf(q,0)}a[l+10|0]=0;a[l+8|0]=a[k+46|0]|0;q=c[(c[o>>2]|0)+64>>2]|0;b[l+4>>1]=c[q+28>>2];b[l+6>>1]=c[q+16>>2];a[l+9|0]=0;c[l>>2]=c[s>>2];c[s>>2]=l;l=e+16|0;if((c[l>>2]|0)!=40){ki(e,40)}lm(e);if((g|0)!=0){si(e,jm(e,5584,4)|0);g=c[m>>2]|0;s=g+46|0;q=(d[s]|0)+1|0;a[s]=q;c[(c[(c[g>>2]|0)+24>>2]|0)+((b[(c[c[(c[g+12>>2]|0)+64>>2]>>2]|0)+((q&255)+ -1+(c[g+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[g+20>>2]}g=c[m>>2]|0;q=c[g>>2]|0;s=q+77|0;a[s]=0;o=c[l>>2]|0;a:do{if((o|0)!=41){t=e+24|0;p=o;v=0;while(1){if((p|0)==280){w=18;break}else if((p|0)!=288){w=19;break}r=c[t>>2]|0;lm(e);si(e,r);r=v+1|0;if((a[s]|0)!=0){x=r;break a}if((c[l>>2]|0)!=44){x=r;break a}lm(e);p=c[l>>2]|0;v=r}if((w|0)==18){lm(e);a[s]=1;x=v;break}else if((w|0)==19){hm(e,5592)}}else{x=0}}while(0);s=c[m>>2]|0;o=s+46|0;p=(d[o]|0)+x|0;a[o]=p;if((x|0)!=0?(t=s+20|0,r=s+40|0,n=c[(c[s>>2]|0)+24>>2]|0,u=c[c[(c[s+12>>2]|0)+64>>2]>>2]|0,c[n+((b[u+((p&255)-x+(c[r>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[t>>2],p=x+ -1|0,(p|0)!=0):0){x=p;do{c[n+((b[u+((d[o]|0)-x+(c[r>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[t>>2];x=x+ -1|0}while((x|0)!=0)}x=g+46|0;a[q+76|0]=a[x]|0;gl(g,d[x]|0);if((c[l>>2]|0)!=41){ki(e,41)}lm(e);b:while(1){x=c[l>>2]|0;switch(x|0){case 277:case 286:case 262:case 261:case 260:{w=30;break b;break};default:{}}li(e);if((x|0)==274){w=30;break}}if((w|0)==30){c[(c[k>>2]|0)+68>>2]=c[e+4>>2];mi(e,262,265,h);h=c[(c[m>>2]|0)+8>>2]|0;m=Yk(h,37,0,(c[h+36>>2]|0)+ -1|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=11;c[f+8>>2]=m;nl(h,f);fi(e);i=j;return}}function si(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+16|0;g=f;h=c[d+48>>2]|0;j=c[d+64>>2]|0;k=c[h>>2]|0;l=k+60|0;m=c[l>>2]|0;n=h+44|0;if((b[n>>1]|0)<(m|0)){o=k+24|0;p=m}else{q=k+24|0;c[q>>2]=sh(c[d+52>>2]|0,c[q>>2]|0,l,12,32767,5624)|0;o=q;p=c[l>>2]|0}if((m|0)<(p|0)){l=m;do{m=l;l=l+1|0;c[(c[o>>2]|0)+(m*12|0)>>2]=0}while((l|0)!=(p|0))}p=b[n>>1]|0;c[(c[o>>2]|0)+((p<<16>>16)*12|0)>>2]=e;if(!((a[e+5|0]&3)==0)?!((a[k+5|0]&4)==0):0){Uf(c[d+52>>2]|0,k,e);r=b[n>>1]|0}else{r=p}b[n>>1]=r+1<<16>>16;n=j+4|0;p=c[n>>2]|0;if((p+1-(c[h+40>>2]|0)|0)>200){e=h+12|0;k=c[(c[e>>2]|0)+52>>2]|0;o=c[(c[h>>2]|0)+64>>2]|0;if((o|0)==0){s=5680;c[g>>2]=5624;t=g+4|0;c[t>>2]=200;u=g+8|0;c[u>>2]=s;v=Rh(k,5720,g)|0;w=c[e>>2]|0;hm(w,v)}c[g>>2]=o;s=Rh(k,5696,g)|0;c[g>>2]=5624;t=g+4|0;c[t>>2]=200;u=g+8|0;c[u>>2]=s;v=Rh(k,5720,g)|0;w=c[e>>2]|0;hm(w,v)}v=j+8|0;if((p+2|0)>(c[v>>2]|0)){w=sh(c[d+52>>2]|0,c[j>>2]|0,v,2,2147483645,5624)|0;c[j>>2]=w;x=c[n>>2]|0;y=w;z=x+1|0;c[n>>2]=z;A=y+(x<<1)|0;b[A>>1]=r;i=f;return}else{x=p;y=c[j>>2]|0;z=x+1|0;c[n>>2]=z;A=y+(x<<1)|0;b[A>>1]=r;i=f;return}}function ti(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+64|0;f=e+48|0;g=e+24|0;h=e;j=b+48|0;k=c[j>>2]|0;l=k+48|0;m=a[l]|0;n=b+16|0;do{if((c[n>>2]|0)!=288){lm(b);pi(b,g,0)|0;rl(c[j>>2]|0,g);if((c[n>>2]|0)==93){lm(b);o=d+28|0;break}else{ki(b,93)}}else{p=d+28|0;if((c[p>>2]|0)<=2147483645){q=c[b+24>>2]|0;lm(b);r=hl(c[j>>2]|0,q)|0;c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=4;c[g+8>>2]=r;o=p;break}p=k+12|0;r=c[(c[p>>2]|0)+52>>2]|0;q=c[(c[k>>2]|0)+64>>2]|0;if((q|0)==0){s=5680;c[f>>2]=5656;t=f+4|0;c[t>>2]=2147483645;u=f+8|0;c[u>>2]=s;v=Rh(r,5720,f)|0;w=c[p>>2]|0;hm(w,v)}c[f>>2]=q;s=Rh(r,5696,f)|0;c[f>>2]=5656;t=f+4|0;c[t>>2]=2147483645;u=f+8|0;c[u>>2]=s;v=Rh(r,5720,f)|0;w=c[p>>2]|0;hm(w,v)}}while(0);c[o>>2]=(c[o>>2]|0)+1;if((c[n>>2]|0)==61){lm(b);n=sl(k,g)|0;pi(b,h,0)|0;g=c[(c[d+24>>2]|0)+8>>2]|0;Wk(k,10,g,n,sl(k,h)|0)|0;a[l]=m;i=e;return}else{ki(b,61)}}function ui(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+32|0;e=d;f=a+48|0;g=c[f>>2]|0;ql(g,b);lm(a);if((c[a+16>>2]|0)==288){h=c[a+24>>2]|0;lm(a);j=hl(c[f>>2]|0,h)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=j;xl(g,b,e);i=d;return}else{ki(a,288)}}function vi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+32|0;h=g;j=b+48|0;k=c[j>>2]|0;l=b+16|0;m=c[l>>2]|0;if((m|0)==40){lm(b);if((c[l>>2]|0)==41){c[h>>2]=0}else{pi(b,h,0)|0;if((c[l>>2]|0)==44){do{lm(b);nl(c[j>>2]|0,h);pi(b,h,0)|0}while((c[l>>2]|0)==44)}kl(k,h,-1)}mi(b,41,40,f)}else if((m|0)==289){l=hl(k,c[b+24>>2]|0)|0;c[h+16>>2]=-1;c[h+20>>2]=-1;c[h>>2]=4;c[h+8>>2]=l;lm(b)}else if((m|0)==123){qi(b,h)}else{hm(b,5752)}b=e+8|0;m=c[b>>2]|0;l=c[h>>2]|0;if((l|0)==13|(l|0)==12){n=0}else if((l|0)==0){o=13}else{nl(k,h);o=13}if((o|0)==13){n=(d[k+48|0]|0)-m|0}o=Wk(k,29,m,n,2)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=12;c[b>>2]=o;Cl(k,f);a[k+48|0]=m+1;i=g;return}function wi(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;if((e|0)==0){k=0;i=j;return k|0}l=e+12|0;m=e+40|0;n=d[e+46|0]|0;while(1){o=n+ -1|0;p=c[e>>2]|0;if((n|0)<=0){break}if((Ji(f,c[(c[p+24>>2]|0)+((b[(c[c[(c[l>>2]|0)+64>>2]>>2]|0)+((c[m>>2]|0)+o<<1)>>1]|0)*12|0)>>2]|0)|0)==0){n=o}else{q=5;break}}if((q|0)==5){c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=7;c[g+8>>2]=o;if((h|0)!=0){k=7;i=j;return k|0}h=e+16|0;do{h=c[h>>2]|0}while((d[h+8|0]|0)>(o|0));a[h+9|0]=1;k=7;i=j;return k|0}h=c[p+28>>2]|0;p=e+47|0;a:do{if((a[p]|0)!=0){o=0;while(1){n=o+1|0;if((Ji(c[h+(o<<3)>>2]|0,f)|0)!=0){break}if((n|0)<(d[p]|0)){o=n}else{q=13;break a}}if((o|0)>=0){r=o}else{q=13}}else{q=13}}while(0);do{if((q|0)==13){if((wi(c[e+8>>2]|0,f,g,0)|0)==0){k=0;i=j;return k|0}else{r=ei(e,f,g)|0;break}}}while(0);c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=8;c[g+8>>2]=r;k=8;i=j;return k|0}function xi(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+32|0;l=k+12|0;m=k;n=e+48|0;o=c[n>>2]|0;p=o+46|0;q=(d[p]|0)+3|0;a[p]=q;r=o+20|0;s=o+12|0;t=o+40|0;u=c[(c[o>>2]|0)+24>>2]|0;v=c[c[(c[s>>2]|0)+64>>2]>>2]|0;c[u+((b[v+((q&255)+ -3+(c[t>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];c[u+((b[v+((d[p]|0)+ -2+(c[t>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];c[u+((b[v+((d[p]|0)+ -1+(c[t>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];r=e+16|0;if((c[r>>2]|0)!=259){ki(e,259)}lm(e);t=(j|0)!=0;if(t){w=Yk(o,33,f,131070)|0}else{w=Xk(o)|0}a[m+10|0]=0;a[m+8|0]=a[p]|0;p=c[(c[s>>2]|0)+64>>2]|0;b[m+4>>1]=c[p+28>>2];b[m+6>>1]=c[p+16>>2];a[m+9|0]=0;p=o+16|0;c[m>>2]=c[p>>2];c[p>>2]=m;m=c[n>>2]|0;p=m+46|0;s=(d[p]|0)+h|0;a[p]=s;if((h|0)!=0?(j=m+20|0,v=m+40|0,u=c[(c[m>>2]|0)+24>>2]|0,q=c[c[(c[m+12>>2]|0)+64>>2]>>2]|0,c[u+((b[q+((s&255)-h+(c[v>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[j>>2],s=h+ -1|0,(s|0)!=0):0){m=s;do{c[u+((b[q+((d[p]|0)-m+(c[v>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[j>>2];m=m+ -1|0}while((m|0)!=0)}gl(o,h);m=c[n>>2]|0;a[l+10|0]=0;a[l+8|0]=a[m+46|0]|0;n=c[(c[m+12>>2]|0)+64>>2]|0;b[l+4>>1]=c[n+28>>2];b[l+6>>1]=c[n+16>>2];a[l+9|0]=0;n=m+16|0;c[l>>2]=c[n>>2];c[n>>2]=l;a:do{l=c[r>>2]|0;switch(l|0){case 277:case 286:case 262:case 261:case 260:{break a;break};default:{}}li(e)}while((l|0)!=274);gi(m);gi(o);bl(o,w);if(t){x=Yk(o,32,f,131070)|0;y=w+1|0;al(o,x,y);Cl(o,g);i=k;return}else{Wk(o,34,f,0,h)|0;Cl(o,g);x=Yk(o,35,f+2|0,131070)|0;y=w+1|0;al(o,x,y);Cl(o,g);i=k;return}}function yi(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+48|0;g=f+24|0;h=f;j=d+48|0;k=c[j>>2]|0;lm(d);pi(d,h,0)|0;l=d+16|0;if((c[l>>2]|0)!=275){ki(d,275)}lm(d);m=c[l>>2]|0;do{if((m|0)==258|(m|0)==266){wl(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=c[(c[k+12>>2]|0)+64>>2]|0;b[g+4>>1]=c[n+28>>2];b[g+6>>1]=c[n+16>>2];a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;n=c[h+16>>2]|0;o=c[d+4>>2]|0;p=(c[l>>2]|0)==266;lm(d);do{if(p){if((c[l>>2]|0)==288){q=c[d+24>>2]|0;lm(d);r=q;break}else{ki(d,288)}}else{r=Ni(c[d+52>>2]|0,5432)|0}}while(0);p=c[d+64>>2]|0;q=p+12|0;s=p+16|0;t=c[s>>2]|0;u=p+20|0;if((t|0)<(c[u>>2]|0)){v=c[q>>2]|0}else{p=sh(c[d+52>>2]|0,c[q>>2]|0,u,16,32767,5440)|0;c[q>>2]=p;v=p}c[v+(t<<4)>>2]=r;p=c[q>>2]|0;c[p+(t<<4)+8>>2]=o;a[p+(t<<4)+12|0]=a[(c[j>>2]|0)+46|0]|0;c[(c[q>>2]|0)+(t<<4)+4>>2]=n;c[s>>2]=(c[s>>2]|0)+1;ii(d,t)|0;a:while(1){switch(c[l>>2]|0){case 285:case 59:{break};case 286:case 262:case 261:case 260:{break a;break};default:{w=16;break a}}li(d)}if((w|0)==16){x=Xk(k)|0;break}gi(k);i=f;return}else{vl(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=c[(c[k+12>>2]|0)+64>>2]|0;b[g+4>>1]=c[n+28>>2];b[g+6>>1]=c[n+16>>2];a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;x=c[h+20>>2]|0}}while(0);b:do{h=c[l>>2]|0;switch(h|0){case 277:case 286:case 262:case 261:case 260:{break b;break};default:{}}li(d)}while((h|0)!=274);gi(k);if(((c[l>>2]|0)+ -260|0)>>>0<2){Zk(k,e,Xk(k)|0)}bl(k,x);i=f;return}function zi(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+12|0;e=a+8|0;c[e>>2]=(c[d>>2]|0)-b+(c[e>>2]|0);c[d>>2]=b;return}function Ai(a){a=a|0;var b=0,d=0,e=0;b=i;d=uh(a,0,0,40)|0;e=a+16|0;c[(c[e>>2]|0)+12>>2]=d;c[d+8>>2]=c[e>>2];c[d+12>>2]=0;i=b;return d|0}function Bi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=(c[a+16>>2]|0)+12|0;e=c[d>>2]|0;c[d>>2]=0;if((e|0)==0){i=b;return}else{f=e}do{e=f;f=c[f+12>>2]|0;uh(a,e,40,0)|0}while((f|0)!=0);i=b;return}function Ci(d){d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=d+12|0;if((c[(c[f>>2]|0)+12>>2]|0)>0){gg(d)}g=Zf(d,8,112,0,0)|0;h=d+8|0;j=c[h>>2]|0;c[j>>2]=g;c[j+8>>2]=72;c[h>>2]=(c[h>>2]|0)+16;c[g+12>>2]=c[f>>2];f=g+28|0;c[f>>2]=0;h=g+16|0;c[h>>2]=0;j=g+32|0;c[j>>2]=0;c[g+64>>2]=0;b[g+38>>1]=0;k=g+52|0;c[k>>2]=0;l=g+40|0;a[l]=0;m=g+44|0;c[m>>2]=0;a[g+41|0]=1;n=g+48|0;c[n>>2]=0;c[g+56>>2]=0;b[g+36>>1]=1;a[g+6|0]=0;c[g+68>>2]=0;a[l]=a[d+40|0]|0;l=c[d+44>>2]|0;c[m>>2]=l;c[k>>2]=c[d+52>>2];c[n>>2]=l;l=uh(d,0,0,640)|0;c[f>>2]=l;c[j>>2]=40;f=0;do{c[l+(f<<4)+8>>2]=0;f=f+1|0}while((f|0)!=40);c[g+24>>2]=l+((c[j>>2]|0)+ -5<<4);j=g+72|0;c[g+80>>2]=0;c[g+84>>2]=0;a[g+90|0]=0;c[j>>2]=l;c[g+8>>2]=l+16;c[l+8>>2]=0;c[g+76>>2]=l+336;c[h>>2]=j;i=e;return g|0}function Di(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=b+28|0;Qf(b,c[e>>2]|0);f=c[e>>2]|0;if((f|0)==0){uh(a,b,112,0)|0;i=d;return}c[b+16>>2]=b+72;g=b+84|0;h=c[g>>2]|0;c[g>>2]=0;if((h|0)==0){j=f}else{f=h;do{h=f;f=c[f+12>>2]|0;uh(b,h,40,0)|0}while((f|0)!=0);j=c[e>>2]|0}uh(b,j,c[b+32>>2]<<4,0)|0;uh(a,b,112,0)|0;i=d;return}function Ei(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;g=f+8|0;h=f;j=vc[d&3](e,0,8,400)|0;if((j|0)==0){k=0;i=f;return k|0}l=j+112|0;c[j>>2]=0;a[j+4|0]=8;a[j+172|0]=33;a[j+5|0]=1;a[j+174|0]=0;c[j+12>>2]=l;c[j+28>>2]=0;c[j+16>>2]=0;c[j+32>>2]=0;c[j+64>>2]=0;b[j+38>>1]=0;c[j+52>>2]=0;a[j+40|0]=0;c[j+44>>2]=0;a[j+41|0]=1;c[j+48>>2]=0;c[j+56>>2]=0;b[j+36>>1]=1;a[j+6|0]=0;c[j+68>>2]=0;c[l>>2]=d;c[j+116>>2]=e;c[j+284>>2]=j;e=nb(0)|0;c[h>>2]=e;c[g>>2]=j;c[g+4>>2]=h;c[g+8>>2]=4320;c[g+12>>2]=1;c[j+168>>2]=Ki(g,16,e)|0;e=j+224|0;c[j+240>>2]=e;c[j+244>>2]=e;a[j+175|0]=0;e=j+132|0;c[j+160>>2]=0;c[j+256>>2]=0;c[j+264>>2]=0;c[j+280>>2]=0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[j+288>>2]=Sc(0)|0;a[j+173|0]=5;e=j+120|0;g=j+180|0;h=g+40|0;do{c[g>>2]=0;g=g+4|0}while((g|0)<(h|0));c[e>>2]=400;c[j+124>>2]=0;c[j+268>>2]=200;c[j+272>>2]=200;c[j+276>>2]=200;g=j+364|0;h=g+36|0;do{c[g>>2]=0;g=g+4|0}while((g|0)<(h|0));if((tf(j,7,0)|0)==0){k=j;i=f;return k|0}Gi(j);k=0;i=f;return k|0}function Fi(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e;g=c[b+12>>2]|0;h=uh(b,0,0,640)|0;c[b+28>>2]=h;j=b+32|0;c[j>>2]=40;k=0;do{c[h+(k<<4)+8>>2]=0;k=k+1|0}while((k|0)!=40);c[b+24>>2]=h+((c[j>>2]|0)+ -5<<4);j=b+72|0;c[b+80>>2]=0;c[b+84>>2]=0;a[b+90|0]=0;c[j>>2]=h;c[b+8>>2]=h+16;c[h+8>>2]=0;c[b+76>>2]=h+336;c[b+16>>2]=j;j=oj(b)|0;c[g+40>>2]=j;c[g+48>>2]=69;jj(b,j,2,0);c[f>>2]=b;h=f+8|0;c[h>>2]=72;lj(b,j,1,f);c[f>>2]=oj(b)|0;c[h>>2]=69;lj(b,j,2,f);Li(b,32);Gj(b);fm(b);f=Mi(b,6024,17)|0;c[g+180>>2]=f;b=f+5|0;a[b]=d[b]|0|32;a[g+63|0]=1;i=e;return}function Gi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;d=a+12|0;e=c[d>>2]|0;f=a+28|0;Qf(a,c[f>>2]|0);bg(a);g=c[d>>2]|0;uh(a,c[g+24>>2]|0,c[g+32>>2]<<2,0)|0;g=e+144|0;d=e+152|0;c[g>>2]=uh(a,c[g>>2]|0,c[d>>2]|0,0)|0;c[d>>2]=0;d=c[f>>2]|0;if((d|0)==0){h=c[e>>2]|0;j=e+4|0;k=c[j>>2]|0;vc[h&3](k,a,400,0)|0;i=b;return}c[a+16>>2]=a+72;g=a+84|0;l=c[g>>2]|0;c[g>>2]=0;if((l|0)==0){m=d}else{d=l;do{l=d;d=c[d+12>>2]|0;uh(a,l,40,0)|0}while((d|0)!=0);m=c[f>>2]|0}uh(a,m,c[a+32>>2]<<4,0)|0;h=c[e>>2]|0;j=e+4|0;k=c[j>>2]|0;vc[h&3](k,a,400,0)|0;i=b;return}function Hi(a){a=a|0;var b=0;b=i;Gi(c[(c[a+12>>2]|0)+172>>2]|0);i=b;return}function Ii(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=c[a+12>>2]|0;if((a|0)!=(b|0)){if((e|0)==(c[b+12>>2]|0)){f=(Sm(a+16|0,b+16|0,e)|0)==0}else{f=0}}else{f=1}i=d;return f&1|0}function Ji(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=a[b+4|0]|0;do{if(f<<24>>24==(a[d+4|0]|0)){if(f<<24>>24==4){g=(b|0)==(d|0);break}h=c[b+12>>2]|0;if((b|0)!=(d|0)){if((h|0)==(c[d+12>>2]|0)){g=(Sm(b+16|0,d+16|0,h)|0)==0}else{g=0}}else{g=1}}else{g=0}}while(0);i=e;return g&1|0}function Ki(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=c^b;c=(b>>>5)+1|0;if(c>>>0>b>>>0){g=f;i=e;return g|0}else{h=f;j=b}while(1){b=(h<<5)+(h>>>2)+(d[a+(j+ -1)|0]|0)^h;f=j-c|0;if(f>>>0<c>>>0){g=b;break}else{h=b;j=f}}i=e;return g|0}function Li(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;f=c[b+12>>2]|0;g=f+24|0;ag(b,-5);h=f+32|0;f=c[h>>2]|0;a:do{if((f|0)<(d|0)){if((d+1|0)>>>0>1073741823){th(b)}j=uh(b,c[g>>2]|0,f<<2,d<<2)|0;c[g>>2]=j;k=c[h>>2]|0;if((k|0)<(d|0)){l=j;j=k;while(1){c[l+(j<<2)>>2]=0;m=j+1|0;if((m|0)==(d|0)){n=k;break a}l=c[g>>2]|0;j=m}}else{n=k}}else{n=f}}while(0);if((n|0)>0){f=d+ -1|0;j=n;l=0;while(1){m=(c[g>>2]|0)+(l<<2)|0;o=c[m>>2]|0;c[m>>2]=0;if((o|0)==0){p=j}else{m=o;do{o=m;m=c[m>>2]|0;q=c[o+8>>2]&f;c[o>>2]=c[(c[g>>2]|0)+(q<<2)>>2];c[(c[g>>2]|0)+(q<<2)>>2]=o;q=o+5|0;a[q]=a[q]&191}while((m|0)!=0);p=c[h>>2]|0}m=l+1|0;if((m|0)<(p|0)){j=p;l=m}else{r=p;break}}}else{r=n}if((r|0)<=(d|0)){c[h>>2]=d;i=e;return}if((d+1|0)>>>0>1073741823){th(b)}c[g>>2]=uh(b,c[g>>2]|0,r<<2,d<<2)|0;c[h>>2]=d;i=e;return}function Mi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;if(!(f>>>0<41)){if((f+1|0)>>>0>4294967277){th(b)}h=c[(c[b+12>>2]|0)+56>>2]|0;j=Zf(b,20,f+17|0,0,0)|0;c[j+12>>2]=f;c[j+8>>2]=h;a[j+6|0]=0;h=j+16|0;an(h|0,e|0,f|0)|0;a[h+f|0]=0;k=j;i=g;return k|0}j=c[b+12>>2]|0;h=c[j+56>>2]^f;l=(f>>>5)+1|0;if(l>>>0>f>>>0){m=h}else{n=h;h=f;while(1){o=(n<<5)+(n>>>2)+(d[e+(h+ -1)|0]|0)^n;p=h-l|0;if(p>>>0<l>>>0){m=o;break}else{n=o;h=p}}}h=j+32|0;n=c[h>>2]|0;l=j+24|0;p=c[l>>2]|0;o=c[p+((n+ -1&m)<<2)>>2]|0;a:do{if((o|0)!=0){q=o;while(1){if(((m|0)==(c[q+8>>2]|0)?(c[q+12>>2]|0)==(f|0):0)?(Sm(e,q+16|0,f)|0)==0:0){break}r=c[q>>2]|0;if((r|0)==0){break a}else{q=r}}r=q+5|0;s=(d[r]|0)^3;if((((d[j+60|0]|0)^3)&s|0)!=0){k=q;i=g;return k|0}a[r]=s;k=q;i=g;return k|0}}while(0);o=j+28|0;if((c[o>>2]|0)>>>0>=n>>>0&(n|0)<1073741823){Li(b,n<<1);t=c[h>>2]|0;u=c[l>>2]|0}else{t=n;u=p}p=Zf(b,4,f+17|0,u+((t+ -1&m)<<2)|0,0)|0;c[p+12>>2]=f;c[p+8>>2]=m;a[p+6|0]=0;m=p+16|0;an(m|0,e|0,f|0)|0;a[m+f|0]=0;c[o>>2]=(c[o>>2]|0)+1;k=p;i=g;return k|0}function Ni(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=Mi(a,b,Zm(b|0)|0)|0;i=c;return d|0}function Oi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if(b>>>0>4294967269){th(a)}else{f=Zf(a,7,b+24|0,0,0)|0;c[f+16>>2]=b;c[f+8>>2]=0;c[f+12>>2]=d;i=e;return f|0}return 0}function Pi(a){a=a|0;var b=0;b=i;Gd(a,0,14);Ve(a,6048,0);Gd(a,0,1);td(a,6168,0)|0;_c(a,-2);Od(a,-2)|0;Vc(a,-2);_c(a,-2);Ld(a,-2,6176);Vc(a,-2);i=b;return 1}function Qi(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;e=b;f=b+4|0;g=se(a,1,f)|0;h=Ae(a,2,1)|0;j=c[f>>2]|0;if(!((h|0)>-1)){if(j>>>0<(0-h|0)>>>0){k=0}else{k=h+1+j|0}}else{k=h}h=Ae(a,3,k)|0;j=c[f>>2]|0;if(!((h|0)>-1)){if(j>>>0<(0-h|0)>>>0){l=0}else{l=h+1+j|0}}else{l=h}h=(k|0)==0?1:k;f=l>>>0>j>>>0?j:l;if(h>>>0>f>>>0){m=0;i=b;return m|0}n=f-h+1|0;if((f|0)==-1){m=he(a,7072,e)|0;i=b;return m|0}te(a,n,7072);if((n|0)<=0){m=n;i=b;return m|0}e=h+ -1|0;h=~l;l=~j;j=0-(h>>>0>l>>>0?h:l)-(k>>>0>1?k:1)|0;k=0;while(1){rd(a,d[g+(e+k)|0]|0);l=k+1|0;if((l|0)==(j|0)){m=n;break}else{k=l}}i=b;return m|0}function Ri(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;c=i;i=i+1040|0;d=c;e=Uc(b)|0;f=Ie(b,d,e)|0;if((e|0)<1){Fe(d,e);i=c;return 1}else{g=1}while(1){h=ye(b,g)|0;if((h&255|0)!=(h|0)){ge(b,g,7048)|0}a[f+(g+ -1)|0]=h;if((g|0)==(e|0)){break}else{g=g+1|0}}Fe(d,e);i=c;return 1}function Si(a){a=a|0;var b=0,c=0,d=0;b=i;i=i+1056|0;c=b+8|0;ue(a,1,6);Vc(a,1);He(a,c);if((Vd(a,2,c)|0)==0){Ee(c);d=1;i=b;return d|0}else{d=he(a,7016,b)|0;i=b;return d|0}return 0}function Ti(a){a=a|0;var b=0,c=0;b=i;c=cj(a,1)|0;i=b;return c|0}function Ui(b){b=b|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0.0,R=0.0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+1104|0;f=e;g=e+1060|0;j=e+1082|0;l=e+1056|0;m=e+16|0;n=e+1064|0;o=e+8|0;p=Uc(b)|0;q=se(b,1,l)|0;r=c[l>>2]|0;l=q+r|0;He(b,m);a:do{if((r|0)>0){s=m+8|0;t=m+4|0;u=n+1|0;v=1;w=q;b:while(1){x=w;while(1){y=a[x]|0;if(y<<24>>24==37){z=x+1|0;if((a[z]|0)!=37){break}A=c[s>>2]|0;if(A>>>0<(c[t>>2]|0)>>>0){B=A;C=37}else{Be(m,1)|0;B=c[s>>2]|0;C=a[z]|0}c[s>>2]=B+1;a[(c[m>>2]|0)+B|0]=C;D=x+2|0}else{A=c[s>>2]|0;if(A>>>0<(c[t>>2]|0)>>>0){E=A;F=y}else{Be(m,1)|0;E=c[s>>2]|0;F=a[x]|0}c[s>>2]=E+1;a[(c[m>>2]|0)+E|0]=F;D=x+1|0}if(D>>>0<l>>>0){x=D}else{break a}}x=Be(m,512)|0;y=v;v=v+1|0;if((y|0)>=(p|0)){ge(b,v,6776)|0}y=a[z]|0;c:do{if(y<<24>>24==0){G=0;H=z}else{A=y;I=z;while(1){J=I+1|0;if((vm(6928,A<<24>>24,6)|0)==0){G=A;H=I;break c}K=a[J]|0;if(K<<24>>24==0){G=0;H=J;break}else{A=K;I=J}}}}while(0);y=z;if((H-y|0)>>>0>5){he(b,6936,f)|0;L=a[H]|0}else{L=G}I=((L&255)+ -48|0)>>>0<10?H+1|0:H;A=((d[I]|0)+ -48|0)>>>0<10?I+1|0:I;I=a[A]|0;if(I<<24>>24==46){J=A+1|0;K=((d[J]|0)+ -48|0)>>>0<10?A+2|0:J;J=((d[K]|0)+ -48|0)>>>0<10?K+1|0:K;M=a[J]|0;N=J}else{M=I;N=A}if(((M&255)+ -48|0)>>>0<10){he(b,6968,f)|0}a[n]=37;A=N-y|0;an(u|0,z|0,A+1|0)|0;a[n+(A+2)|0]=0;w=N+1|0;O=a[N]|0;d:do{switch(O|0){case 99:{c[f>>2]=ye(b,v)|0;P=jb(x|0,n|0,f|0)|0;break};case 88:case 120:case 117:case 111:{Q=+we(b,v);A=~~Q>>>0;R=Q- +(A>>>0);if(!(R>-1.0&R<1.0)){ge(b,v,6824)|0}y=Zm(n|0)|0;I=n+(y+ -1)|0;J=a[I]|0;a[I]=108;a[I+1|0]=0;a[n+y|0]=J;a[n+(y+1)|0]=0;c[f>>2]=A;P=jb(x|0,n|0,f|0)|0;break};case 105:case 100:{R=+we(b,v);A=~~R;Q=R- +(A|0);if(!(Q>-1.0&Q<1.0)){ge(b,v,6792)|0}y=Zm(n|0)|0;J=n+(y+ -1)|0;I=a[J]|0;a[J]=108;a[J+1|0]=0;a[n+y|0]=I;a[n+(y+1)|0]=0;c[f>>2]=A;P=jb(x|0,n|0,f|0)|0;break};case 71:case 103:case 102:case 69:case 101:{a[n+(Zm(n|0)|0)|0]=0;Q=+we(b,v);h[k>>3]=Q;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];P=jb(x|0,n|0,f|0)|0;break};case 113:{A=se(b,v,g)|0;y=c[s>>2]|0;if(y>>>0<(c[t>>2]|0)>>>0){S=y}else{Be(m,1)|0;S=c[s>>2]|0}c[s>>2]=S+1;a[(c[m>>2]|0)+S|0]=34;y=c[g>>2]|0;c[g>>2]=y+ -1;if((y|0)!=0){y=A;while(1){A=a[y]|0;do{if(A<<24>>24==0){T=0;U=44}else if(A<<24>>24==10|A<<24>>24==92|A<<24>>24==34){I=c[s>>2]|0;if(I>>>0<(c[t>>2]|0)>>>0){V=I}else{Be(m,1)|0;V=c[s>>2]|0}c[s>>2]=V+1;a[(c[m>>2]|0)+V|0]=92;I=c[s>>2]|0;if(I>>>0<(c[t>>2]|0)>>>0){W=I}else{Be(m,1)|0;W=c[s>>2]|0}I=a[y]|0;c[s>>2]=W+1;a[(c[m>>2]|0)+W|0]=I}else{if((Hb(A&255|0)|0)!=0){T=a[y]|0;U=44;break}I=c[s>>2]|0;if(I>>>0<(c[t>>2]|0)>>>0){X=I}else{Be(m,1)|0;X=c[s>>2]|0}I=a[y]|0;c[s>>2]=X+1;a[(c[m>>2]|0)+X|0]=I}}while(0);if((U|0)==44){U=0;A=T&255;if(((d[y+1|0]|0)+ -48|0)>>>0<10){c[f>>2]=A;jb(j|0,6920,f|0)|0}else{c[f>>2]=A;jb(j|0,6912,f|0)|0}De(m,j)}A=c[g>>2]|0;c[g>>2]=A+ -1;if((A|0)==0){break}else{y=y+1|0}}}y=c[s>>2]|0;if(y>>>0<(c[t>>2]|0)>>>0){Y=y}else{Be(m,1)|0;Y=c[s>>2]|0}c[s>>2]=Y+1;a[(c[m>>2]|0)+Y|0]=34;P=0;break};case 115:{y=Re(b,v,o)|0;if((xm(n,46)|0)==0?(c[o>>2]|0)>>>0>99:0){Ge(m);P=0;break d}c[f>>2]=y;y=jb(x|0,n|0,f|0)|0;Vc(b,-2);P=y;break};default:{break b}}}while(0);c[s>>2]=(c[s>>2]|0)+P;if(!(w>>>0<l>>>0)){break a}}c[f>>2]=O;Z=he(b,6872,f)|0;i=e;return Z|0}}while(0);Ee(m);Z=1;i=e;return Z|0}function Vi(a){a=a|0;var b=0;b=i;se(a,1,0)|0;se(a,2,0)|0;Vc(a,2);rd(a,0);xd(a,164,3);i=b;return 1}function Wi(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;d=i;i=i+1344|0;e=d;f=d+1336|0;g=d+1332|0;h=d+1328|0;j=d+1048|0;k=d+8|0;l=se(b,1,g)|0;m=se(b,2,h)|0;n=$c(b,3)|0;o=Ae(b,4,(c[g>>2]|0)+1|0)|0;p=(a[m]|0)==94;if(!((n+ -3|0)>>>0<2|(n|0)==6|(n|0)==5)){ge(b,3,6656)|0}He(b,k);if(p){q=(c[h>>2]|0)+ -1|0;c[h>>2]=q;r=q;s=m+1|0}else{r=c[h>>2]|0;s=m}m=j+16|0;c[m>>2]=b;c[j>>2]=200;h=j+4|0;c[h>>2]=l;q=j+8|0;c[q>>2]=l+(c[g>>2]|0);c[j+12>>2]=s+r;r=j+20|0;g=k+8|0;t=k+4|0;u=j+28|0;v=j+24|0;w=0;x=l;while(1){if(!(w>>>0<o>>>0)){y=w;z=x;A=48;break}c[r>>2]=0;l=dj(j,x,s)|0;if((l|0)!=0){B=w+1|0;C=c[m>>2]|0;if((n|0)==5){do{if((c[r>>2]|0)>0){D=c[u>>2]|0;if(!((D|0)==-1)){E=c[v>>2]|0;if((D|0)==-2){rd(C,E+1-(c[h>>2]|0)|0);break}else{F=C;G=E}}else{he(C,6376,e)|0;F=c[m>>2]|0;G=c[v>>2]|0}td(F,G,D)|0}else{td(C,x,l-x|0)|0}}while(0);Cd(C,3);A=37}else if((n|0)!=6){D=kd(C,3,f)|0;if((c[f>>2]|0)!=0){E=l-x|0;H=0;do{I=D+H|0;J=a[I]|0;do{if(J<<24>>24==37){K=H+1|0;L=D+K|0;M=a[L]|0;N=M<<24>>24;if(((M&255)+ -48|0)>>>0<10){if(M<<24>>24==48){Ce(k,x,E);O=K;break}else{ej(j,N+ -49|0,x,l);Ge(k);O=K;break}}if(!(M<<24>>24==37)){M=c[m>>2]|0;c[e>>2]=37;he(M,6728,e)|0}M=c[g>>2]|0;if(M>>>0<(c[t>>2]|0)>>>0){P=M}else{Be(k,1)|0;P=c[g>>2]|0}M=a[L]|0;c[g>>2]=P+1;a[(c[k>>2]|0)+P|0]=M;O=K}else{K=c[g>>2]|0;if(K>>>0<(c[t>>2]|0)>>>0){Q=K;R=J}else{Be(k,1)|0;Q=c[g>>2]|0;R=a[I]|0}c[g>>2]=Q+1;a[(c[k>>2]|0)+Q|0]=R;O=H}}while(0);H=O+1|0}while(H>>>0<(c[f>>2]|0)>>>0)}}else{_c(C,3);H=c[r>>2]|0;E=(H|0)!=0|(x|0)==0?H:1;te(c[m>>2]|0,E,6328);if((E|0)>0){H=0;do{ej(j,H,x,l);H=H+1|0}while((H|0)!=(E|0))}Rd(C,E,1,0,0);A=37}if((A|0)==37){A=0;if((jd(C,-1)|0)!=0){if((dd(C,-1)|0)==0){c[e>>2]=ad(C,$c(C,-1)|0)|0;he(C,6688,e)|0}}else{Vc(C,-2);td(C,x,l-x|0)|0}Ge(k)}if(l>>>0>x>>>0){S=B;T=l}else{U=B;A=43}}else{U=w;A=43}if((A|0)==43){A=0;if(!(x>>>0<(c[q>>2]|0)>>>0)){y=U;z=x;A=48;break}H=c[g>>2]|0;if(H>>>0<(c[t>>2]|0)>>>0){V=H}else{Be(k,1)|0;V=c[g>>2]|0}H=a[x]|0;c[g>>2]=V+1;a[(c[k>>2]|0)+V|0]=H;S=U;T=x+1|0}if(p){y=S;z=T;A=48;break}else{w=S;x=T}}if((A|0)==48){Ce(k,z,(c[q>>2]|0)-z|0);Ee(k);rd(b,y);i=d;return 2}return 0}function Xi(a){a=a|0;var b=0,d=0;b=i;i=i+16|0;d=b;se(a,1,d)|0;rd(a,c[d>>2]|0);i=b;return 1}function Yi(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1056|0;f=e+1040|0;g=e;h=se(b,1,f)|0;j=Ie(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;Fe(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=dn(d[h+l|0]|0|0)|0;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}Fe(g,k);i=e;return 1}function Zi(a){a=a|0;var b=0,c=0;b=i;c=cj(a,0)|0;i=b;return c|0}function _i(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+1056|0;d=b;e=b+1044|0;f=b+1040|0;g=se(a,1,e)|0;h=ye(a,2)|0;j=re(a,3,6168,f)|0;if((h|0)<1){td(a,6168,0)|0;k=1;i=b;return k|0}l=c[e>>2]|0;m=c[f>>2]|0;n=m+l|0;if(!(n>>>0<l>>>0)?n>>>0<(2147483647/(h>>>0)|0)>>>0:0){n=(da(m,h+ -1|0)|0)+(da(l,h)|0)|0;l=Ie(a,d,n)|0;an(l|0,g|0,c[e>>2]|0)|0;if((h|0)>1){m=h;h=l;while(1){m=m+ -1|0;l=c[e>>2]|0;o=h+l|0;p=c[f>>2]|0;if((p|0)==0){q=l;r=o}else{an(o|0,j|0,p|0)|0;q=c[e>>2]|0;r=h+((c[f>>2]|0)+l)|0}an(r|0,g|0,q|0)|0;if((m|0)<=1){break}else{h=r}}}Fe(d,n);k=1;i=b;return k|0}k=he(a,6296,d)|0;i=b;return k|0}function $i(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+1056|0;e=d+1040|0;f=d;g=se(b,1,e)|0;h=Ie(b,f,c[e>>2]|0)|0;b=c[e>>2]|0;if((b|0)==0){j=0;Fe(f,j);i=d;return 1}else{k=b;l=0}while(1){a[h+l|0]=a[g+(k+~l)|0]|0;b=l+1|0;m=c[e>>2]|0;if(b>>>0<m>>>0){k=m;l=b}else{j=m;break}}Fe(f,j);i=d;return 1}function aj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+16|0;d=b;e=se(a,1,d)|0;f=ye(a,2)|0;g=c[d>>2]|0;if(!((f|0)>-1)){if(g>>>0<(0-f|0)>>>0){h=0}else{h=f+1+g|0}}else{h=f}f=Ae(a,3,-1)|0;g=c[d>>2]|0;if(!((f|0)>-1)){if(g>>>0<(0-f|0)>>>0){j=0}else{j=f+1+g|0}}else{j=f}f=(h|0)==0?1:h;h=j>>>0>g>>>0?g:j;if(f>>>0>h>>>0){td(a,6168,0)|0;i=b;return 1}else{td(a,e+(f+ -1)|0,1-f+h|0)|0;i=b;return 1}return 0}function bj(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1056|0;f=e+1040|0;g=e;h=se(b,1,f)|0;j=Ie(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;Fe(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=hc(d[h+l|0]|0|0)|0;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}Fe(g,k);i=e;return 1}function cj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+288|0;f=e+284|0;g=e+280|0;h=e;j=se(b,1,f)|0;k=se(b,2,g)|0;l=Ae(b,3,1)|0;m=c[f>>2]|0;if(!((l|0)>-1)){if(m>>>0<(0-l|0)>>>0){n=1}else{o=l+1+m|0;p=4}}else{o=l;p=4}if((p|0)==4){if((o|0)!=0){if(o>>>0>(m+1|0)>>>0){pd(b);q=1;i=e;return q|0}else{n=o}}else{n=1}}o=(d|0)!=0;a:do{if(o){d=(jd(b,4)|0)==0;m=c[g>>2]|0;if(d){d=0;do{l=k+d|0;if((Am(l,6640)|0)!=0){p=20;break a}d=d+1+(Zm(l|0)|0)|0}while(!(d>>>0>m>>>0))}d=j+(n+ -1)|0;l=(c[f>>2]|0)-n+1|0;b:do{if((m|0)==0){if((d|0)==0){break a}else{r=d}}else{if(m>>>0>l>>>0){break a}s=m+ -1|0;if((s|0)==(l|0)){break a}t=a[k]|0;u=k+1|0;v=l-s|0;w=d;while(1){x=vm(w,t,v)|0;if((x|0)==0){break a}y=w;w=x+1|0;if((Sm(w,u,s)|0)==0){r=x;break b}x=w;z=y+v|0;if((z|0)==(x|0)){break a}else{v=z-x|0}}}}while(0);d=r-j|0;rd(b,d+1|0);rd(b,d+(c[g>>2]|0)|0);q=2;i=e;return q|0}else{p=20}}while(0);c:do{if((p|0)==20){r=j+(n+ -1)|0;d=(a[k]|0)==94;if(d){l=(c[g>>2]|0)+ -1|0;c[g>>2]=l;A=l;B=k+1|0}else{A=c[g>>2]|0;B=k}l=h+16|0;c[l>>2]=b;c[h>>2]=200;c[h+4>>2]=j;m=h+8|0;c[m>>2]=j+(c[f>>2]|0);c[h+12>>2]=B+A;v=h+20|0;d:do{if(d){c[v>>2]=0;w=dj(h,r,B)|0;if((w|0)==0){break c}else{C=w;D=r}}else{w=r;while(1){c[v>>2]=0;s=dj(h,w,B)|0;if((s|0)!=0){C=s;D=w;break d}if(!(w>>>0<(c[m>>2]|0)>>>0)){break c}w=w+1|0}}}while(0);if(o){m=j;rd(b,1-m+D|0);rd(b,C-m|0);m=c[v>>2]|0;te(c[l>>2]|0,m,6328);if((m|0)>0){r=0;do{ej(h,r,0,0);r=r+1|0}while((r|0)!=(m|0))}q=m+2|0;i=e;return q|0}else{r=c[v>>2]|0;d=(r|0)!=0|(D|0)==0?r:1;te(c[l>>2]|0,d,6328);if((d|0)>0){E=0}else{q=r;i=e;return q|0}while(1){ej(h,E,D,C);r=E+1|0;if((r|0)==(d|0)){q=d;break}else{E=r}}i=e;return q|0}}}while(0);pd(b);q=1;i=e;return q|0}function dj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0;g=i;i=i+16|0;h=g;j=c[b>>2]|0;c[b>>2]=j+ -1;if((j|0)==0){he(c[b+16>>2]|0,6400,h)|0}j=b+12|0;k=c[j>>2]|0;a:do{if((k|0)==(f|0)){l=e}else{m=b+8|0;n=b+16|0;o=b+4|0;p=b+20|0;q=e;r=f;s=k;b:while(1){t=q+1|0;u=q+ -1|0;v=r;w=s;c:while(1){x=a[v]|0;y=x<<24>>24;d:do{if((y|0)==40){z=7;break b}else if((y|0)==36){A=v+1|0;if((A|0)==(w|0)){z=23;break b}else{B=A;C=A;z=89}}else if((y|0)==41){z=16;break b}else if((y|0)==37){A=v+1|0;D=a[A]|0;switch(D<<24>>24|0){case 102:{break};case 98:{z=25;break c;break};case 57:case 56:case 55:case 54:case 53:case 52:case 51:case 50:case 49:case 48:{z=69;break c;break};default:{if((A|0)==(w|0)){he(c[n>>2]|0,6496,h)|0}B=v+2|0;C=A;z=89;break d}}A=v+2|0;if((a[A]|0)==91){E=91}else{he(c[n>>2]|0,6424,h)|0;E=a[A]|0}F=v+3|0;G=E<<24>>24;if((G|0)==91){H=(a[F]|0)==94?v+4|0:F;while(1){if((H|0)==(c[j>>2]|0)){he(c[n>>2]|0,6536,h)|0}I=H+1|0;if((a[H]|0)==37){J=I>>>0<(c[j>>2]|0)>>>0?H+2|0:I}else{J=I}if((a[J]|0)==93){break}else{H=J}}K=J+1|0}else if((G|0)==37){if((F|0)==(c[j>>2]|0)){he(c[n>>2]|0,6496,h)|0}K=v+4|0}else{K=F}if((q|0)==(c[o>>2]|0)){L=0}else{L=a[u]|0}H=L&255;I=K+ -1|0;M=(a[F]|0)==94;N=M?F:A;O=M&1;M=O^1;P=N+1|0;e:do{if(P>>>0<I>>>0){Q=N;R=P;while(1){S=a[R]|0;T=Q+2|0;U=a[T]|0;do{if(S<<24>>24==37){if((fj(H,U&255)|0)==0){V=T}else{W=M;break e}}else{if(U<<24>>24==45?(X=Q+3|0,X>>>0<I>>>0):0){if((S&255)>(L&255)){V=X;break}if((d[X]|0)<(L&255)){V=X;break}else{W=M;break e}}if(S<<24>>24==L<<24>>24){W=M;break e}else{V=R}}}while(0);S=V+1|0;if(S>>>0<I>>>0){Q=V;R=S}else{W=O;break}}}else{W=O}}while(0);if((W|0)!=0){l=0;break a}O=a[q]|0;M=O&255;H=(a[F]|0)==94;P=H?F:A;N=H&1;H=N^1;G=P+1|0;f:do{if(G>>>0<I>>>0){R=P;Q=G;while(1){S=a[Q]|0;U=R+2|0;T=a[U]|0;do{if(S<<24>>24==37){if((fj(M,T&255)|0)==0){Y=U}else{Z=H;break f}}else{if(T<<24>>24==45?(X=R+3|0,X>>>0<I>>>0):0){if((S&255)>(O&255)){Y=X;break}if((d[X]|0)<(O&255)){Y=X;break}else{Z=H;break f}}if(S<<24>>24==O<<24>>24){Z=H;break f}else{Y=Q}}}while(0);S=Y+1|0;if(S>>>0<I>>>0){R=Y;Q=S}else{Z=N;break}}}else{Z=N}}while(0);if((Z|0)==0){l=0;break a}else{_=K}}else{N=v+1|0;if(x<<24>>24==91){I=(a[N]|0)==94?v+2|0:N;H=w;while(1){if((I|0)==(H|0)){he(c[n>>2]|0,6536,h)|0}O=I+1|0;if((a[I]|0)==37){$=O>>>0<(c[j>>2]|0)>>>0?I+2|0:O}else{$=O}if((a[$]|0)==93){break}I=$;H=c[j>>2]|0}B=$+1|0;C=N;z=89}else{B=N;C=N;z=89}}}while(0);g:do{if((z|0)==89){z=0;do{if((c[m>>2]|0)>>>0>q>>>0){x=a[q]|0;y=x&255;H=a[v]|0;I=H<<24>>24;h:do{if((I|0)==46){aa=a[B]|0}else if((I|0)==37){ba=fj(y,d[C]|0)|0;z=104}else if((I|0)==91){O=B+ -1|0;M=(a[C]|0)==94;G=M?C:v;P=M&1;M=P^1;A=G+1|0;if(A>>>0<O>>>0){F=G;G=A;while(1){A=a[G]|0;Q=F+2|0;R=a[Q]|0;do{if(A<<24>>24==37){if((fj(y,R&255)|0)==0){ca=Q}else{ba=M;z=104;break h}}else{if(R<<24>>24==45?(S=F+3|0,S>>>0<O>>>0):0){if((A&255)>(x&255)){ca=S;break}if((d[S]|0)<(x&255)){ca=S;break}else{ba=M;z=104;break h}}if(A<<24>>24==x<<24>>24){ba=M;z=104;break h}else{ca=G}}}while(0);A=ca+1|0;if(A>>>0<O>>>0){F=ca;G=A}else{ba=P;z=104;break}}}else{ba=P;z=104}}else{ba=H<<24>>24==x<<24>>24|0;z=104}}while(0);if((z|0)==104){z=0;x=a[B]|0;if((ba|0)==0){da=x;break}else{aa=x}}x=aa<<24>>24;if((x|0)==42){z=112;break b}else if((x|0)==43){ea=t;break b}else if((x|0)==45){z=109;break b}else if((x|0)!=63){fa=t;ga=B;break c}x=B+1|0;H=dj(b,t,x)|0;if((H|0)==0){_=x;break g}else{l=H;break a}}else{da=a[B]|0}}while(0);if(!(da<<24>>24==45|da<<24>>24==63|da<<24>>24==42)){l=0;break a}_=B+1|0}}while(0);N=c[j>>2]|0;if((_|0)==(N|0)){l=q;break a}else{v=_;w=N}}if((z|0)==25){z=0;u=v+2|0;if(!((w+ -1|0)>>>0>u>>>0)){he(c[n>>2]|0,6568,h)|0}N=a[q]|0;if(!(N<<24>>24==(a[u]|0))){l=0;break a}u=a[v+3|0]|0;H=c[m>>2]|0;if(t>>>0<H>>>0){ha=q;ia=t;ja=1}else{l=0;break a}while(1){x=a[ia]|0;if(x<<24>>24==u<<24>>24){y=ja+ -1|0;if((y|0)==0){break}else{ka=y}}else{ka=(x<<24>>24==N<<24>>24)+ja|0}x=ia+1|0;if(x>>>0<H>>>0){y=ia;ia=x;ja=ka;ha=y}else{l=0;break a}}fa=ha+2|0;ga=v+4|0}else if((z|0)==69){z=0;H=D&255;N=H+ -49|0;if(((N|0)>=0?(N|0)<(c[p>>2]|0):0)?(u=c[b+(N<<3)+28>>2]|0,!((u|0)==-1)):0){la=N;ma=u}else{u=c[n>>2]|0;c[h>>2]=H+ -48;H=he(u,6464,h)|0;la=H;ma=c[b+(H<<3)+28>>2]|0}if(((c[m>>2]|0)-q|0)>>>0<ma>>>0){l=0;break a}if((Sm(c[b+(la<<3)+24>>2]|0,q,ma)|0)!=0){l=0;break a}H=q+ma|0;if((H|0)==0){l=0;break a}fa=H;ga=v+2|0}H=c[j>>2]|0;if((ga|0)==(H|0)){l=fa;break a}else{q=fa;r=ga;s=H}}if((z|0)==7){s=v+1|0;if((a[s]|0)==41){r=c[p>>2]|0;if((r|0)>31){he(c[n>>2]|0,6328,h)|0}c[b+(r<<3)+24>>2]=q;c[b+(r<<3)+28>>2]=-2;c[p>>2]=r+1;r=dj(b,q,v+2|0)|0;if((r|0)!=0){l=r;break}c[p>>2]=(c[p>>2]|0)+ -1;l=0;break}else{r=c[p>>2]|0;if((r|0)>31){he(c[n>>2]|0,6328,h)|0}c[b+(r<<3)+24>>2]=q;c[b+(r<<3)+28>>2]=-1;c[p>>2]=r+1;r=dj(b,q,s)|0;if((r|0)!=0){l=r;break}c[p>>2]=(c[p>>2]|0)+ -1;l=0;break}}else if((z|0)==16){r=v+1|0;s=c[p>>2]|0;while(1){o=s+ -1|0;if((s|0)<=0){z=19;break}if((c[b+(o<<3)+28>>2]|0)==-1){na=o;break}else{s=o}}if((z|0)==19){na=he(c[n>>2]|0,6616,h)|0}s=b+(na<<3)+28|0;c[s>>2]=q-(c[b+(na<<3)+24>>2]|0);p=dj(b,q,r)|0;if((p|0)!=0){l=p;break}c[s>>2]=-1;l=0;break}else if((z|0)==23){l=(q|0)==(c[m>>2]|0)?q:0;break}else if((z|0)==109){s=B+1|0;p=dj(b,q,s)|0;if((p|0)!=0){l=p;break}p=B+ -1|0;o=q;while(1){if(!((c[m>>2]|0)>>>0>o>>>0)){l=0;break a}H=a[o]|0;u=H&255;N=a[v]|0;t=N<<24>>24;i:do{if((t|0)==91){w=(a[C]|0)==94;y=w?C:v;x=w&1;w=x^1;I=y+1|0;if(I>>>0<p>>>0){G=y;y=I;while(1){I=a[y]|0;F=G+2|0;O=a[F]|0;do{if(I<<24>>24==37){if((fj(u,O&255)|0)==0){oa=F}else{pa=w;z=147;break i}}else{if(O<<24>>24==45?(M=G+3|0,M>>>0<p>>>0):0){if((I&255)>(H&255)){oa=M;break}if((d[M]|0)<(H&255)){oa=M;break}else{pa=w;z=147;break i}}if(I<<24>>24==H<<24>>24){pa=w;z=147;break i}else{oa=y}}}while(0);I=oa+1|0;if(I>>>0<p>>>0){G=oa;y=I}else{pa=x;z=147;break}}}else{pa=x;z=147}}else if((t|0)==37){pa=fj(u,d[C]|0)|0;z=147}else if((t|0)!=46){pa=N<<24>>24==H<<24>>24|0;z=147}}while(0);if((z|0)==147?(z=0,(pa|0)==0):0){l=0;break a}H=o+1|0;N=dj(b,H,s)|0;if((N|0)==0){o=H}else{l=N;break a}}}else if((z|0)==112){ea=q}o=c[m>>2]|0;if(o>>>0>ea>>>0){s=B+ -1|0;p=ea;r=0;n=o;while(1){o=a[p]|0;N=o&255;H=a[v]|0;t=H<<24>>24;j:do{if((t|0)==37){qa=fj(N,d[C]|0)|0;z=129}else if((t|0)==91){u=(a[C]|0)==94;y=u?C:v;G=u&1;u=G^1;w=y+1|0;if(w>>>0<s>>>0){I=y;y=w;while(1){w=a[y]|0;O=I+2|0;F=a[O]|0;do{if(w<<24>>24==37){if((fj(N,F&255)|0)==0){ra=O}else{qa=u;z=129;break j}}else{if(F<<24>>24==45?(M=I+3|0,M>>>0<s>>>0):0){if((w&255)>(o&255)){ra=M;break}if((d[M]|0)<(o&255)){ra=M;break}else{qa=u;z=129;break j}}if(w<<24>>24==o<<24>>24){qa=u;z=129;break j}else{ra=y}}}while(0);w=ra+1|0;if(w>>>0<s>>>0){I=ra;y=w}else{qa=G;z=129;break}}}else{qa=G;z=129}}else if((t|0)==46){sa=n}else{qa=H<<24>>24==o<<24>>24|0;z=129}}while(0);if((z|0)==129){z=0;if((qa|0)==0){ta=r;break}sa=c[m>>2]|0}o=r+1|0;H=ea+o|0;if(sa>>>0>H>>>0){p=H;r=o;n=sa}else{ta=o;break}}if((ta|0)>-1){ua=ta}else{l=0;break}}else{ua=0}n=B+1|0;r=ua;while(1){p=dj(b,ea+r|0,n)|0;if((p|0)!=0){l=p;break a}if((r|0)>0){r=r+ -1|0}else{l=0;break}}}}while(0);c[b>>2]=(c[b>>2]|0)+1;i=g;return l|0}function ej(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+16|0;g=f;if((c[a+20>>2]|0)<=(b|0)){h=c[a+16>>2]|0;if((b|0)==0){td(h,d,e-d|0)|0;i=f;return}else{he(h,6352,g)|0;i=f;return}}h=c[a+(b<<3)+28>>2]|0;if(!((h|0)==-1)){d=c[a+16>>2]|0;e=c[a+(b<<3)+24>>2]|0;if((h|0)==-2){rd(d,e+1-(c[a+4>>2]|0)|0);i=f;return}else{j=d;k=e}}else{e=a+16|0;he(c[e>>2]|0,6376,g)|0;j=c[e>>2]|0;k=c[a+(b<<3)+24>>2]|0}td(j,k,h)|0;i=f;return}function fj(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;do{switch(dn(b|0)|0){case 112:{d=Qb(a|0)|0;break};case 103:{d=Ya(a|0)|0;break};case 99:{d=Hb(a|0)|0;break};case 100:{d=(a+ -48|0)>>>0<10|0;break};case 97:{d=cb(a|0)|0;break};case 122:{d=(a|0)==0|0;break};case 117:{d=Ma(a|0)|0;break};case 108:{d=Oa(a|0)|0;break};case 115:{d=Sb(a|0)|0;break};case 119:{d=oa(a|0)|0;break};case 120:{d=lc(a|0)|0;break};default:{e=(b|0)==(a|0)|0;i=c;return e|0}}}while(0);if((Oa(b|0)|0)!=0){e=d;i=c;return e|0}e=(d|0)==0|0;i=c;return e|0}function gj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;i=i+288|0;d=b+8|0;e=b+4|0;f=b;g=kd(a,-1001001,e)|0;h=kd(a,-1001002,f)|0;j=d+16|0;c[j>>2]=a;c[d>>2]=200;c[d+4>>2]=g;k=d+8|0;c[k>>2]=g+(c[e>>2]|0);c[d+12>>2]=h+(c[f>>2]|0);f=g+(hd(a,-1001003,0)|0)|0;if(f>>>0>(c[k>>2]|0)>>>0){l=0;i=b;return l|0}e=d+20|0;m=f;while(1){c[e>>2]=0;n=dj(d,m,h)|0;f=m+1|0;if((n|0)!=0){break}if(f>>>0>(c[k>>2]|0)>>>0){l=0;o=7;break}else{m=f}}if((o|0)==7){i=b;return l|0}rd(a,n-g+((n|0)==(m|0))|0);Yc(a,-1001003);a=c[e>>2]|0;e=(a|0)!=0|(m|0)==0?a:1;te(c[j>>2]|0,e,6328);if((e|0)>0){p=0}else{l=a;i=b;return l|0}while(1){ej(d,p,m,n);a=p+1|0;if((a|0)==(e|0)){l=e;break}else{p=a}}i=b;return l|0}function hj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;a=i;Ce(d,b,c);i=a;return 0}function ij(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+16|0;g=f+8|0;j=f;k=e+8|0;l=c[k>>2]|0;do{if((l|0)!=0){if((((l|0)==3?(m=+h[e>>3],h[j>>3]=m+6755399441055744.0,n=c[j>>2]|0,+(n|0)==m):0)?(n|0)>0:0)?(o=c[b+28>>2]|0,(n|0)<=(o|0)):0){p=o;q=n+ -1|0;break}n=rj(b,e)|0;while(1){o=n+16|0;r=n+24|0;s=c[r>>2]|0;if((s|0)==(c[k>>2]|0)){if((Tj(0,o,e)|0)!=0){t=15;break}u=c[r>>2]|0}else{u=s}if(((u|0)==11?(c[k>>2]&64|0)!=0:0)?(c[o>>2]|0)==(c[e>>2]|0):0){t=15;break}o=c[n+28>>2]|0;if((o|0)==0){t=18;break}else{n=o}}if((t|0)==15){o=c[b+28>>2]|0;p=o;q=(n-(c[b+16>>2]|0)>>5)+o|0;break}else if((t|0)==18){nf(a,7192,g)}}else{p=c[b+28>>2]|0;q=-1}}while(0);g=b+12|0;a=q;while(1){v=a+1|0;if((v|0)>=(p|0)){break}w=c[g>>2]|0;x=w+(v<<4)+8|0;if((c[x>>2]|0)==0){a=v}else{t=21;break}}if((t|0)==21){h[e>>3]=+(a+2|0);c[k>>2]=3;a=w+(v<<4)|0;w=c[a+4>>2]|0;g=e+16|0;c[g>>2]=c[a>>2];c[g+4>>2]=w;c[e+24>>2]=c[x>>2];y=1;i=f;return y|0}x=v-p|0;p=1<<(d[b+7|0]|0);if((x|0)>=(p|0)){y=0;i=f;return y|0}v=b+16|0;b=c[v>>2]|0;w=x;while(1){x=w+1|0;if((c[b+(w<<5)+8>>2]|0)!=0){break}if((x|0)<(p|0)){w=x}else{y=0;t=27;break}}if((t|0)==27){i=f;return y|0}t=b+(w<<5)+16|0;p=c[t+4>>2]|0;x=e;c[x>>2]=c[t>>2];c[x+4>>2]=p;c[k>>2]=c[b+(w<<5)+24>>2];b=c[v>>2]|0;v=b+(w<<5)|0;k=c[v+4>>2]|0;p=e+16|0;c[p>>2]=c[v>>2];c[p+4>>2]=k;c[e+24>>2]=c[b+(w<<5)+8>>2];y=1;i=f;return y|0}function jj(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;h=b+28|0;j=c[h>>2]|0;k=d[b+7|0]|0;l=c[b+16>>2]|0;if((j|0)<(e|0)){if((e+1|0)>>>0>268435455){th(a)}m=b+12|0;n=uh(a,c[m>>2]|0,j<<4,e<<4)|0;c[m>>2]=n;m=c[h>>2]|0;if((m|0)<(e|0)){o=m;do{c[n+(o<<4)+8>>2]=0;o=o+1|0}while((o|0)!=(e|0))}c[h>>2]=e}kj(a,b,f);do{if((j|0)>(e|0)){c[h>>2]=e;f=b+12|0;o=e;while(1){n=c[f>>2]|0;if((c[n+(o<<4)+8>>2]|0)==0){p=o+1|0}else{m=o+1|0;lj(a,b,m,n+(o<<4)|0);p=m}if((p|0)==(j|0)){break}else{o=p}}if((e+1|0)>>>0>268435455){th(a)}else{o=b+12|0;c[o>>2]=uh(a,c[o>>2]|0,j<<4,e<<4)|0;break}}}while(0);e=1<<k;if((e|0)>0){k=e;do{k=k+ -1|0;j=l+(k<<5)+8|0;if((c[j>>2]|0)!=0){p=l+(k<<5)+16|0;h=uj(b,p)|0;if((h|0)==4320){q=qj(a,b,p)|0}else{q=h}h=l+(k<<5)|0;p=c[h+4>>2]|0;o=q;c[o>>2]=c[h>>2];c[o+4>>2]=p;c[q+8>>2]=c[j>>2]}}while((k|0)>0)}if((l|0)==7144){i=g;return}uh(a,l,e<<5,0)|0;i=g;return}function kj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+16|0;if((e|0)==0){c[d+16>>2]=7144;g=0;h=7144;j=0;k=d+7|0;a[k]=j;l=h+(g<<5)|0;m=d+20|0;c[m>>2]=l;i=f;return}n=Mh(e)|0;if((n|0)>30){nf(b,7176,f)}e=1<<n;if((e+1|0)>>>0>134217727){th(b)}o=uh(b,0,0,e<<5)|0;b=d+16|0;c[b>>2]=o;if((e|0)>0){p=o;q=0;while(1){c[p+(q<<5)+28>>2]=0;c[p+(q<<5)+24>>2]=0;c[p+(q<<5)+8>>2]=0;r=q+1|0;s=c[b>>2]|0;if((r|0)==(e|0)){t=s;break}else{p=s;q=r}}}else{t=o}g=e;h=t;j=n&255;k=d+7|0;a[k]=j;l=h+(g<<5)|0;m=d+20|0;c[m>>2]=l;i=f;return}function lj(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0,r=0,s=0.0,t=0;g=i;i=i+32|0;j=g+16|0;k=g;l=e+ -1|0;a:do{if(l>>>0<(c[b+28>>2]|0)>>>0){m=(c[b+12>>2]|0)+(l<<4)|0;n=10}else{o=+(e|0);h[j>>3]=o+1.0;p=(c[j+4>>2]|0)+(c[j>>2]|0)|0;if((p|0)<0){q=0-p|0;r=(p|0)==(q|0)?0:q}else{r=p}p=(c[b+16>>2]|0)+(((r|0)%((1<<(d[b+7|0]|0))+ -1|1|0)|0)<<5)|0;while(1){if((c[p+24>>2]|0)==3?+h[p+16>>3]==o:0){break}q=c[p+28>>2]|0;if((q|0)==0){s=o;n=12;break a}else{p=q}}m=p;n=10}}while(0);if((n|0)==10){if((m|0)==4320){s=+(e|0);n=12}else{t=m}}if((n|0)==12){h[k>>3]=s;c[k+8>>2]=3;t=qj(a,b,k)|0}k=f;b=c[k+4>>2]|0;a=t;c[a>>2]=c[k>>2];c[a+4>>2]=b;c[t+8>>2]=c[f+8>>2];i=g;return}function mj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;e=uj(b,c)|0;if((e|0)==4320){f=qj(a,b,c)|0}else{f=e}i=d;return f|0}function nj(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=i;if((c[b+16>>2]|0)==7144){g=0}else{g=1<<(d[b+7|0]|0)}jj(a,b,e,g);i=f;return}function oj(b){b=b|0;var d=0,e=0;d=i;e=Zf(b,5,32,0,0)|0;c[e+8>>2]=0;a[e+6|0]=-1;c[e+12>>2]=0;c[e+28>>2]=0;c[e+16>>2]=7144;a[e+7|0]=0;c[e+20>>2]=7144;i=d;return e|0}function pj(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;f=c[b+16>>2]|0;if((f|0)!=7144){uh(a,f,32<<(d[b+7|0]|0),0)|0}uh(a,c[b+12>>2]|0,c[b+28>>2]<<4,0)|0;uh(a,b,32,0)|0;i=e;return}function qj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;g=i;i=i+144|0;j=g+8|0;k=g;l=g+16|0;m=f+8|0;n=c[m>>2]|0;if((n|0)==3){o=3}else if((n|0)==0){nf(b,7096,j)}if((o|0)==3?(p=+h[f>>3],!(p==p&0.0==0.0)):0){nf(b,7120,j)}n=rj(e,f)|0;q=n+8|0;do{if((c[q>>2]|0)!=0|(n|0)==7144){r=e+20|0;s=e+16|0;t=c[s>>2]|0;u=c[r>>2]|0;while(1){if(!(u>>>0>t>>>0)){break}v=u+ -32|0;c[r>>2]=v;if((c[u+ -8>>2]|0)==0){o=37;break}else{u=v}}if((o|0)==37){r=rj(e,n+16|0)|0;if((r|0)==(n|0)){t=n+28|0;c[u+ -4>>2]=c[t>>2];c[t>>2]=v;w=v;break}else{x=r}do{y=x+28|0;x=c[y>>2]|0}while((x|0)!=(n|0));c[y>>2]=v;c[v+0>>2]=c[n+0>>2];c[v+4>>2]=c[n+4>>2];c[v+8>>2]=c[n+8>>2];c[v+12>>2]=c[n+12>>2];c[v+16>>2]=c[n+16>>2];c[v+20>>2]=c[n+20>>2];c[v+24>>2]=c[n+24>>2];c[v+28>>2]=c[n+28>>2];c[n+28>>2]=0;c[q>>2]=0;w=n;break}u=l+0|0;r=u+124|0;do{c[u>>2]=0;u=u+4|0}while((u|0)<(r|0));u=e+12|0;r=c[e+28>>2]|0;t=0;z=1;A=0;B=1;while(1){if((B|0)>(r|0)){if((z|0)>(r|0)){C=t;break}else{D=r}}else{D=B}if((z|0)>(D|0)){E=z;F=0}else{G=c[u>>2]|0;H=z;I=0;while(1){I=((c[G+(H+ -1<<4)+8>>2]|0)!=0)+I|0;if((H|0)>=(D|0)){break}else{H=H+1|0}}E=D+1|0;F=I}H=l+(A<<2)|0;c[H>>2]=(c[H>>2]|0)+F;H=F+t|0;G=A+1|0;if((G|0)<31){t=H;z=E;A=G;B=B<<1}else{C=H;break}}B=0;A=1<<(d[e+7|0]|0);z=0;a:while(1){t=A;do{u=t;t=t+ -1|0;if((u|0)==0){break a}J=c[s>>2]|0}while((c[J+(t<<5)+8>>2]|0)==0);if(((c[J+(t<<5)+24>>2]|0)==3?(p=+h[J+(t<<5)+16>>3],h[k>>3]=p+6755399441055744.0,I=c[k>>2]|0,+(I|0)==p):0)?(I+ -1|0)>>>0<1073741824:0){u=l+((Mh(I)|0)<<2)|0;c[u>>2]=(c[u>>2]|0)+1;K=1}else{K=0}B=K+B|0;A=t;z=z+1|0}A=B+C|0;if(((c[m>>2]|0)==3?(p=+h[f>>3],h[j>>3]=p+6755399441055744.0,s=c[j>>2]|0,+(s|0)==p):0)?(s+ -1|0)>>>0<1073741824:0){u=l+((Mh(s)|0)<<2)|0;c[u>>2]=(c[u>>2]|0)+1;L=1}else{L=0}u=A+L|0;b:do{if((u|0)>0){A=0;s=0;I=0;r=0;H=0;G=1;while(1){M=c[l+(I<<2)>>2]|0;if((M|0)>0){N=M+s|0;M=(N|0)>(A|0);O=N;P=M?G:r;Q=M?N:H}else{O=s;P=r;Q=H}if((O|0)==(u|0)){R=P;S=Q;break b}N=G<<1;M=(N|0)/2|0;if((M|0)<(u|0)){A=M;s=O;I=I+1|0;r=P;H=Q;G=N}else{R=P;S=Q;break}}}else{R=0;S=0}}while(0);jj(b,e,R,C+1+z-S|0);u=uj(e,f)|0;if((u|0)!=4320){T=u;i=g;return T|0}T=qj(b,e,f)|0;i=g;return T|0}else{w=n}}while(0);n=f;S=c[n+4>>2]|0;C=w+16|0;c[C>>2]=c[n>>2];c[C+4>>2]=S;c[w+24>>2]=c[m>>2];if(((c[m>>2]&64|0)!=0?!((a[(c[f>>2]|0)+5|0]&3)==0):0)?!((a[e+5|0]&4)==0):0){Wf(b,e)}T=w;i=g;return T|0}function rj(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+16|0;g=f;switch(c[e+8>>2]&63|0){case 20:{j=c[e>>2]|0;k=j+6|0;if((a[k]|0)==0){l=j+8|0;c[l>>2]=Ki(j+16|0,c[j+12>>2]|0,c[l>>2]|0)|0;a[k]=1;m=c[e>>2]|0}else{m=j}n=(c[b+16>>2]|0)+(((1<<d[b+7|0])+ -1&c[m+8>>2])<<5)|0;i=f;return n|0};case 4:{n=(c[b+16>>2]|0)+(((1<<d[b+7|0])+ -1&c[(c[e>>2]|0)+8>>2])<<5)|0;i=f;return n|0};case 3:{h[g>>3]=+h[e>>3]+1.0;m=(c[g+4>>2]|0)+(c[g>>2]|0)|0;if((m|0)<0){g=0-m|0;o=(m|0)==(g|0)?0:g}else{o=m}n=(c[b+16>>2]|0)+(((o|0)%((1<<d[b+7|0])+ -1|1|0)|0)<<5)|0;i=f;return n|0};case 2:{n=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])+ -1|1)>>>0)|0)<<5)|0;i=f;return n|0};case 22:{n=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])+ -1|1)>>>0)|0)<<5)|0;i=f;return n|0};case 1:{n=(c[b+16>>2]|0)+(((1<<d[b+7|0])+ -1&c[e>>2])<<5)|0;i=f;return n|0};default:{n=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])+ -1|1)>>>0)|0)<<5)|0;i=f;return n|0}}return 0}function sj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0.0,l=0,m=0;e=i;i=i+16|0;f=e;g=b+ -1|0;if(g>>>0<(c[a+28>>2]|0)>>>0){j=(c[a+12>>2]|0)+(g<<4)|0;i=e;return j|0}k=+(b|0);h[f>>3]=k+1.0;b=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((b|0)<0){f=0-b|0;l=(b|0)==(f|0)?0:f}else{l=b}b=(c[a+16>>2]|0)+(((l|0)%((1<<(d[a+7|0]|0))+ -1|1|0)|0)<<5)|0;while(1){if((c[b+24>>2]|0)==3?+h[b+16>>3]==k:0){break}a=c[b+28>>2]|0;if((a|0)==0){j=4320;m=10;break}else{b=a}}if((m|0)==10){i=e;return j|0}j=b;i=e;return j|0}function tj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=i;f=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))+ -1&c[b+8>>2])<<5)|0;while(1){if((c[f+24>>2]|0)==68?(c[f+16>>2]|0)==(b|0):0){break}a=c[f+28>>2]|0;if((a|0)==0){g=4320;h=6;break}else{f=a}}if((h|0)==6){i=e;return g|0}g=f;i=e;return g|0}function uj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0;e=i;i=i+16|0;f=e+8|0;g=e;j=b+8|0;k=c[j>>2]&63;if((k|0)==3){l=+h[b>>3];h[g>>3]=l+6755399441055744.0;m=c[g>>2]|0;n=+(m|0);if(n==l){g=m+ -1|0;if(g>>>0<(c[a+28>>2]|0)>>>0){o=(c[a+12>>2]|0)+(g<<4)|0;i=e;return o|0}h[f>>3]=n+1.0;g=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((g|0)<0){f=0-g|0;p=(g|0)==(f|0)?0:f}else{p=g}g=(c[a+16>>2]|0)+(((p|0)%((1<<(d[a+7|0]|0))+ -1|1|0)|0)<<5)|0;while(1){if((c[g+24>>2]|0)==3?+h[g+16>>3]==n:0){break}p=c[g+28>>2]|0;if((p|0)==0){o=4320;q=22;break}else{g=p}}if((q|0)==22){i=e;return o|0}o=g;i=e;return o|0}}else if((k|0)==4){g=c[b>>2]|0;p=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))+ -1&c[g+8>>2])<<5)|0;while(1){if((c[p+24>>2]|0)==68?(c[p+16>>2]|0)==(g|0):0){break}f=c[p+28>>2]|0;if((f|0)==0){o=4320;q=22;break}else{p=f}}if((q|0)==22){i=e;return o|0}o=p;i=e;return o|0}else if((k|0)==0){o=4320;i=e;return o|0}k=rj(a,b)|0;while(1){if((c[k+24>>2]|0)==(c[j>>2]|0)?(Tj(0,k+16|0,b)|0)!=0:0){break}a=c[k+28>>2]|0;if((a|0)==0){o=4320;q=22;break}else{k=a}}if((q|0)==22){i=e;return o|0}o=k;i=e;return o|0}function vj(a){a=a|0;var b=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;b=i;i=i+16|0;e=b;f=a+28|0;g=c[f>>2]|0;if((g|0)!=0?(j=c[a+12>>2]|0,(c[j+(g+ -1<<4)+8>>2]|0)==0):0){if(g>>>0>1){k=0;l=g}else{m=0;i=b;return m|0}while(1){n=(k+l|0)>>>1;o=(c[j+(n+ -1<<4)+8>>2]|0)==0;p=o?n:l;q=o?k:n;if((p-q|0)>>>0>1){k=q;l=p}else{m=q;break}}i=b;return m|0}l=a+16|0;if((c[l>>2]|0)==7144){m=g;i=b;return m|0}k=a+12|0;j=a+7|0;a=e+4|0;q=g+1|0;p=g;n=g;while(1){g=q+ -1|0;a:do{if(g>>>0<p>>>0){r=(c[k>>2]|0)+(g<<4)|0}else{s=+(q|0);h[e>>3]=s+1.0;o=(c[a>>2]|0)+(c[e>>2]|0)|0;if((o|0)<0){t=0-o|0;u=(o|0)==(t|0)?0:t}else{u=o}o=(c[l>>2]|0)+(((u|0)%((1<<(d[j]|0))+ -1|1|0)|0)<<5)|0;while(1){if((c[o+24>>2]|0)==3?+h[o+16>>3]==s:0){break}t=c[o+28>>2]|0;if((t|0)==0){r=4320;break a}else{o=t}}r=o}}while(0);if((c[r+8>>2]|0)==0){break}g=q<<1;if(g>>>0>2147483645){v=21;break}t=q;q=g;p=c[f>>2]|0;n=t}if((v|0)==21){v=e+4|0;p=1;while(1){r=p+ -1|0;b:do{if(r>>>0<(c[f>>2]|0)>>>0){w=(c[k>>2]|0)+(r<<4)|0}else{s=+(p|0);h[e>>3]=s+1.0;u=(c[v>>2]|0)+(c[e>>2]|0)|0;if((u|0)<0){a=0-u|0;x=(u|0)==(a|0)?0:a}else{x=u}u=(c[l>>2]|0)+(((x|0)%((1<<(d[j]|0))+ -1|1|0)|0)<<5)|0;while(1){if((c[u+24>>2]|0)==3?+h[u+16>>3]==s:0){break}a=c[u+28>>2]|0;if((a|0)==0){w=4320;break b}else{u=a}}w=u}}while(0);if((c[w+8>>2]|0)==0){m=r;break}p=p+1|0}i=b;return m|0}if(!((q-n|0)>>>0>1)){m=n;i=b;return m|0}p=e+4|0;w=q;q=n;while(1){n=(w+q|0)>>>1;x=n+ -1|0;c:do{if(x>>>0<(c[f>>2]|0)>>>0){y=(c[k>>2]|0)+(x<<4)|0}else{s=+(n|0);h[e>>3]=s+1.0;v=(c[p>>2]|0)+(c[e>>2]|0)|0;if((v|0)<0){o=0-v|0;z=(v|0)==(o|0)?0:o}else{z=v}v=(c[l>>2]|0)+(((z|0)%((1<<(d[j]|0))+ -1|1|0)|0)<<5)|0;while(1){if((c[v+24>>2]|0)==3?+h[v+16>>3]==s:0){break}o=c[v+28>>2]|0;if((o|0)==0){y=4320;break c}else{v=o}}y=v}}while(0);x=(c[y+8>>2]|0)==0;r=x?n:w;u=x?q:n;if((r-u|0)>>>0>1){w=r;q=u}else{m=u;break}}i=b;return m|0}function wj(a){a=a|0;var b=0;b=i;Gd(a,0,7);Ve(a,7216,0);Dd(a,-1,7280);Jd(a,7280);i=b;return 1}function xj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+1056|0;d=b;e=b+16|0;f=b+8|0;g=re(a,2,7336,f)|0;ue(a,1,5);h=Ae(a,3,1)|0;if(($c(a,4)|0)<1){j=Qe(a,1)|0}else{j=ye(a,4)|0}He(a,e);if((h|0)>=(j|0)){if((h|0)!=(j|0)){Ee(e);i=b;return 1}}else{k=h;do{Fd(a,1,k);if((dd(a,-1)|0)==0){c[d>>2]=ad(a,$c(a,-1)|0)|0;c[d+4>>2]=k;he(a,7488,d)|0}Ge(e);Ce(e,g,c[f>>2]|0);k=k+1|0}while((k|0)!=(j|0))}Fd(a,1,j);if((dd(a,-1)|0)==0){c[d>>2]=ad(a,$c(a,-1)|0)|0;c[d+4>>2]=j;he(a,7488,d)|0}Ge(e);Ee(e);i=b;return 1}function yj(a){a=a|0;var b=0,c=0.0,d=0.0,e=0.0;b=i;ue(a,1,5);pd(a);a:do{if((Zd(a,1)|0)==0){c=0.0}else{d=0.0;while(1){while(1){Vc(a,-2);if(($c(a,-1)|0)==3?(e=+gd(a,-1,0),e>d):0){break}if((Zd(a,1)|0)==0){c=d;break a}}if((Zd(a,1)|0)==0){c=e;break}else{d=e}}}}while(0);qd(a,c);i=b;return 1}function zj(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+16|0;c=b;ue(a,1,5);d=Qe(a,1)|0;e=d+1|0;f=Uc(a)|0;if((f|0)==2){g=e}else if((f|0)==3){h=2}else{j=he(a,7448,c)|0;i=b;return j|0}if((h|0)==2){h=ye(a,2)|0;if((h|0)<1|(h|0)>(e|0)){ge(a,2,7384)|0}if((d|0)<(h|0)){g=h}else{d=e;while(1){e=d+ -1|0;Fd(a,1,e);Nd(a,1,d);if((e|0)>(h|0)){d=e}else{g=h;break}}}}Nd(a,1,g);j=0;i=b;return j|0}function Aj(a){a=a|0;var b=0,c=0,d=0;b=i;c=Uc(a)|0;Gd(a,c,1);rd(a,c);Ld(a,-2,7440);if((c|0)<=0){i=b;return 1}_c(a,1);Nd(a,-2,1);Yc(a,1);if((c|0)>1){d=c}else{i=b;return 1}do{Nd(a,1,d);d=d+ -1|0}while((d|0)>1);i=b;return 1}function Bj(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+16|0;c=b;ue(a,1,5);d=Ae(a,2,1)|0;if(($c(a,3)|0)<1){e=Qe(a,1)|0}else{e=ye(a,3)|0}if((d|0)>(e|0)){f=0;i=b;return f|0}g=e-d|0;h=g+1|0;if((g|0)>=0?(Oc(a,h)|0)!=0:0){Fd(a,1,d);if((d|0)<(e|0)){j=d}else{f=h;i=b;return f|0}while(1){d=j+1|0;Fd(a,1,d);if((d|0)==(e|0)){f=h;break}else{j=d}}i=b;return f|0}f=he(a,7408,c)|0;i=b;return f|0}function Cj(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;ue(a,1,5);c=Qe(a,1)|0;d=Ae(a,2,c)|0;if((d|0)!=(c|0)?(d|0)<1|(d|0)>(c+1|0):0){ge(a,1,7384)|0}Fd(a,1,d);if((d|0)<(c|0)){e=d}else{f=d;pd(a);Nd(a,1,f);i=b;return 1}while(1){d=e+1|0;Fd(a,1,d);Nd(a,1,e);if((d|0)==(c|0)){f=c;break}else{e=d}}pd(a);Nd(a,1,f);i=b;return 1}function Dj(a){a=a|0;var b=0,c=0;b=i;ue(a,1,5);c=Qe(a,1)|0;te(a,40,7336);if(($c(a,2)|0)>=1){ue(a,2,6)}Vc(a,2);Ej(a,1,c);i=b;return 0}function Ej(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=i;i=i+16|0;e=d;if((b|0)<(c|0)){f=b;g=c}else{i=d;return}while(1){Fd(a,1,f);Fd(a,1,g);if((Fj(a,-1,-2)|0)==0){Vc(a,-3)}else{Nd(a,1,f);Nd(a,1,g)}c=g-f|0;if((c|0)==1){h=24;break}b=(g+f|0)/2|0;Fd(a,1,b);Fd(a,1,f);do{if((Fj(a,-2,-1)|0)==0){Vc(a,-2);Fd(a,1,g);if((Fj(a,-1,-2)|0)==0){Vc(a,-3);break}else{Nd(a,1,b);Nd(a,1,g);break}}else{Nd(a,1,b);Nd(a,1,f)}}while(0);if((c|0)==2){h=24;break}Fd(a,1,b);_c(a,-1);j=g+ -1|0;Fd(a,1,j);Nd(a,1,b);Nd(a,1,j);k=f;l=j;while(1){m=k+1|0;Fd(a,1,m);if((Fj(a,-1,-2)|0)==0){n=m;o=k}else{p=m;while(1){if((p|0)>=(g|0)){he(a,7344,e)|0}Vc(a,-2);m=p+1|0;Fd(a,1,m);if((Fj(a,-1,-2)|0)==0){n=m;o=p;break}else{p=m}}}p=l+ -1|0;Fd(a,1,p);if((Fj(a,-3,-1)|0)==0){q=p;r=l}else{m=p;while(1){if((m|0)<=(f|0)){he(a,7344,e)|0}Vc(a,-2);p=m+ -1|0;Fd(a,1,p);if((Fj(a,-3,-1)|0)==0){q=p;r=m;break}else{m=p}}}if((r|0)<=(n|0)){break}Nd(a,1,n);Nd(a,1,q);k=n;l=q}Vc(a,-4);Fd(a,1,j);Fd(a,1,n);Nd(a,1,j);Nd(a,1,n);l=(n-f|0)<(g-n|0);k=o+2|0;b=l?k:f;c=l?g:o;Ej(a,l?f:k,l?o:g);if((b|0)<(c|0)){f=b;g=c}else{h=24;break}}if((h|0)==24){i=d;return}}function Fj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;if(($c(a,2)|0)==0){e=fd(a,b,c,1)|0;i=d;return e|0}else{_c(a,2);_c(a,b+ -1|0);_c(a,c+ -2|0);Rd(a,2,1,0,0);c=jd(a,-1)|0;Vc(a,-2);e=c;i=d;return e|0}return 0}function Gj(b){b=b|0;var e=0,f=0,g=0,h=0;e=i;f=b+12|0;g=0;do{h=Ni(b,c[7704+(g<<2)>>2]|0)|0;c[(c[f>>2]|0)+(g<<2)+184>>2]=h;h=(c[(c[f>>2]|0)+(g<<2)+184>>2]|0)+5|0;a[h]=d[h]|0|32;g=g+1|0}while((g|0)!=17);i=e;return}function Hj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;h=tj(b,f)|0;if((c[h+8>>2]|0)!=0){j=h;i=g;return j|0}h=b+6|0;a[h]=d[h]|0|1<<e;j=0;i=g;return j|0}function Ij(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=c[b+8>>2]&15;if((f|0)==7){g=c[(c[b>>2]|0)+8>>2]|0}else if((f|0)==5){g=c[(c[b>>2]|0)+8>>2]|0}else{g=c[(c[a+12>>2]|0)+(f<<2)+252>>2]|0}if((g|0)==0){h=4320;i=e;return h|0}h=tj(g,c[(c[a+12>>2]|0)+(d<<2)+184>>2]|0)|0;i=e;return h|0}function Jj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+64|0;h=g+16|0;j=g+34|0;k=g;l=a[f]|0;if(l<<24>>24==61|l<<24>>24==64){c[k+12>>2]=f+1}else if(l<<24>>24==27){c[k+12>>2]=7928}else{c[k+12>>2]=f}c[k>>2]=b;c[k+4>>2]=d;c[k+8>>2]=e;c[h>>2]=1635077147;a[h+4|0]=82;a[h+5|0]=0;a[h+6|0]=1;a[h+7|0]=4;a[h+8|0]=4;a[h+9|0]=4;a[h+10|0]=8;e=h+12|0;a[h+11|0]=0;a[e+0|0]=a[7944|0]|0;a[e+1|0]=a[7945|0]|0;a[e+2|0]=a[7946|0]|0;a[e+3|0]=a[7947|0]|0;a[e+4|0]=a[7948|0]|0;a[e+5|0]=a[7949|0]|0;a[j]=27;if((ak(d,j+1|0,17)|0)!=0){Mj(k,7952)}if((Sm(h,j,18)|0)==0){d=Mf(b,1)|0;e=b+8|0;f=c[e>>2]|0;c[f>>2]=d;c[f+8>>2]=70;f=(c[e>>2]|0)+16|0;c[e>>2]=f;if(((c[b+24>>2]|0)-f|0)<16){vf(b,0)}f=Rf(b)|0;l=d+12|0;c[l>>2]=f;Kj(k,f);f=c[l>>2]|0;l=c[f+40>>2]|0;if((l|0)==1){m=d;i=g;return m|0}d=Mf(b,l)|0;c[d+12>>2]=f;f=c[e>>2]|0;c[f+ -16>>2]=d;c[f+ -8>>2]=70;m=d;i=g;return m|0}if((Sm(h,j,4)|0)!=0){Mj(k,8016)}if((Sm(h,j,6)|0)!=0){Mj(k,8024)}if((Sm(h,j,12)|0)==0){Mj(k,8e3)}else{Mj(k,8048)}return 0}function Kj(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+16|0;g=f;j=f+8|0;k=b+4|0;if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}l=c[g>>2]|0;if((l|0)<0){Mj(b,8e3)}c[e+64>>2]=l;if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}l=c[g>>2]|0;if((l|0)<0){Mj(b,8e3)}c[e+68>>2]=l;if((ak(c[k>>2]|0,g,1)|0)!=0){Mj(b,7952)}a[e+76|0]=a[g]|0;if((ak(c[k>>2]|0,g,1)|0)!=0){Mj(b,7952)}a[e+77|0]=a[g]|0;if((ak(c[k>>2]|0,g,1)|0)!=0){Mj(b,7952)}a[e+78|0]=a[g]|0;if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}l=c[g>>2]|0;if((l|0)<0){Mj(b,8e3)}m=c[b>>2]|0;if((l+1|0)>>>0>1073741823){th(m)}n=l<<2;o=uh(m,0,0,n)|0;c[e+12>>2]=o;c[e+48>>2]=l;if((ak(c[k>>2]|0,o,n)|0)!=0){Mj(b,7952)}if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}n=c[g>>2]|0;if((n|0)<0){Mj(b,8e3)}o=c[b>>2]|0;if((n+1|0)>>>0>268435455){th(o)}l=uh(o,0,0,n<<4)|0;o=e+8|0;c[o>>2]=l;c[e+44>>2]=n;m=(n|0)>0;a:do{if(m){p=0;do{c[l+(p<<4)+8>>2]=0;p=p+1|0}while((p|0)!=(n|0));if(m){p=b+8|0;q=l;r=0;while(1){s=q+(r<<4)|0;if((ak(c[k>>2]|0,g,1)|0)!=0){t=34;break}u=a[g]|0;if((u|0)==3){if((ak(c[k>>2]|0,g,8)|0)!=0){t=41;break}h[s>>3]=+h[g>>3];c[q+(r<<4)+8>>2]=3}else if((u|0)==0){c[q+(r<<4)+8>>2]=0}else if((u|0)==1){if((ak(c[k>>2]|0,g,1)|0)!=0){t=38;break}c[s>>2]=a[g]|0;c[q+(r<<4)+8>>2]=1}else if((u|0)==4){if((ak(c[k>>2]|0,g,4)|0)!=0){t=44;break}u=c[g>>2]|0;if((u|0)==0){v=0}else{w=bk(c[b>>2]|0,c[p>>2]|0,u)|0;if((ak(c[k>>2]|0,w,c[g>>2]|0)|0)!=0){t=47;break}v=Mi(c[b>>2]|0,w,(c[g>>2]|0)+ -1|0)|0}c[s>>2]=v;c[q+(r<<4)+8>>2]=d[v+4|0]|64}s=r+1|0;if((s|0)>=(n|0)){break a}q=c[o>>2]|0;r=s}if((t|0)==34){Mj(b,7952)}else if((t|0)==38){Mj(b,7952)}else if((t|0)==41){Mj(b,7952)}else if((t|0)==44){Mj(b,7952)}else if((t|0)==47){Mj(b,7952)}}}}while(0);if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}o=c[g>>2]|0;if((o|0)<0){Mj(b,8e3)}n=c[b>>2]|0;if((o+1|0)>>>0>1073741823){th(n)}v=uh(n,0,0,o<<2)|0;n=e+16|0;c[n>>2]=v;c[e+56>>2]=o;l=(o|0)>0;if(l){m=v;v=0;while(1){c[m+(v<<2)>>2]=0;r=v+1|0;if((r|0)==(o|0)){break}m=c[n>>2]|0;v=r}if(l){l=0;do{v=Rf(c[b>>2]|0)|0;c[(c[n>>2]|0)+(l<<2)>>2]=v;Kj(b,c[(c[n>>2]|0)+(l<<2)>>2]|0);l=l+1|0}while((l|0)!=(o|0))}}if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}o=c[g>>2]|0;if((o|0)<0){Mj(b,8e3)}l=c[b>>2]|0;if((o+1|0)>>>0>536870911){th(l)}n=uh(l,0,0,o<<3)|0;l=e+28|0;c[l>>2]=n;c[e+40>>2]=o;b:do{if((o|0)>0){c[n>>2]=0;if((o|0)==1){x=0}else{v=1;while(1){c[(c[l>>2]|0)+(v<<3)>>2]=0;m=v+1|0;if((m|0)==(o|0)){x=0;break}else{v=m}}}while(1){if((ak(c[k>>2]|0,g,1)|0)!=0){t=73;break}a[(c[l>>2]|0)+(x<<3)+4|0]=a[g]|0;if((ak(c[k>>2]|0,g,1)|0)!=0){t=75;break}a[(c[l>>2]|0)+(x<<3)+5|0]=a[g]|0;x=x+1|0;if((x|0)>=(o|0)){break b}}if((t|0)==73){Mj(b,7952)}else if((t|0)==75){Mj(b,7952)}}}while(0);if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}o=c[g>>2]|0;do{if((o|0)!=0){x=bk(c[b>>2]|0,c[b+8>>2]|0,o)|0;if((ak(c[k>>2]|0,x,c[g>>2]|0)|0)==0){y=Mi(c[b>>2]|0,x,(c[g>>2]|0)+ -1|0)|0;break}else{Mj(b,7952)}}else{y=0}}while(0);c[e+36>>2]=y;if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}y=c[g>>2]|0;if((y|0)<0){Mj(b,8e3)}o=c[b>>2]|0;if((y+1|0)>>>0>1073741823){th(o)}x=y<<2;n=uh(o,0,0,x)|0;c[e+20>>2]=n;c[e+52>>2]=y;if((ak(c[k>>2]|0,n,x)|0)!=0){Mj(b,7952)}if((ak(c[k>>2]|0,g,4)|0)!=0){Mj(b,7952)}x=c[g>>2]|0;if((x|0)<0){Mj(b,8e3)}n=c[b>>2]|0;if((x+1|0)>>>0>357913941){th(n)}y=uh(n,0,0,x*12|0)|0;n=e+24|0;c[n>>2]=y;c[e+60>>2]=x;c:do{if((x|0)>0){c[y>>2]=0;if((x|0)!=1){e=1;do{c[(c[n>>2]|0)+(e*12|0)>>2]=0;e=e+1|0}while((e|0)!=(x|0))}e=b+8|0;o=0;while(1){if((ak(c[k>>2]|0,g,4)|0)!=0){t=102;break}v=c[g>>2]|0;if((v|0)==0){z=0}else{m=bk(c[b>>2]|0,c[e>>2]|0,v)|0;if((ak(c[k>>2]|0,m,c[g>>2]|0)|0)!=0){t=105;break}z=Mi(c[b>>2]|0,m,(c[g>>2]|0)+ -1|0)|0}c[(c[n>>2]|0)+(o*12|0)>>2]=z;if((ak(c[k>>2]|0,g,4)|0)!=0){t=108;break}m=c[g>>2]|0;if((m|0)<0){t=110;break}c[(c[n>>2]|0)+(o*12|0)+4>>2]=m;if((ak(c[k>>2]|0,g,4)|0)!=0){t=112;break}m=c[g>>2]|0;if((m|0)<0){t=114;break}c[(c[n>>2]|0)+(o*12|0)+8>>2]=m;o=o+1|0;if((o|0)>=(x|0)){break c}}if((t|0)==102){Mj(b,7952)}else if((t|0)==105){Mj(b,7952)}else if((t|0)==108){Mj(b,7952)}else if((t|0)==110){Mj(b,8e3)}else if((t|0)==112){Mj(b,7952)}else if((t|0)==114){Mj(b,8e3)}}}while(0);if((ak(c[k>>2]|0,j,4)|0)!=0){Mj(b,7952)}x=c[j>>2]|0;if((x|0)<0){Mj(b,8e3)}if((x|0)<=0){i=f;return}j=b+8|0;n=0;while(1){if((ak(c[k>>2]|0,g,4)|0)!=0){t=123;break}z=c[g>>2]|0;if((z|0)==0){A=0}else{y=bk(c[b>>2]|0,c[j>>2]|0,z)|0;if((ak(c[k>>2]|0,y,c[g>>2]|0)|0)!=0){t=126;break}A=Mi(c[b>>2]|0,y,(c[g>>2]|0)+ -1|0)|0}c[(c[l>>2]|0)+(n<<3)>>2]=A;y=n+1|0;if((y|0)<(x|0)){n=y}else{t=129;break}}if((t|0)==123){Mj(b,7952)}else if((t|0)==126){Mj(b,7952)}else if((t|0)==129){i=f;return}}function Lj(b){b=b|0;var c=0,d=0;c=i;a[b]=1635077147;a[b+1|0]=6387020;a[b+2|0]=24949;a[b+3|0]=97;a[b+4|0]=82;a[b+5|0]=0;a[b+6|0]=1;a[b+7|0]=4;a[b+8|0]=4;a[b+9|0]=4;a[b+10|0]=8;d=b+12|0;a[b+11|0]=0;a[d+0|0]=a[7944|0]|0;a[d+1|0]=a[7945|0]|0;a[d+2|0]=a[7946|0]|0;a[d+3|0]=a[7947|0]|0;a[d+4|0]=a[7948|0]|0;a[d+5|0]=a[7949|0]|0;i=c;return}function Mj(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+16|0;e=d;d=c[a>>2]|0;c[e>>2]=c[a+12>>2];c[e+4>>2]=b;Rh(d,7968,e)|0;sf(c[a>>2]|0,3)}function Nj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;f=c[a+8>>2]|0;if((f|0)!=3){if((f&15|0)==4?(f=c[a>>2]|0,(Ph(f+16|0,c[f+12>>2]|0,e)|0)!=0):0){h[b>>3]=+h[e>>3];c[b+8>>2]=3;g=b}else{g=0}}else{g=a}i=d;return g|0}function Oj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,l=0,m=0;e=i;i=i+48|0;f=e;g=e+8|0;j=b+8|0;if((c[j>>2]|0)!=3){l=0;i=e;return l|0}h[k>>3]=+h[b>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];m=Mi(a,g,jb(g|0,8064,f|0)|0)|0;c[b>>2]=m;c[j>>2]=d[m+4|0]|0|64;l=1;i=e;return l|0}function Pj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+16|0;h=g;j=b+12|0;k=d;l=c[d+8>>2]|0;d=0;while(1){m=k+8|0;if((l|0)!=69){n=Ij(b,k,0)|0;o=c[n+8>>2]|0;if((o|0)==0){p=11;break}else{q=o;r=n}}else{n=c[k>>2]|0;s=uj(n,e)|0;t=s+8|0;if((c[t>>2]|0)!=0){p=9;break}o=c[n+8>>2]|0;if((o|0)==0){p=9;break}if(!((a[o+6|0]&1)==0)){p=9;break}n=Hj(o,0,c[(c[j>>2]|0)+184>>2]|0)|0;if((n|0)==0){p=9;break}q=c[n+8>>2]|0;r=n}n=d+1|0;if((q&15|0)==6){p=13;break}if((n|0)<100){k=r;l=q;d=n}else{p=14;break}}if((p|0)==9){d=s;s=c[d+4>>2]|0;q=f;c[q>>2]=c[d>>2];c[q+4>>2]=s;c[f+8>>2]=c[t>>2];i=g;return}else if((p|0)==11){lf(b,k,8072)}else if((p|0)==13){t=b+28|0;s=f-(c[t>>2]|0)|0;f=b+8|0;q=c[f>>2]|0;c[f>>2]=q+16;d=r;l=c[d+4>>2]|0;j=q;c[j>>2]=c[d>>2];c[j+4>>2]=l;c[q+8>>2]=c[r+8>>2];r=c[f>>2]|0;c[f>>2]=r+16;q=k;k=c[q+4>>2]|0;l=r;c[l>>2]=c[q>>2];c[l+4>>2]=k;c[r+8>>2]=c[m>>2];m=c[f>>2]|0;c[f>>2]=m+16;r=e;k=c[r+4>>2]|0;l=m;c[l>>2]=c[r>>2];c[l+4>>2]=k;c[m+8>>2]=c[e+8>>2];Af(b,(c[f>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);e=c[t>>2]|0;t=c[f>>2]|0;m=t+ -16|0;c[f>>2]=m;f=m;m=c[f+4>>2]|0;k=e+s|0;c[k>>2]=c[f>>2];c[k+4>>2]=m;c[e+(s+8)>>2]=c[t+ -8>>2];i=g;return}else if((p|0)==14){nf(b,8080,h)}}function Qj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+16|0;h=g;j=b+12|0;k=d;l=c[d+8>>2]|0;d=0;while(1){m=k+8|0;if((l|0)!=69){n=Ij(b,k,1)|0;o=c[n+8>>2]|0;if((o|0)==0){p=16;break}else{q=o;r=n}}else{s=c[k>>2]|0;t=uj(s,e)|0;if((c[t+8>>2]|0)!=0){u=t;break}n=c[s+8>>2]|0;if((n|0)==0){p=9;break}if(!((a[n+6|0]&2)==0)){p=9;break}o=Hj(n,1,c[(c[j>>2]|0)+188>>2]|0)|0;if((o|0)==0){p=9;break}q=c[o+8>>2]|0;r=o}o=d+1|0;if((q&15|0)==6){p=18;break}if((o|0)<100){k=r;l=q;d=o}else{p=19;break}}if((p|0)==9){if((t|0)==4320){u=qj(b,s,e)|0}else{u=t}}else if((p|0)==16){lf(b,k,8072)}else if((p|0)==18){t=b+8|0;d=c[t>>2]|0;c[t>>2]=d+16;q=r;l=c[q+4>>2]|0;j=d;c[j>>2]=c[q>>2];c[j+4>>2]=l;c[d+8>>2]=c[r+8>>2];r=c[t>>2]|0;c[t>>2]=r+16;d=k;k=c[d+4>>2]|0;l=r;c[l>>2]=c[d>>2];c[l+4>>2]=k;c[r+8>>2]=c[m>>2];m=c[t>>2]|0;c[t>>2]=m+16;r=e;k=c[r+4>>2]|0;l=m;c[l>>2]=c[r>>2];c[l+4>>2]=k;c[m+8>>2]=c[e+8>>2];e=c[t>>2]|0;c[t>>2]=e+16;m=f;k=c[m+4>>2]|0;l=e;c[l>>2]=c[m>>2];c[l+4>>2]=k;c[e+8>>2]=c[f+8>>2];Af(b,(c[t>>2]|0)+ -64|0,0,a[(c[b+16>>2]|0)+18|0]&1);i=g;return}else if((p|0)==19){nf(b,8104,h)}h=f;p=c[h+4>>2]|0;t=u;c[t>>2]=c[h>>2];c[t+4>>2]=p;p=f+8|0;c[u+8>>2]=c[p>>2];a[s+6|0]=0;if((c[p>>2]&64|0)==0){i=g;return}if((a[(c[f>>2]|0)+5|0]&3)==0){i=g;return}if((a[s+5|0]&4)==0){i=g;return}Wf(b,s);i=g;return}function Rj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;g=d+8|0;j=c[g>>2]|0;if((j|0)==3){if((c[e+8>>2]|0)==3){k=+h[d>>3]<+h[e>>3]|0;i=f;return k|0}}else{if((j&15|0)==4?(c[e+8>>2]&15|0)==4:0){j=c[d>>2]|0;l=c[e>>2]|0;m=j+16|0;n=l+16|0;o=Tm(m,n)|0;a:do{if((o|0)==0){p=m;q=c[j+12>>2]|0;r=c[l+12>>2]|0;s=n;while(1){t=Zm(p|0)|0;u=(t|0)==(q|0);if((t|0)==(r|0)){break}if(u){v=-1;break a}w=t+1|0;t=p+w|0;x=s+w|0;y=Tm(t,x)|0;if((y|0)==0){p=t;q=q-w|0;r=r-w|0;s=x}else{v=y;break a}}v=u&1^1}else{v=o}}while(0);k=v>>>31;i=f;return k|0}}v=b+8|0;o=c[v>>2]|0;u=Ij(b,d,13)|0;if((c[u+8>>2]|0)==0){n=Ij(b,e,13)|0;if((c[n+8>>2]|0)==0){qf(b,d,e)}else{z=n}}else{z=u}u=b+28|0;n=o-(c[u>>2]|0)|0;o=c[v>>2]|0;c[v>>2]=o+16;l=z;j=c[l+4>>2]|0;m=o;c[m>>2]=c[l>>2];c[m+4>>2]=j;c[o+8>>2]=c[z+8>>2];z=c[v>>2]|0;c[v>>2]=z+16;o=d;d=c[o+4>>2]|0;j=z;c[j>>2]=c[o>>2];c[j+4>>2]=d;c[z+8>>2]=c[g>>2];g=c[v>>2]|0;c[v>>2]=g+16;z=e;d=c[z+4>>2]|0;j=g;c[j>>2]=c[z>>2];c[j+4>>2]=d;c[g+8>>2]=c[e+8>>2];Af(b,(c[v>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[u>>2]|0;u=c[v>>2]|0;e=u+ -16|0;c[v>>2]=e;g=e;e=c[g+4>>2]|0;d=b+n|0;c[d>>2]=c[g>>2];c[d+4>>2]=e;c[b+(n+8)>>2]=c[u+ -8>>2];u=c[v>>2]|0;v=c[u+8>>2]|0;if((v|0)!=0){if((v|0)==1){A=(c[u>>2]|0)!=0}else{A=1}}else{A=0}k=A&1;i=f;return k|0}function Sj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=i;g=d+8|0;j=c[g>>2]|0;if((j|0)==3){if((c[e+8>>2]|0)==3){k=+h[d>>3]<=+h[e>>3]|0;i=f;return k|0}}else{if((j&15|0)==4?(c[e+8>>2]&15|0)==4:0){j=c[d>>2]|0;l=c[e>>2]|0;m=j+16|0;n=l+16|0;o=Tm(m,n)|0;a:do{if((o|0)==0){p=m;q=c[j+12>>2]|0;r=c[l+12>>2]|0;s=n;while(1){t=Zm(p|0)|0;u=(t|0)==(q|0);if((t|0)==(r|0)){break}if(u){v=-1;break a}w=t+1|0;t=p+w|0;x=s+w|0;y=Tm(t,x)|0;if((y|0)==0){p=t;q=q-w|0;r=r-w|0;s=x}else{v=y;break a}}v=u&1^1}else{v=o}}while(0);k=(v|0)<1|0;i=f;return k|0}}v=b+8|0;o=c[v>>2]|0;u=Ij(b,d,14)|0;if((c[u+8>>2]|0)==0){n=Ij(b,e,14)|0;if((c[n+8>>2]|0)==0){l=c[v>>2]|0;j=Ij(b,e,13)|0;if((c[j+8>>2]|0)==0){m=Ij(b,d,13)|0;if((c[m+8>>2]|0)==0){qf(b,d,e)}else{z=m}}else{z=j}j=b+28|0;m=l-(c[j>>2]|0)|0;l=c[v>>2]|0;c[v>>2]=l+16;s=z;r=c[s+4>>2]|0;q=l;c[q>>2]=c[s>>2];c[q+4>>2]=r;c[l+8>>2]=c[z+8>>2];z=c[v>>2]|0;c[v>>2]=z+16;l=e;r=c[l+4>>2]|0;q=z;c[q>>2]=c[l>>2];c[q+4>>2]=r;c[z+8>>2]=c[e+8>>2];z=c[v>>2]|0;c[v>>2]=z+16;r=d;q=c[r+4>>2]|0;l=z;c[l>>2]=c[r>>2];c[l+4>>2]=q;c[z+8>>2]=c[g>>2];Af(b,(c[v>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);z=c[j>>2]|0;j=c[v>>2]|0;q=j+ -16|0;c[v>>2]=q;l=q;q=c[l+4>>2]|0;r=z+m|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[z+(m+8)>>2]=c[j+ -8>>2];j=c[v>>2]|0;m=c[j+8>>2]|0;if((m|0)!=0){if((m|0)==1){A=(c[j>>2]|0)!=0}else{A=1}}else{A=0}k=A&1^1;i=f;return k|0}else{B=n}}else{B=u}u=b+28|0;n=o-(c[u>>2]|0)|0;o=c[v>>2]|0;c[v>>2]=o+16;A=B;j=c[A+4>>2]|0;m=o;c[m>>2]=c[A>>2];c[m+4>>2]=j;c[o+8>>2]=c[B+8>>2];B=c[v>>2]|0;c[v>>2]=B+16;o=d;d=c[o+4>>2]|0;j=B;c[j>>2]=c[o>>2];c[j+4>>2]=d;c[B+8>>2]=c[g>>2];g=c[v>>2]|0;c[v>>2]=g+16;B=e;d=c[B+4>>2]|0;j=g;c[j>>2]=c[B>>2];c[j+4>>2]=d;c[g+8>>2]=c[e+8>>2];Af(b,(c[v>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[u>>2]|0;u=c[v>>2]|0;e=u+ -16|0;c[v>>2]=e;g=e;e=c[g+4>>2]|0;d=b+n|0;c[d>>2]=c[g>>2];c[d+4>>2]=e;c[b+(n+8)>>2]=c[u+ -8>>2];u=c[v>>2]|0;v=c[u+8>>2]|0;if((v|0)!=0){if((v|0)==1){C=(c[u>>2]|0)!=0}else{C=1}}else{C=0}k=C&1;i=f;return k|0}function Tj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;g=d+8|0;a:do{switch(c[g>>2]&63|0){case 2:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;i=f;return j|0};case 22:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;i=f;return j|0};case 20:{j=Ii(c[d>>2]|0,c[e>>2]|0)|0;i=f;return j|0};case 7:{k=c[d>>2]|0;l=c[e>>2]|0;if((k|0)==(l|0)){j=1;i=f;return j|0}if((b|0)==0){j=0;i=f;return j|0}else{m=Uj(b,c[k+8>>2]|0,c[l+8>>2]|0)|0;break a}break};case 4:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;i=f;return j|0};case 0:{j=1;i=f;return j|0};case 3:{j=+h[d>>3]==+h[e>>3]|0;i=f;return j|0};case 1:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;i=f;return j|0};case 5:{l=c[d>>2]|0;k=c[e>>2]|0;if((l|0)==(k|0)){j=1;i=f;return j|0}if((b|0)==0){j=0;i=f;return j|0}else{m=Uj(b,c[l+8>>2]|0,c[k+8>>2]|0)|0;break a}break};default:{j=(c[d>>2]|0)==(c[e>>2]|0)|0;i=f;return j|0}}}while(0);if((m|0)==0){j=0;i=f;return j|0}k=b+8|0;l=c[k>>2]|0;n=b+28|0;o=l-(c[n>>2]|0)|0;c[k>>2]=l+16;p=m;q=c[p+4>>2]|0;r=l;c[r>>2]=c[p>>2];c[r+4>>2]=q;c[l+8>>2]=c[m+8>>2];m=c[k>>2]|0;c[k>>2]=m+16;l=d;d=c[l+4>>2]|0;q=m;c[q>>2]=c[l>>2];c[q+4>>2]=d;c[m+8>>2]=c[g>>2];g=c[k>>2]|0;c[k>>2]=g+16;m=e;d=c[m+4>>2]|0;q=g;c[q>>2]=c[m>>2];c[q+4>>2]=d;c[g+8>>2]=c[e+8>>2];Af(b,(c[k>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[n>>2]|0;n=c[k>>2]|0;e=n+ -16|0;c[k>>2]=e;g=e;e=c[g+4>>2]|0;d=b+o|0;c[d>>2]=c[g>>2];c[d+4>>2]=e;c[b+(o+8)>>2]=c[n+ -8>>2];n=c[k>>2]|0;k=c[n+8>>2]|0;if((k|0)!=0){if((k|0)==1){s=(c[n>>2]|0)!=0}else{s=1}}else{s=0}j=s&1;i=f;return j|0}function Uj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0;f=i;a:do{if(((d|0)!=0?(a[d+6|0]&32)==0:0)?(g=b+12|0,j=Hj(d,5,c[(c[g>>2]|0)+204>>2]|0)|0,(j|0)!=0):0){if((d|0)!=(e|0)){if(((e|0)!=0?(a[e+6|0]&32)==0:0)?(k=Hj(e,5,c[(c[g>>2]|0)+204>>2]|0)|0,(k|0)!=0):0){g=c[j+8>>2]|0;b:do{if((g|0)==(c[k+8>>2]|0)){switch(g&63|0){case 7:{if((c[j>>2]|0)==(c[k>>2]|0)){l=j;break a}else{break b}break};case 22:{m=(c[j>>2]|0)==(c[k>>2]|0)|0;break};case 3:{m=+h[j>>3]==+h[k>>3]|0;break};case 20:{m=Ii(c[j>>2]|0,c[k>>2]|0)|0;break};case 0:{l=j;break a;break};case 2:{m=(c[j>>2]|0)==(c[k>>2]|0)|0;break};case 5:{if((c[j>>2]|0)==(c[k>>2]|0)){l=j;break a}else{break b}break};case 4:{m=(c[j>>2]|0)==(c[k>>2]|0)|0;break};case 1:{m=(c[j>>2]|0)==(c[k>>2]|0)|0;break};default:{m=(c[j>>2]|0)==(c[k>>2]|0)|0}}if((m|0)!=0){l=j;break a}}}while(0);l=0}else{l=0}}else{l=j}}else{l=0}}while(0);i=f;return l|0}function Vj(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;f=i;i=i+48|0;g=f;j=f+8|0;l=b+8|0;m=b+12|0;n=b+28|0;o=b+16|0;p=e;e=c[l>>2]|0;a:while(1){q=e+ -32|0;r=e+ -24|0;s=c[r>>2]|0;t=e+ -16|0;do{if((s&15|0)==4|(s|0)==3){u=e+ -8|0;v=c[u>>2]|0;if((v&15|0)==4){w=t;x=s}else{if((v|0)!=3){y=7;break}h[k>>3]=+h[t>>3];c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];v=Mi(b,j,jb(j|0,8064,g|0)|0)|0;c[t>>2]=v;c[u>>2]=d[v+4|0]|0|64;w=t;x=c[r>>2]|0}v=c[(c[w>>2]|0)+12>>2]|0;z=(x&15|0)==4;if((v|0)==0){if(z){A=2;break}if((x|0)!=3){A=2;break}h[k>>3]=+h[q>>3];c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];B=Mi(b,j,jb(j|0,8064,g|0)|0)|0;c[q>>2]=B;c[r>>2]=d[B+4|0]|0|64;A=2;break}if(z?(c[(c[q>>2]|0)+12>>2]|0)==0:0){z=t;B=c[z+4>>2]|0;C=q;c[C>>2]=c[z>>2];c[C+4>>2]=B;c[r>>2]=c[u>>2];A=2;break}b:do{if((p|0)>1){u=1;B=v;while(1){C=~u;z=e+(C<<4)|0;D=e+(C<<4)+8|0;C=c[D>>2]|0;if((C&15|0)==4){E=z}else{if((C|0)!=3){F=u;G=B;break b}h[k>>3]=+h[z>>3];c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];C=Mi(b,j,jb(j|0,8064,g|0)|0)|0;c[z>>2]=C;c[D>>2]=d[C+4|0]|0|64;E=z}z=c[(c[E>>2]|0)+12>>2]|0;if(!(z>>>0<(-3-B|0)>>>0)){y=24;break a}C=z+B|0;z=u+1|0;if((z|0)<(p|0)){u=z;B=C}else{F=z;G=C;break}}}else{F=1;G=v}}while(0);v=bk(b,(c[m>>2]|0)+144|0,G)|0;B=F;u=0;do{C=c[e+(0-B<<4)>>2]|0;z=c[C+12>>2]|0;an(v+u|0,C+16|0,z|0)|0;u=z+u|0;B=B+ -1|0}while((B|0)>0);B=0-F|0;z=Mi(b,v,u)|0;c[e+(B<<4)>>2]=z;c[e+(B<<4)+8>>2]=d[z+4|0]|0|64;A=F}else{y=7}}while(0);if((y|0)==7){y=0;s=Ij(b,q,15)|0;if((c[s+8>>2]|0)==0){z=Ij(b,t,15)|0;if((c[z+8>>2]|0)==0){y=10;break}else{H=z}}else{H=s}s=q-(c[n>>2]|0)|0;z=c[l>>2]|0;c[l>>2]=z+16;B=H;C=c[B+4>>2]|0;D=z;c[D>>2]=c[B>>2];c[D+4>>2]=C;c[z+8>>2]=c[H+8>>2];z=c[l>>2]|0;c[l>>2]=z+16;C=q;D=c[C+4>>2]|0;B=z;c[B>>2]=c[C>>2];c[B+4>>2]=D;c[z+8>>2]=c[r>>2];z=c[l>>2]|0;c[l>>2]=z+16;D=t;B=c[D+4>>2]|0;C=z;c[C>>2]=c[D>>2];c[C+4>>2]=B;c[z+8>>2]=c[e+ -8>>2];Af(b,(c[l>>2]|0)+ -48|0,1,a[(c[o>>2]|0)+18|0]&1);z=c[n>>2]|0;B=c[l>>2]|0;C=B+ -16|0;c[l>>2]=C;D=C;C=c[D+4>>2]|0;I=z+s|0;c[I>>2]=c[D>>2];c[I+4>>2]=C;c[z+(s+8)>>2]=c[B+ -8>>2];A=2}B=p+1-A|0;s=(c[l>>2]|0)+(1-A<<4)|0;c[l>>2]=s;if((B|0)>1){p=B;e=s}else{y=30;break}}if((y|0)==10){of(b,q,t)}else if((y|0)==24){nf(b,8128,g)}else if((y|0)==30){i=f;return}}function Wj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=e+8|0;j=c[g>>2]&15;do{if((j|0)==4){h[d>>3]=+((c[(c[e>>2]|0)+12>>2]|0)>>>0);c[d+8>>2]=3;i=f;return}else if((j|0)!=5){k=Ij(b,e,4)|0;if((c[k+8>>2]|0)==0){lf(b,e,8152)}else{l=k}}else{k=c[e>>2]|0;m=c[k+8>>2]|0;if(((m|0)!=0?(a[m+6|0]&16)==0:0)?(n=Hj(m,4,c[(c[b+12>>2]|0)+200>>2]|0)|0,(n|0)!=0):0){l=n;break}h[d>>3]=+(vj(k)|0);c[d+8>>2]=3;i=f;return}}while(0);j=b+28|0;k=d-(c[j>>2]|0)|0;d=b+8|0;n=c[d>>2]|0;c[d>>2]=n+16;m=l;o=c[m+4>>2]|0;p=n;c[p>>2]=c[m>>2];c[p+4>>2]=o;c[n+8>>2]=c[l+8>>2];l=c[d>>2]|0;c[d>>2]=l+16;n=e;o=c[n+4>>2]|0;p=l;c[p>>2]=c[n>>2];c[p+4>>2]=o;c[l+8>>2]=c[g>>2];l=c[d>>2]|0;c[d>>2]=l+16;o=e;e=c[o+4>>2]|0;p=l;c[p>>2]=c[o>>2];c[p+4>>2]=e;c[l+8>>2]=c[g>>2];Af(b,(c[d>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[j>>2]|0;j=c[d>>2]|0;g=j+ -16|0;c[d>>2]=g;d=g;g=c[d+4>>2]|0;l=b+k|0;c[l>>2]=c[d>>2];c[l+4>>2]=g;c[b+(k+8)>>2]=c[j+ -8>>2];i=f;return}function Xj(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0;j=i;i=i+32|0;k=j+24|0;l=j+16|0;m=j;n=e+8|0;o=c[n>>2]|0;if((o|0)!=3){if((o&15|0)==4?(o=c[e>>2]|0,(Ph(o+16|0,c[o+12>>2]|0,l)|0)!=0):0){h[m>>3]=+h[l>>3];c[m+8>>2]=3;p=m;q=5}}else{p=e;q=5}do{if((q|0)==5){m=c[f+8>>2]|0;if((m|0)==3){if((f|0)==0){break}r=+h[f>>3]}else{if((m&15|0)!=4){break}m=c[f>>2]|0;if((Ph(m+16|0,c[m+12>>2]|0,k)|0)==0){break}r=+h[k>>3]}h[d>>3]=+Nh(g+ -6|0,+h[p>>3],r);c[d+8>>2]=3;i=j;return}}while(0);p=Ij(b,e,g)|0;if((c[p+8>>2]|0)==0){k=Ij(b,f,g)|0;if((c[k+8>>2]|0)==0){pf(b,e,f)}else{s=k}}else{s=p}p=b+28|0;k=d-(c[p>>2]|0)|0;d=b+8|0;g=c[d>>2]|0;c[d>>2]=g+16;q=s;m=c[q+4>>2]|0;l=g;c[l>>2]=c[q>>2];c[l+4>>2]=m;c[g+8>>2]=c[s+8>>2];s=c[d>>2]|0;c[d>>2]=s+16;g=e;e=c[g+4>>2]|0;m=s;c[m>>2]=c[g>>2];c[m+4>>2]=e;c[s+8>>2]=c[n>>2];n=c[d>>2]|0;c[d>>2]=n+16;s=f;e=c[s+4>>2]|0;m=n;c[m>>2]=c[s>>2];c[m+4>>2]=e;c[n+8>>2]=c[f+8>>2];Af(b,(c[d>>2]|0)+ -48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[p>>2]|0;p=c[d>>2]|0;f=p+ -16|0;c[d>>2]=f;d=f;f=c[d+4>>2]|0;n=b+k|0;c[n>>2]=c[d>>2];c[n+4>>2]=f;c[b+(k+8)>>2]=c[p+ -8>>2];i=j;return}function Yj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;d=c[a+16>>2]|0;e=d+24|0;f=c[e>>2]|0;g=d+28|0;h=c[(c[g>>2]|0)+ -4>>2]|0;j=h&63;switch(j|0){case 24:case 25:case 26:{k=a+8|0;l=c[k>>2]|0;m=c[l+ -8>>2]|0;if((m|0)!=0){if((m|0)==1){n=(c[l+ -16>>2]|0)==0}else{n=0}}else{n=1}m=n&1;n=m^1;c[k>>2]=l+ -16;if((j|0)==26){j=(c[(Ij(a,f+(h>>>23<<4)|0,14)|0)+8>>2]|0)==0;o=j?m:n}else{o=n}if((o|0)==(h>>>6&255|0)){i=b;return}c[g>>2]=(c[g>>2]|0)+4;i=b;return};case 34:{c[a+8>>2]=c[d+4>>2];i=b;return};case 29:{if((h&8372224|0)==0){i=b;return}c[a+8>>2]=c[d+4>>2];i=b;return};case 22:{g=a+8|0;o=c[g>>2]|0;n=o+ -32|0;m=n-(f+(h>>>23<<4))|0;j=o+ -16|0;l=c[j+4>>2]|0;k=o+ -48|0;c[k>>2]=c[j>>2];c[k+4>>2]=l;c[o+ -40>>2]=c[o+ -8>>2];if((m|0)>16){c[g>>2]=n;Vj(a,m>>4)}m=c[g>>2]|0;n=c[e>>2]|0;e=h>>>6&255;o=m+ -16|0;l=c[o+4>>2]|0;k=n+(e<<4)|0;c[k>>2]=c[o>>2];c[k+4>>2]=l;c[n+(e<<4)+8>>2]=c[m+ -8>>2];c[g>>2]=c[d+4>>2];i=b;return};case 12:case 7:case 6:case 21:case 19:case 18:case 17:case 16:case 15:case 14:case 13:{d=a+8|0;a=c[d>>2]|0;g=a+ -16|0;c[d>>2]=g;d=h>>>6&255;h=g;g=c[h+4>>2]|0;m=f+(d<<4)|0;c[m>>2]=c[h>>2];c[m+4>>2]=g;c[f+(d<<4)+8>>2]=c[a+ -8>>2];i=b;return};default:{i=b;return}}}function Zj(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,S=0,T=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0.0,ka=0.0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0.0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0;e=i;i=i+32|0;f=e+24|0;g=e+16|0;j=e+8|0;k=e;l=b+16|0;m=b+40|0;n=b+12|0;o=b+8|0;p=b+24|0;q=b+48|0;r=b+20|0;s=b+6|0;t=b+44|0;u=c[l>>2]|0;a:while(1){v=c[c[u>>2]>>2]|0;w=v+12|0;x=c[(c[w>>2]|0)+8>>2]|0;y=u+24|0;z=u+28|0;A=v+16|0;v=u+4|0;B=c[y>>2]|0;b:while(1){C=c[z>>2]|0;c[z>>2]=C+4;D=c[C>>2]|0;C=a[m]|0;do{if((C&12)==0){E=B}else{F=(c[q>>2]|0)+ -1|0;c[q>>2]=F;G=(F|0)==0;if(!G?(C&4)==0:0){E=B;break}H=c[l>>2]|0;F=C&255;if((F&8|0)==0|G^1){I=0}else{c[q>>2]=c[t>>2];I=1}J=H+18|0;G=d[J]|0;if((G&128|0)==0){if(I){xf(b,3,-1)}do{if((F&4|0)==0){K=H+28|0}else{L=c[(c[c[H>>2]>>2]|0)+12>>2]|0;M=H+28|0;N=c[M>>2]|0;O=c[L+12>>2]|0;P=(N-O>>2)+ -1|0;Q=c[L+20>>2]|0;L=(Q|0)==0;if(L){S=0}else{S=c[Q+(P<<2)>>2]|0}if((P|0)!=0?(P=c[r>>2]|0,N>>>0>P>>>0):0){if(L){T=0}else{T=c[Q+((P-O>>2)+ -1<<2)>>2]|0}if((S|0)==(T|0)){K=M;break}}xf(b,2,S);K=M}}while(0);c[r>>2]=c[K>>2];if((a[s]|0)==1){V=23;break a}}else{a[J]=G&127}E=c[y>>2]|0}}while(0);W=D>>>6&255;X=E+(W<<4)|0;do{switch(D&63|0){case 11:{C=D>>>23;F=D>>>14&511;M=oj(b)|0;c[X>>2]=M;c[E+(W<<4)+8>>2]=69;if((F|C|0)!=0){O=Lh(C)|0;jj(b,M,O,Lh(F)|0)}if((c[(c[n>>2]|0)+12>>2]|0)>0){c[o>>2]=E+(W+1<<4);gg(b);c[o>>2]=c[v>>2]}B=c[y>>2]|0;continue b;break};case 7:{F=D>>>14;if((F&256|0)==0){Y=E+((F&511)<<4)|0}else{Y=x+((F&255)<<4)|0}Pj(b,E+(D>>>23<<4)|0,Y,X);B=c[y>>2]|0;continue b;break};case 6:{F=D>>>14;if((F&256|0)==0){Z=E+((F&511)<<4)|0}else{Z=x+((F&255)<<4)|0}Pj(b,c[(c[A+(D>>>23<<2)>>2]|0)+8>>2]|0,Z,X);B=c[y>>2]|0;continue b;break};case 1:{F=D>>>14;O=x+(F<<4)|0;M=c[O+4>>2]|0;C=X;c[C>>2]=c[O>>2];c[C+4>>2]=M;c[E+(W<<4)+8>>2]=c[x+(F<<4)+8>>2];B=E;continue b;break};case 19:{F=D>>>23;M=E+(F<<4)|0;if((c[E+(F<<4)+8>>2]|0)==3){h[X>>3]=-+h[M>>3];c[E+(W<<4)+8>>2]=3;B=E;continue b}else{Xj(b,X,M,M,12);B=c[y>>2]|0;continue b}break};case 18:{M=D>>>23;if((M&256|0)==0){_=E+(M<<4)|0}else{_=x+((M&255)<<4)|0}M=D>>>14;if((M&256|0)==0){$=E+((M&511)<<4)|0}else{$=x+((M&255)<<4)|0}if((c[_+8>>2]|0)==3?(c[$+8>>2]|0)==3:0){h[X>>3]=+U(+(+h[_>>3]),+(+h[$>>3]));c[E+(W<<4)+8>>2]=3;B=E;continue b}Xj(b,X,_,$,11);B=c[y>>2]|0;continue b;break};case 12:{M=D>>>23;F=E+(M<<4)|0;C=W+1|0;O=F;P=c[O+4>>2]|0;Q=E+(C<<4)|0;c[Q>>2]=c[O>>2];c[Q+4>>2]=P;c[E+(C<<4)+8>>2]=c[E+(M<<4)+8>>2];M=D>>>14;if((M&256|0)==0){aa=E+((M&511)<<4)|0}else{aa=x+((M&255)<<4)|0}Pj(b,F,aa,X);B=c[y>>2]|0;continue b;break};case 13:{F=D>>>23;if((F&256|0)==0){ba=E+(F<<4)|0}else{ba=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){ca=E+((F&511)<<4)|0}else{ca=x+((F&255)<<4)|0}if((c[ba+8>>2]|0)==3?(c[ca+8>>2]|0)==3:0){h[X>>3]=+h[ba>>3]+ +h[ca>>3];c[E+(W<<4)+8>>2]=3;B=E;continue b}Xj(b,X,ba,ca,6);B=c[y>>2]|0;continue b;break};case 10:{F=D>>>23;if((F&256|0)==0){da=E+(F<<4)|0}else{da=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){ea=E+((F&511)<<4)|0}else{ea=x+((F&255)<<4)|0}Qj(b,X,da,ea);B=c[y>>2]|0;continue b;break};case 15:{F=D>>>23;if((F&256|0)==0){fa=E+(F<<4)|0}else{fa=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){ga=E+((F&511)<<4)|0}else{ga=x+((F&255)<<4)|0}if((c[fa+8>>2]|0)==3?(c[ga+8>>2]|0)==3:0){h[X>>3]=+h[fa>>3]*+h[ga>>3];c[E+(W<<4)+8>>2]=3;B=E;continue b}Xj(b,X,fa,ga,8);B=c[y>>2]|0;continue b;break};case 17:{F=D>>>23;if((F&256|0)==0){ha=E+(F<<4)|0}else{ha=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){ia=E+((F&511)<<4)|0}else{ia=x+((F&255)<<4)|0}if((c[ha+8>>2]|0)==3?(c[ia+8>>2]|0)==3:0){ja=+h[ha>>3];ka=+h[ia>>3];h[X>>3]=ja-ka*+R(+(ja/ka));c[E+(W<<4)+8>>2]=3;B=E;continue b}Xj(b,X,ha,ia,10);B=c[y>>2]|0;continue b;break};case 3:{c[X>>2]=D>>>23;c[E+(W<<4)+8>>2]=1;if((D&8372224|0)==0){B=E;continue b}c[z>>2]=(c[z>>2]|0)+4;B=E;continue b;break};case 9:{F=c[A+(D>>>23<<2)>>2]|0;M=c[F+8>>2]|0;C=X;P=c[C+4>>2]|0;Q=M;c[Q>>2]=c[C>>2];c[Q+4>>2]=P;P=E+(W<<4)+8|0;c[M+8>>2]=c[P>>2];if((c[P>>2]&64|0)==0){B=E;continue b}P=c[X>>2]|0;if((a[P+5|0]&3)==0){B=E;continue b}if((a[F+5|0]&4)==0){B=E;continue b}Uf(b,F,P);B=E;continue b;break};case 0:{P=D>>>23;F=E+(P<<4)|0;M=c[F+4>>2]|0;Q=X;c[Q>>2]=c[F>>2];c[Q+4>>2]=M;c[E+(W<<4)+8>>2]=c[E+(P<<4)+8>>2];B=E;continue b;break};case 5:{P=c[(c[A+(D>>>23<<2)>>2]|0)+8>>2]|0;M=P;Q=c[M+4>>2]|0;F=X;c[F>>2]=c[M>>2];c[F+4>>2]=Q;c[E+(W<<4)+8>>2]=c[P+8>>2];B=E;continue b;break};case 8:{P=D>>>23;if((P&256|0)==0){la=E+(P<<4)|0}else{la=x+((P&255)<<4)|0}P=D>>>14;if((P&256|0)==0){ma=E+((P&511)<<4)|0}else{ma=x+((P&255)<<4)|0}Qj(b,c[(c[A+(W<<2)>>2]|0)+8>>2]|0,la,ma);B=c[y>>2]|0;continue b;break};case 2:{P=c[z>>2]|0;c[z>>2]=P+4;Q=(c[P>>2]|0)>>>6;P=x+(Q<<4)|0;F=c[P+4>>2]|0;M=X;c[M>>2]=c[P>>2];c[M+4>>2]=F;c[E+(W<<4)+8>>2]=c[x+(Q<<4)+8>>2];B=E;continue b;break};case 4:{Q=D>>>23;F=X;while(1){c[F+8>>2]=0;if((Q|0)==0){B=E;continue b}else{Q=Q+ -1|0;F=F+16|0}}break};case 20:{F=D>>>23;Q=c[E+(F<<4)+8>>2]|0;if((Q|0)!=0){if((Q|0)==1){na=(c[E+(F<<4)>>2]|0)==0}else{na=0}}else{na=1}c[X>>2]=na&1;c[E+(W<<4)+8>>2]=1;B=E;continue b;break};case 21:{Wj(b,X,E+(D>>>23<<4)|0);B=c[y>>2]|0;continue b;break};case 23:{if((W|0)!=0){Qf(b,(c[y>>2]|0)+(W+ -1<<4)|0)}c[z>>2]=(c[z>>2]|0)+((D>>>14)+ -131071<<2);B=E;continue b;break};case 24:{F=D>>>23;if((F&256|0)==0){oa=E+(F<<4)|0}else{oa=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){pa=E+((F&511)<<4)|0}else{pa=x+((F&255)<<4)|0}if((c[oa+8>>2]|0)==(c[pa+8>>2]|0)){qa=(Tj(b,oa,pa)|0)!=0}else{qa=0}F=c[z>>2]|0;if((qa&1|0)==(W|0)){Q=c[F>>2]|0;G=Q>>>6&255;if((G|0)==0){ra=F}else{Qf(b,(c[y>>2]|0)+(G+ -1<<4)|0);ra=c[z>>2]|0}sa=ra+((Q>>>14)+ -131070<<2)|0}else{sa=F+4|0}c[z>>2]=sa;B=c[y>>2]|0;continue b;break};case 16:{F=D>>>23;if((F&256|0)==0){ta=E+(F<<4)|0}else{ta=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){ua=E+((F&511)<<4)|0}else{ua=x+((F&255)<<4)|0}if((c[ta+8>>2]|0)==3?(c[ua+8>>2]|0)==3:0){h[X>>3]=+h[ta>>3]/+h[ua>>3];c[E+(W<<4)+8>>2]=3;B=E;continue b}Xj(b,X,ta,ua,9);B=c[y>>2]|0;continue b;break};case 14:{F=D>>>23;if((F&256|0)==0){va=E+(F<<4)|0}else{va=x+((F&255)<<4)|0}F=D>>>14;if((F&256|0)==0){wa=E+((F&511)<<4)|0}else{wa=x+((F&255)<<4)|0}if((c[va+8>>2]|0)==3?(c[wa+8>>2]|0)==3:0){h[X>>3]=+h[va>>3]- +h[wa>>3];c[E+(W<<4)+8>>2]=3;B=E;continue b}Xj(b,X,va,wa,7);B=c[y>>2]|0;continue b;break};case 22:{F=D>>>23;Q=D>>>14&511;c[o>>2]=E+(Q+1<<4);Vj(b,1-F+Q|0);Q=c[y>>2]|0;G=Q+(F<<4)|0;M=G;P=c[M+4>>2]|0;C=Q+(W<<4)|0;c[C>>2]=c[M>>2];c[C+4>>2]=P;c[Q+(W<<4)+8>>2]=c[Q+(F<<4)+8>>2];if((c[(c[n>>2]|0)+12>>2]|0)>0){if(W>>>0<F>>>0){xa=G}else{xa=Q+(W+1<<4)|0}c[o>>2]=xa;gg(b);c[o>>2]=c[v>>2]}Q=c[y>>2]|0;c[o>>2]=c[v>>2];B=Q;continue b;break};case 25:{Q=D>>>23;if((Q&256|0)==0){ya=E+(Q<<4)|0}else{ya=x+((Q&255)<<4)|0}Q=D>>>14;if((Q&256|0)==0){za=E+((Q&511)<<4)|0}else{za=x+((Q&255)<<4)|0}Q=(Rj(b,ya,za)|0)==(W|0);G=c[z>>2]|0;if(Q){Q=c[G>>2]|0;F=Q>>>6&255;if((F|0)==0){Aa=G}else{Qf(b,(c[y>>2]|0)+(F+ -1<<4)|0);Aa=c[z>>2]|0}Ba=Aa+((Q>>>14)+ -131070<<2)|0}else{Ba=G+4|0}c[z>>2]=Ba;B=c[y>>2]|0;continue b;break};case 26:{G=D>>>23;if((G&256|0)==0){Ca=E+(G<<4)|0}else{Ca=x+((G&255)<<4)|0}G=D>>>14;if((G&256|0)==0){Da=E+((G&511)<<4)|0}else{Da=x+((G&255)<<4)|0}G=(Sj(b,Ca,Da)|0)==(W|0);Q=c[z>>2]|0;if(G){G=c[Q>>2]|0;F=G>>>6&255;if((F|0)==0){Ea=Q}else{Qf(b,(c[y>>2]|0)+(F+ -1<<4)|0);Ea=c[z>>2]|0}Fa=Ea+((G>>>14)+ -131070<<2)|0}else{Fa=Q+4|0}c[z>>2]=Fa;B=c[y>>2]|0;continue b;break};case 27:{Q=c[E+(W<<4)+8>>2]|0;G=(Q|0)==0;if((D&8372224|0)==0){if(!G){if(!((Q|0)==1?(c[X>>2]|0)==0:0)){V=192}}}else{if(!G){if((Q|0)==1?(c[X>>2]|0)==0:0){V=192}}else{V=192}}if((V|0)==192){V=0;c[z>>2]=(c[z>>2]|0)+4;B=E;continue b}Q=c[z>>2]|0;G=c[Q>>2]|0;F=G>>>6&255;if((F|0)==0){Ga=Q}else{Qf(b,(c[y>>2]|0)+(F+ -1<<4)|0);Ga=c[z>>2]|0}c[z>>2]=Ga+((G>>>14)+ -131070<<2);B=E;continue b;break};case 28:{G=D>>>23;F=E+(G<<4)|0;Q=c[E+(G<<4)+8>>2]|0;G=(Q|0)==0;if((D&8372224|0)==0){if(!G){if(!((Q|0)==1?(c[F>>2]|0)==0:0)){V=203}}}else{if(!G){if((Q|0)==1?(c[F>>2]|0)==0:0){V=203}}else{V=203}}if((V|0)==203){V=0;c[z>>2]=(c[z>>2]|0)+4;B=E;continue b}G=F;F=c[G+4>>2]|0;P=X;c[P>>2]=c[G>>2];c[P+4>>2]=F;c[E+(W<<4)+8>>2]=Q;Q=c[z>>2]|0;F=c[Q>>2]|0;P=F>>>6&255;if((P|0)==0){Ha=Q}else{Qf(b,(c[y>>2]|0)+(P+ -1<<4)|0);Ha=c[z>>2]|0}c[z>>2]=Ha+((F>>>14)+ -131070<<2);B=E;continue b;break};case 30:{F=D>>>23;if((F|0)!=0){c[o>>2]=E+(W+F<<4)}if((yf(b,X,-1)|0)==0){V=218;break b}B=c[y>>2]|0;continue b;break};case 29:{F=D>>>23;P=D>>>14&511;if((F|0)!=0){c[o>>2]=E+(W+F<<4)}if((yf(b,X,P+ -1|0)|0)==0){V=213;break b}if((P|0)!=0){c[o>>2]=c[v>>2]}B=c[y>>2]|0;continue b;break};case 31:{V=223;break b;break};case 33:{P=W+1|0;F=E+(P<<4)|0;Q=W+2|0;G=E+(Q<<4)|0;C=E+(W<<4)+8|0;M=c[C>>2]|0;if((M|0)!=3){if((M&15|0)!=4){V=239;break a}M=c[X>>2]|0;if((Ph(M+16|0,c[M+12>>2]|0,k)|0)==0){V=239;break a}h[X>>3]=+h[k>>3];c[C>>2]=3;if((X|0)==0){V=239;break a}}M=E+(P<<4)+8|0;P=c[M>>2]|0;if((P|0)!=3){if((P&15|0)!=4){V=244;break a}P=c[F>>2]|0;if((Ph(P+16|0,c[P+12>>2]|0,j)|0)==0){V=244;break a}h[F>>3]=+h[j>>3];c[M>>2]=3}M=E+(Q<<4)+8|0;Q=c[M>>2]|0;if((Q|0)!=3){if((Q&15|0)!=4){V=249;break a}Q=c[G>>2]|0;if((Ph(Q+16|0,c[Q+12>>2]|0,g)|0)==0){V=249;break a}h[G>>3]=+h[g>>3];c[M>>2]=3}h[X>>3]=+h[X>>3]- +h[G>>3];c[C>>2]=3;c[z>>2]=(c[z>>2]|0)+((D>>>14)+ -131071<<2);B=E;continue b;break};case 32:{ka=+h[E+(W+2<<4)>>3];ja=ka+ +h[X>>3];Ia=+h[E+(W+1<<4)>>3];if(ka>0.0){if(!(ja<=Ia)){B=E;continue b}}else{if(!(Ia<=ja)){B=E;continue b}}c[z>>2]=(c[z>>2]|0)+((D>>>14)+ -131071<<2);h[X>>3]=ja;c[E+(W<<4)+8>>2]=3;C=W+3|0;h[E+(C<<4)>>3]=ja;c[E+(C<<4)+8>>2]=3;B=E;continue b;break};case 35:{Ja=E;Ka=D;La=X;break};case 34:{C=W+3|0;G=E+(C<<4)|0;M=W+2|0;Q=W+5|0;F=E+(M<<4)|0;P=c[F+4>>2]|0;O=E+(Q<<4)|0;c[O>>2]=c[F>>2];c[O+4>>2]=P;c[E+(Q<<4)+8>>2]=c[E+(M<<4)+8>>2];M=W+1|0;Q=W+4|0;P=E+(M<<4)|0;O=c[P+4>>2]|0;F=E+(Q<<4)|0;c[F>>2]=c[P>>2];c[F+4>>2]=O;c[E+(Q<<4)+8>>2]=c[E+(M<<4)+8>>2];M=X;Q=c[M+4>>2]|0;O=G;c[O>>2]=c[M>>2];c[O+4>>2]=Q;c[E+(C<<4)+8>>2]=c[E+(W<<4)+8>>2];c[o>>2]=E+(W+6<<4);Af(b,G,D>>>14&511,1);G=c[y>>2]|0;c[o>>2]=c[v>>2];C=c[z>>2]|0;c[z>>2]=C+4;Q=c[C>>2]|0;Ja=G;Ka=Q;La=G+((Q>>>6&255)<<4)|0;break};case 36:{Q=D>>>23;G=D>>>14&511;if((Q|0)==0){Ma=((c[o>>2]|0)-X>>4)+ -1|0}else{Ma=Q}if((G|0)==0){Q=c[z>>2]|0;c[z>>2]=Q+4;Na=(c[Q>>2]|0)>>>6}else{Na=G}G=c[X>>2]|0;Q=Ma+ -50+(Na*50|0)|0;if((Q|0)>(c[G+28>>2]|0)){nj(b,G,Q)}if((Ma|0)>0){C=G+5|0;O=Q;Q=Ma;do{M=Q+W|0;F=E+(M<<4)|0;P=O;O=O+ -1|0;lj(b,G,P,F);if(((c[E+(M<<4)+8>>2]&64|0)!=0?!((a[(c[F>>2]|0)+5|0]&3)==0):0)?!((a[C]&4)==0):0){Wf(b,G)}Q=Q+ -1|0}while((Q|0)>0)}c[o>>2]=c[v>>2];B=E;continue b;break};case 37:{Q=c[(c[(c[w>>2]|0)+16>>2]|0)+(D>>>14<<2)>>2]|0;G=Q+32|0;C=c[G>>2]|0;O=c[Q+40>>2]|0;F=c[Q+28>>2]|0;c:do{if((C|0)==0){V=276}else{if((O|0)>0){M=C+16|0;P=0;do{L=d[F+(P<<3)+5|0]|0;if((a[F+(P<<3)+4|0]|0)==0){Oa=c[(c[A+(L<<2)>>2]|0)+8>>2]|0}else{Oa=E+(L<<4)|0}L=P;P=P+1|0;if((c[(c[M+(L<<2)>>2]|0)+8>>2]|0)!=(Oa|0)){V=276;break c}}while((P|0)<(O|0))}c[X>>2]=C;c[E+(W<<4)+8>>2]=70}}while(0);if((V|0)==276){V=0;C=Mf(b,O)|0;c[C+12>>2]=Q;c[X>>2]=C;c[E+(W<<4)+8>>2]=70;if((O|0)>0){P=C+16|0;M=0;do{L=d[F+(M<<3)+5|0]|0;if((a[F+(M<<3)+4|0]|0)==0){c[P+(M<<2)>>2]=c[A+(L<<2)>>2]}else{c[P+(M<<2)>>2]=Of(b,E+(L<<4)|0)|0}M=M+1|0}while((M|0)!=(O|0))}if(!((a[Q+5|0]&4)==0)){Xf(b,Q,C)}c[G>>2]=C}if((c[(c[n>>2]|0)+12>>2]|0)>0){c[o>>2]=E+(W+1<<4);gg(b);c[o>>2]=c[v>>2]}B=c[y>>2]|0;continue b;break};case 38:{O=D>>>23;M=O+ -1|0;P=(E-(c[u>>2]|0)>>4)-(d[(c[w>>2]|0)+76|0]|0)|0;F=P+ -1|0;if((O|0)==0){if(((c[p>>2]|0)-(c[o>>2]|0)>>4|0)<=(F|0)){vf(b,F)}O=c[y>>2]|0;c[o>>2]=O+(F+W<<4);Pa=F;Qa=O;Ra=O+(W<<4)|0}else{Pa=M;Qa=E;Ra=X}if((Pa|0)<=0){B=Qa;continue b}M=1-P|0;P=0;while(1){if((P|0)<(F|0)){O=P+M|0;L=Qa+(O<<4)|0;N=c[L+4>>2]|0;Sa=Ra+(P<<4)|0;c[Sa>>2]=c[L>>2];c[Sa+4>>2]=N;c[Ra+(P<<4)+8>>2]=c[Qa+(O<<4)+8>>2]}else{c[Ra+(P<<4)+8>>2]=0}O=P+1|0;if((O|0)==(Pa|0)){B=Qa;continue b}else{P=O}}break};default:{B=E;continue b}}}while(0);P=c[La+24>>2]|0;if((P|0)==0){B=Ja;continue}M=La+16|0;F=c[M+4>>2]|0;C=La;c[C>>2]=c[M>>2];c[C+4>>2]=F;c[La+8>>2]=P;c[z>>2]=(c[z>>2]|0)+((Ka>>>14)+ -131071<<2);B=Ja}if((V|0)==213){V=0;B=c[l>>2]|0;z=B+18|0;a[z]=d[z]|4;u=B;continue}else if((V|0)==218){V=0;B=c[l>>2]|0;z=c[B+8>>2]|0;y=c[B>>2]|0;v=c[z>>2]|0;A=B+24|0;x=(c[A>>2]|0)+(d[(c[(c[y>>2]|0)+12>>2]|0)+76|0]<<4)|0;if((c[(c[w>>2]|0)+56>>2]|0)>0){Qf(b,c[z+24>>2]|0)}if(y>>>0<x>>>0){P=y;F=0;do{C=P;M=c[C+4>>2]|0;G=v+(F<<4)|0;c[G>>2]=c[C>>2];c[G+4>>2]=M;c[v+(F<<4)+8>>2]=c[y+(F<<4)+8>>2];F=F+1|0;P=y+(F<<4)|0}while(P>>>0<x>>>0)}x=y;c[z+24>>2]=v+((c[A>>2]|0)-x>>4<<4);P=v+((c[o>>2]|0)-x>>4<<4)|0;c[o>>2]=P;c[z+4>>2]=P;c[z+28>>2]=c[B+28>>2];P=z+18|0;a[P]=d[P]|64;c[l>>2]=z;u=z;continue}else if((V|0)==223){V=0;P=D>>>23;if((P|0)!=0){c[o>>2]=E+(P+ -1+W<<4)}if((c[(c[w>>2]|0)+56>>2]|0)>0){Qf(b,E)}P=zf(b,X)|0;if((a[u+18|0]&4)==0){V=228;break}x=c[l>>2]|0;if((P|0)==0){u=x;continue}c[o>>2]=c[x+4>>2];u=x;continue}}if((V|0)==23){if(!I){Ta=c[K>>2]|0;Ua=Ta+ -4|0;c[K>>2]=Ua;Va=a[J]|0;Wa=Va&255;Xa=Wa|128;Ya=Xa&255;a[J]=Ya;Za=c[o>>2]|0;_a=Za+ -16|0;c[H>>2]=_a;sf(b,1)}c[q>>2]=1;Ta=c[K>>2]|0;Ua=Ta+ -4|0;c[K>>2]=Ua;Va=a[J]|0;Wa=Va&255;Xa=Wa|128;Ya=Xa&255;a[J]=Ya;Za=c[o>>2]|0;_a=Za+ -16|0;c[H>>2]=_a;sf(b,1)}else if((V|0)==228){i=e;return}else if((V|0)==239){nf(b,8168,f)}else if((V|0)==244){nf(b,8208,f)}else if((V|0)==249){nf(b,8240,f)}}function _j(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;e=b;f=sc[c[a+8>>2]&3](c[a+16>>2]|0,c[a+12>>2]|0,e)|0;if((f|0)==0){g=-1;i=b;return g|0}h=c[e>>2]|0;if((h|0)==0){g=-1;i=b;return g|0}c[a>>2]=h+ -1;c[a+4>>2]=f+1;g=d[f]|0;i=b;return g|0}function $j(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;c[b+16>>2]=a;c[b+8>>2]=d;c[b+12>>2]=e;c[b>>2]=0;c[b+4>>2]=0;return}function ak(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+16|0;f=e;if((d|0)==0){g=0;i=e;return g|0}h=a+16|0;j=a+8|0;k=a+12|0;l=a+4|0;m=d;d=b;b=c[a>>2]|0;while(1){if((b|0)==0){n=sc[c[j>>2]&3](c[h>>2]|0,c[k>>2]|0,f)|0;if((n|0)==0){g=m;o=9;break}p=c[f>>2]|0;if((p|0)==0){g=m;o=9;break}c[a>>2]=p;c[l>>2]=n;q=p;r=n}else{q=b;r=c[l>>2]|0}n=m>>>0>q>>>0?q:m;an(d|0,r|0,n|0)|0;p=(c[a>>2]|0)-n|0;c[a>>2]=p;c[l>>2]=(c[l>>2]|0)+n;if((m|0)==(n|0)){g=0;o=9;break}else{m=m-n|0;d=d+n|0;b=p}}if((o|0)==9){i=e;return g|0}return 0}function bk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=b+8|0;g=c[f>>2]|0;if(!(g>>>0<d>>>0)){h=c[b>>2]|0;i=e;return h|0}j=d>>>0<32?32:d;if((j+1|0)>>>0>4294967293){th(a)}d=uh(a,c[b>>2]|0,g,j)|0;c[b>>2]=d;c[f>>2]=j;h=d;i=e;return h|0}function ck(a){a=a|0;var b=0;b=i;Gd(a,0,2);Ve(a,8272,0);i=b;return 1}function dk(a){a=a|0;var b=0;b=i;qd(a,+(Ha(re(a,1,8320,0)|0)|0));i=b;return 1}function ek(a){a=a|0;var b=0;b=i;ud(a,Sa(re(a,1,8320,0)|0)|0)|0;i=b;return 1}function fk(a){a=a|0;var b=0;b=i;Fd(a,-1001e3,2);Fd(a,-1001e3,2);Ld(a,-2,8328);Ve(a,8336,0);td(a,8528,7)|0;Ld(a,-2,8536);i=b;return 1}function gk(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b;if((jd(a,1)|0)==0){c[d>>2]=re(a,2,9400,0)|0;e=he(a,9392,d)|0;i=b;return e|0}else{e=Uc(a)|0;i=b;return e|0}return 0}function hk(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[9344+((qe(a,1,9224,9160)|0)<<2)>>2]|0;e=Xd(a,d,Ae(a,2,0)|0)|0;if((d|0)==9|(d|0)==5){yd(a,e);f=1;i=b;return f|0}else if((d|0)==3){d=Xd(a,4,0)|0;qd(a,+(e|0)+ +(d|0)*.0009765625);rd(a,d);f=2;i=b;return f|0}else{rd(a,e);f=1;i=b;return f|0}return 0}function ik(a){a=a|0;var b=0,c=0;b=i;c=re(a,1,0,0)|0;Vc(a,1);if((Je(a,c,0)|0)==0){Rd(a,0,-1,0,165);c=(Uc(a)|0)+ -1|0;i=b;return c|0}else{Yd(a)|0}return 0}function jk(a){a=a|0;var b=0;b=Ae(a,2,1)|0;Vc(a,1);if(!((dd(a,1)|0)!=0&(b|0)>0)){Yd(a)|0}je(a,b);_c(a,1);_d(a,2);Yd(a)|0;return 0}function kk(a){a=a|0;var b=0;b=i;ve(a,1);if((Hd(a,1)|0)==0){pd(a);i=b;return 1}else{Oe(a,1,8888)|0;i=b;return 1}return 0}function lk(a){a=a|0;var b=0;b=i;Ek(a,9144,1,166);i=b;return 3}function mk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;c=re(a,1,0,0)|0;d=re(a,2,0,0)|0;e=($c(a,3)|0)!=-1;f=e?3:0;if((Je(a,c,d)|0)==0){if(e?(_c(a,f),(ce(a,-2,1)|0)==0):0){Vc(a,-2);g=1}else{g=1}}else{pd(a);Xc(a,-2);g=2}i=b;return g|0}function nk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+16|0;d=b;e=kd(a,1,d)|0;f=re(a,3,9056,0)|0;g=($c(a,4)|0)!=-1;if((e|0)==0){h=re(a,2,9064,0)|0;ue(a,1,6);Vc(a,5);j=Ud(a,3,0,h,f)|0}else{h=re(a,2,e,0)|0;j=Me(a,e,c[d>>2]|0,h,f)|0}if((j|0)!=0){pd(a);Xc(a,-2);k=2;i=b;return k|0}if(!g){k=1;i=b;return k|0}_c(a,g?4:0);if((ce(a,-2,1)|0)!=0){k=1;i=b;return k|0}Vc(a,-2);k=1;i=b;return k|0}function ok(a){a=a|0;var b=0,c=0;b=i;ue(a,1,5);Vc(a,2);if((Zd(a,1)|0)==0){pd(a);c=1}else{c=2}i=b;return c|0}function pk(a){a=a|0;var b=0;b=i;Ek(a,9048,0,95);i=b;return 3}function qk(a){a=a|0;var b=0,c=0;b=i;ve(a,1);pd(a);Xc(a,1);c=Dk(a,(Sd(a,(Uc(a)|0)+ -2|0,-1,0,0,167)|0)==0|0)|0;i=b;return c|0}function rk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+16|0;d=b;e=b+4|0;f=Uc(a)|0;Bd(a,8768);g=c[r>>2]|0;a:do{if((f|0)>=1){h=1;while(1){_c(a,-1);_c(a,h);Rd(a,1,1,0,0);j=kd(a,-1,e)|0;if((j|0)==0){break}if((h|0)>1){Pb(9,g|0)|0}mb(j|0,1,c[e>>2]|0,g|0)|0;Vc(a,-2);if((h|0)<(f|0)){h=h+1|0}else{break a}}k=he(a,9e3,d)|0;i=b;return k|0}}while(0);Pb(10,g|0)|0;_b(g|0)|0;k=0;i=b;return k|0}function sk(a){a=a|0;var b=0;b=i;ve(a,1);ve(a,2);yd(a,ed(a,1,2)|0);i=b;return 1}function tk(a){a=a|0;var b=0;b=i;if((($c(a,1)|0)&-2|0)!=4){ge(a,1,8968)|0}rd(a,ld(a,1)|0);i=b;return 1}function uk(a){a=a|0;var b=0;b=i;ue(a,1,5);ve(a,2);Vc(a,2);Ed(a,1);i=b;return 1}function vk(a){a=a|0;var b=0;b=i;ue(a,1,5);ve(a,2);ve(a,3);Vc(a,3);Md(a,1);i=b;return 1}function wk(b){b=b|0;var c=0,d=0,e=0,f=0,g=0;c=i;d=Uc(b)|0;if(($c(b,1)|0)==4?(a[kd(b,1,0)|0]|0)==35:0){rd(b,d+ -1|0);e=1;i=c;return e|0}f=ye(b,1)|0;if((f|0)<0){g=f+d|0}else{g=(f|0)>(d|0)?d:f}if((g|0)<=0){ge(b,1,8944)|0}e=d-g|0;i=c;return e|0}function xk(a){a=a|0;var b=0,c=0,d=0;b=i;i=i+16|0;c=$c(a,2)|0;ue(a,1,5);if(!((c|0)==0|(c|0)==5)){ge(a,2,8864)|0}if((Oe(a,1,8888)|0)==0){Vc(a,2);Od(a,1)|0;d=1;i=b;return d|0}else{d=he(a,8904,b)|0;i=b;return d|0}return 0}function yk(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0,t=0.0,u=0,v=0.0,w=0.0;e=i;i=i+16|0;f=e+4|0;g=e;do{if(($c(b,2)|0)>=1){h=se(b,1,g)|0;j=h+(c[g>>2]|0)|0;k=ye(b,2)|0;if(!((k+ -2|0)>>>0<35)){ge(b,2,8832)|0}l=Cm(h,8856)|0;m=h+l|0;n=a[m]|0;if(n<<24>>24==43){o=0;p=h+(l+1)|0}else if(n<<24>>24==45){o=1;p=h+(l+1)|0}else{o=0;p=m}if((oa(d[p]|0|0)|0)!=0){q=+(k|0);r=0.0;m=p;while(1){l=a[m]|0;h=l&255;if((h+ -48|0)>>>0<10){s=(l<<24>>24)+ -48|0}else{s=(hc(h|0)|0)+ -55|0}if((s|0)>=(k|0)){t=r;u=m;break}v=q*r+ +(s|0);h=m+1|0;if((oa(d[h]|0|0)|0)==0){t=v;u=h;break}else{r=v;m=h}}if((u+(Cm(u,8856)|0)|0)==(j|0)){if((o|0)==0){w=t}else{w=-t}qd(b,w);i=e;return 1}}}else{r=+gd(b,1,f);if((c[f>>2]|0)==0){ve(b,1);break}qd(b,r);i=e;return 1}}while(0);pd(b);i=e;return 1}function zk(a){a=a|0;var b=0;b=i;ve(a,1);Re(a,1,0)|0;i=b;return 1}function Ak(a){a=a|0;var b=0;b=i;ve(a,1);ud(a,ad(a,$c(a,1)|0)|0)|0;i=b;return 1}function Bk(a){a=a|0;var b=0,c=0,d=0;b=i;c=Uc(a)|0;if((c|0)<=1){ge(a,2,8800)|0}_c(a,1);Zc(a,2,1);Yc(a,2);d=Dk(a,(Sd(a,c+ -2|0,-1,1,0,167)|0)==0|0)|0;i=b;return d|0}function Ck(a){a=a|0;var b=0,c=0;b=i;c=Dk(a,(Qd(a,0)|0)==1|0)|0;i=b;return c|0}function Dk(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;if((Oc(a,1)|0)==0){Vc(a,0);yd(a,0);ud(a,8816)|0;d=2;i=c;return d|0}else{yd(a,b);Yc(a,1);d=Uc(a)|0;i=c;return d|0}return 0}function Ek(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=i;if((Oe(a,1,b)|0)!=0){_c(a,1);Rd(a,1,3,0,0);i=e;return}ue(a,1,5);xd(a,d,0);_c(a,1);if((c|0)==0){pd(a);i=e;return}else{rd(a,0);i=e;return}}function Fk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;b=i;i=i+16|0;te(a,2,9072);_c(a,1);Rd(a,0,1,0,0);if(($c(a,-1)|0)==0){Vc(a,-2);c[d>>2]=0;e=0;i=b;return e|0}if((dd(a,-1)|0)==0){he(a,9104,b)|0}Yc(a,5);e=kd(a,5,d)|0;i=b;return e|0}function Gk(a){a=a|0;var b=0,c=0,d=0;b=i;c=ye(a,2)|0;ue(a,1,5);d=c+1|0;rd(a,d);Fd(a,1,d);d=($c(a,-1)|0)==0;i=b;return(d?1:2)|0}function Hk(a){a=a|0;var b=0,c=0;b=i;c=(Uc(a)|0)+ -1|0;i=b;return c|0}function Ik(a){a=a|0;var b=0;b=i;Gd(a,0,12);Ve(a,9424,0);i=b;return 1}function Jk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=ze(a,1)|0;d=ye(a,2)|0;if((d|0)>-1&(c|0)<0){if((d|0)>31){e=-1}else{e=c>>>d|~(-1>>>d)}sd(a,e);i=b;return 1}e=0-d|0;if((d|0)>0){f=(d|0)>31?0:c>>>d}else{f=(e|0)>31?0:c<<e}sd(a,f);i=b;return 1}function Kk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;c=Uc(a)|0;if((c|0)<1){d=-1}else{e=1;f=-1;while(1){g=(ze(a,e)|0)&f;if((e|0)==(c|0)){d=g;break}else{e=e+1|0;f=g}}}sd(a,d);i=b;return 1}function Lk(a){a=a|0;var b=0;b=i;sd(a,~(ze(a,1)|0));i=b;return 1}function Mk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;c=Uc(a)|0;if((c|0)<1){d=0}else{e=1;f=0;while(1){g=ze(a,e)|0|f;if((e|0)==(c|0)){d=g;break}else{e=e+1|0;f=g}}}sd(a,d);i=b;return 1}function Nk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;c=Uc(a)|0;if((c|0)<1){d=0}else{e=1;f=0;while(1){g=(ze(a,e)|0)^f;if((e|0)==(c|0)){d=g;break}else{e=e+1|0;f=g}}}sd(a,d);i=b;return 1}function Ok(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=Uc(a)|0;if((c|0)<1){d=1}else{e=1;f=-1;while(1){f=(ze(a,e)|0)&f;if((e|0)==(c|0)){break}else{e=e+1|0}}d=(f|0)!=0}yd(a,d&1);i=b;return 1}function Pk(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;i=i+16|0;c=ze(a,1)|0;d=ye(a,2)|0;e=Ae(a,3,1)|0;if(!((d|0)>-1)){ge(a,2,9624)|0}if((e|0)<=0){ge(a,3,9656)|0}if((e+d|0)>32){he(a,9680,b)|0}sd(a,c>>>d&~(-2<<e+ -1));i=b;return 1}function Qk(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=ye(a,2)|0;d=ze(a,1)|0;e=c&31;sd(a,d>>>(32-e|0)|d<<e);i=b;return 1}function Rk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=ze(a,1)|0;d=ye(a,2)|0;if((d|0)<0){e=0-d|0;f=(e|0)>31?0:c>>>e;sd(a,f);i=b;return 1}else{f=(d|0)>31?0:c<<d;sd(a,f);i=b;return 1}return 0}function Sk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;c=ze(a,1)|0;d=ze(a,2)|0;e=ye(a,3)|0;f=Ae(a,4,1)|0;if(!((e|0)>-1)){ge(a,3,9624)|0}if((f|0)<=0){ge(a,4,9656)|0}if((f+e|0)>32){he(a,9680,b)|0}g=~(-2<<f+ -1);sd(a,c&~(g<<e)|(d&g)<<e);i=b;return 1}function Tk(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=0-(ye(a,2)|0)|0;d=ze(a,1)|0;e=c&31;sd(a,d>>>(32-e|0)|d<<e);i=b;return 1}function Uk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=ze(a,1)|0;d=ye(a,2)|0;e=0-d|0;if((d|0)>0){f=(d|0)>31?0:c>>>d;sd(a,f);i=b;return 1}else{f=(e|0)>31?0:c<<e;sd(a,f);i=b;return 1}return 0}function Vk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=d+b|0;g=f+ -1|0;h=c[a+20>>2]|0;do{if((h|0)>(c[a+24>>2]|0)?(j=(c[(c[a>>2]|0)+12>>2]|0)+(h+ -1<<2)|0,k=c[j>>2]|0,(k&63|0)==4):0){l=k>>>6&255;m=l+(k>>>23)|0;if(!((l|0)<=(b|0)?(m+1|0)>=(b|0):0)){n=5}if((n|0)==5?(l|0)<(b|0)|(l|0)>(f|0):0){break}o=(l|0)<(b|0)?l:b;c[j>>2]=((m|0)>(g|0)?m:g)-o<<23|o<<6&16320|k&8372287;i=e;return}}while(0);dl(a,b<<6|(d<<23)+ -8388608|4)|0;i=e;return}function Wk(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=i;g=dl(a,c<<6|b|d<<23|e<<14)|0;i=f;return g|0}function Xk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;d=a+28|0;e=c[d>>2]|0;c[d>>2]=-1;d=dl(a,2147450903)|0;if((e|0)==-1){f=d;i=b;return f|0}if((d|0)==-1){f=e;i=b;return f|0}g=c[(c[a>>2]|0)+12>>2]|0;h=d;while(1){j=g+(h<<2)|0;k=c[j>>2]|0;l=(k>>>14)+ -131071|0;if((l|0)==-1){break}m=h+1+l|0;if((m|0)==-1){break}else{h=m}}g=e+~h|0;if((((g|0)>-1?g:0-g|0)|0)>131071){hm(c[a+12>>2]|0,9808)}c[j>>2]=(g<<14)+2147467264|k&16383;f=d;i=b;return f|0}function Yk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=i;f=dl(a,c<<6|b|d<<14)|0;i=e;return f|0}function Zk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((d|0)==-1){i=e;return}f=c[b>>2]|0;if((f|0)==-1){c[b>>2]=d;i=e;return}b=c[(c[a>>2]|0)+12>>2]|0;g=f;while(1){h=b+(g<<2)|0;j=c[h>>2]|0;f=(j>>>14)+ -131071|0;if((f|0)==-1){break}k=g+1+f|0;if((k|0)==-1){break}else{g=k}}b=~g+d|0;if((((b|0)>-1?b:0-b|0)|0)>131071){hm(c[a+12>>2]|0,9808)}c[h>>2]=j&16383|(b<<14)+2147467264;i=e;return}function _k(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;dl(a,b<<6|(c<<23)+8388608|31)|0;i=d;return}function $k(a){a=a|0;var b=0;b=c[a+20>>2]|0;c[a+24>>2]=b;return b|0}function al(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;if((c[b+20>>2]|0)==(e|0)){c[b+24>>2]=e;g=b+28|0;if((d|0)==-1){i=f;return}h=c[g>>2]|0;if((h|0)==-1){c[g>>2]=d;i=f;return}g=c[(c[b>>2]|0)+12>>2]|0;j=h;while(1){k=g+(j<<2)|0;l=c[k>>2]|0;h=(l>>>14)+ -131071|0;if((h|0)==-1){break}m=j+1+h|0;if((m|0)==-1){break}else{j=m}}g=~j+d|0;if((((g|0)>-1?g:0-g|0)|0)>131071){hm(c[b+12>>2]|0,9808)}c[k>>2]=(g<<14)+2147467264|l&16383;i=f;return}if((d|0)==-1){i=f;return}l=c[(c[b>>2]|0)+12>>2]|0;g=d;while(1){d=l+(g<<2)|0;k=c[d>>2]|0;j=(k>>>14)+ -131071|0;if((j|0)==-1){n=-1}else{n=g+1+j|0}if((g|0)>0?(j=l+(g+ -1<<2)|0,m=c[j>>2]|0,(a[4712+(m&63)|0]|0)<0):0){o=j;p=m}else{o=d;p=k}if((p&63|0)==28){c[o>>2]=p&8372224|p>>>23<<6|27;m=~g+e|0;if((((m|0)>-1?m:0-m|0)|0)>131071){q=20;break}r=c[d>>2]&16383|(m<<14)+2147467264}else{m=~g+e|0;if((((m|0)>-1?m:0-m|0)|0)>131071){q=23;break}r=k&16383|(m<<14)+2147467264}c[d>>2]=r;if((n|0)==-1){q=26;break}else{g=n}}if((q|0)==20){hm(c[b+12>>2]|0,9808)}else if((q|0)==23){hm(c[b+12>>2]|0,9808)}else if((q|0)==26){i=f;return}}function bl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;c[a+24>>2]=c[a+20>>2];e=a+28|0;if((b|0)==-1){i=d;return}f=c[e>>2]|0;if((f|0)==-1){c[e>>2]=b;i=d;return}e=c[(c[a>>2]|0)+12>>2]|0;g=f;while(1){h=e+(g<<2)|0;j=c[h>>2]|0;f=(j>>>14)+ -131071|0;if((f|0)==-1){break}k=g+1+f|0;if((k|0)==-1){break}else{g=k}}e=~g+b|0;if((((e|0)>-1?e:0-e|0)|0)>131071){hm(c[a+12>>2]|0,9808)}c[h>>2]=(e<<14)+2147467264|j&16383;i=d;return}function cl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((b|0)==-1){i=e;return}f=c[(c[a>>2]|0)+12>>2]|0;a=(d<<6)+64&16320;d=b;while(1){g=f+(d<<2)|0;h=c[g>>2]|0;b=(h>>>14)+ -131071|0;if((b|0)==-1){break}j=d+1+b|0;c[g>>2]=h&-16321|a;if((j|0)==-1){k=6;break}else{d=j}}if((k|0)==6){i=e;return}c[g>>2]=h&-16321|a;i=e;return}function dl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;e=i;f=c[b>>2]|0;g=b+28|0;h=c[g>>2]|0;j=b+20|0;k=c[j>>2]|0;do{if(!((h|0)==-1)){l=c[f+12>>2]|0;m=h;while(1){n=l+(m<<2)|0;o=c[n>>2]|0;p=(o>>>14)+ -131071|0;if((p|0)==-1){q=-1}else{q=m+1+p|0}if((m|0)>0?(p=l+(m+ -1<<2)|0,r=c[p>>2]|0,(a[4712+(r&63)|0]|0)<0):0){s=p;t=r}else{s=n;t=o}if((t&63|0)==28){c[s>>2]=t&8372224|t>>>23<<6|27;r=k+~m|0;if((((r|0)>-1?r:0-r|0)|0)>131071){u=10;break}v=c[n>>2]&16383|(r<<14)+2147467264}else{r=k+~m|0;if((((r|0)>-1?r:0-r|0)|0)>131071){u=13;break}v=(r<<14)+2147467264|o&16383}c[n>>2]=v;if((q|0)==-1){u=16;break}else{m=q}}if((u|0)==10){hm(c[b+12>>2]|0,9808)}else if((u|0)==13){hm(c[b+12>>2]|0,9808)}else if((u|0)==16){w=c[j>>2]|0;break}}else{w=k}}while(0);c[g>>2]=-1;g=f+48|0;if((w|0)<(c[g>>2]|0)){x=f+12|0;y=w}else{w=f+12|0;c[w>>2]=sh(c[(c[b+12>>2]|0)+52>>2]|0,c[w>>2]|0,g,4,2147483645,9800)|0;x=w;y=c[j>>2]|0}c[(c[x>>2]|0)+(y<<2)>>2]=d;d=c[j>>2]|0;y=f+52|0;x=b+12|0;if((d|0)<(c[y>>2]|0)){z=f+20|0;A=d;B=c[x>>2]|0;C=B+8|0;D=c[C>>2]|0;E=c[z>>2]|0;F=E+(A<<2)|0;c[F>>2]=D;G=c[j>>2]|0;H=G+1|0;c[j>>2]=H;i=e;return G|0}else{d=f+20|0;c[d>>2]=sh(c[(c[x>>2]|0)+52>>2]|0,c[d>>2]|0,y,4,2147483645,9800)|0;z=d;A=c[j>>2]|0;B=c[x>>2]|0;C=B+8|0;D=c[C>>2]|0;E=c[z>>2]|0;F=E+(A<<2)|0;c[F>>2]=D;G=c[j>>2]|0;H=G+1|0;c[j>>2]=H;i=e;return G|0}return 0}function el(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;e=b<<6;if((c|0)<262144){f=dl(a,e|c<<14|1)|0;i=d;return f|0}else{b=dl(a,e|2)|0;dl(a,c<<6|39)|0;f=b;i=d;return f|0}return 0}function fl(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=(d[b+48|0]|0)+e|0;e=(c[b>>2]|0)+78|0;if((g|0)<=(d[e]|0|0)){i=f;return}if((g|0)>249){hm(c[b+12>>2]|0,9720)}a[e]=g;i=f;return}function gl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=b+48|0;h=a[g]|0;j=(h&255)+e|0;k=(c[b>>2]|0)+78|0;do{if((j|0)>(d[k]|0|0)){if((j|0)>249){hm(c[b+12>>2]|0,9720)}else{a[k]=j;l=a[g]|0;break}}else{l=h}}while(0);a[g]=(l&255)+e;i=f;return}function hl(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;i=i+16|0;f=e;c[f>>2]=b;c[f+8>>2]=d[b+4|0]|0|64;b=il(a,f,f)|0;i=e;return b|0}function il(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;g=f;j=c[(c[b+12>>2]|0)+52>>2]|0;k=mj(j,c[b+4>>2]|0,d)|0;d=c[b>>2]|0;l=k+8|0;if(((c[l>>2]|0)==3?(h[g>>3]=+h[k>>3]+6755399441055744.0,m=c[g>>2]|0,g=c[d+8>>2]|0,(c[g+(m<<4)+8>>2]|0)==(c[e+8>>2]|0)):0)?(Tj(0,g+(m<<4)|0,e)|0)!=0:0){n=m;i=f;return n|0}m=d+44|0;g=c[m>>2]|0;o=b+32|0;b=c[o>>2]|0;h[k>>3]=+(b|0);c[l>>2]=3;l=c[m>>2]|0;if((b|0)<(l|0)){p=l}else{l=d+8|0;c[l>>2]=sh(j,c[l>>2]|0,m,16,67108863,9784)|0;p=c[m>>2]|0}l=c[d+8>>2]|0;if((g|0)<(p|0)){p=g;do{g=p;p=p+1|0;c[l+(g<<4)+8>>2]=0}while((p|0)<(c[m>>2]|0))}m=e;p=c[m+4>>2]|0;g=l+(b<<4)|0;c[g>>2]=c[m>>2];c[g+4>>2]=p;p=e+8|0;c[l+(b<<4)+8>>2]=c[p>>2];c[o>>2]=(c[o>>2]|0)+1;if((c[p>>2]&64|0)==0){n=b;i=f;return n|0}p=c[e>>2]|0;if((a[p+5|0]&3)==0){n=b;i=f;return n|0}if((a[d+5|0]&4)==0){n=b;i=f;return n|0}Uf(j,d,p);n=b;i=f;return n|0}function jl(a,b){a=a|0;b=+b;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+32|0;f=e+16|0;g=e;h[f>>3]=b;j=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=b;c[g+8>>2]=3;if(b!=b|0.0!=0.0|b==0.0){k=j+8|0;l=c[k>>2]|0;c[k>>2]=l+16;m=Mi(j,f,8)|0;c[l>>2]=m;c[l+8>>2]=d[m+4|0]|0|64;m=il(a,(c[k>>2]|0)+ -16|0,g)|0;c[k>>2]=(c[k>>2]|0)+ -16;n=m;i=e;return n|0}else{n=il(a,g,g)|0;i=e;return n|0}return 0}function kl(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;h=c[e>>2]|0;if((h|0)==12){j=(c[(c[b>>2]|0)+12>>2]|0)+(c[e+8>>2]<<2)|0;c[j>>2]=c[j>>2]&-8372225|(f<<14)+16384&8372224;i=g;return}else if((h|0)==13){h=e+8|0;e=c[b>>2]|0;j=c[e+12>>2]|0;k=j+(c[h>>2]<<2)|0;c[k>>2]=c[k>>2]&8388607|(f<<23)+8388608;f=j+(c[h>>2]<<2)|0;h=b+48|0;c[f>>2]=(d[h]|0)<<6|c[f>>2]&-16321;f=a[h]|0;j=(f&255)+1|0;k=e+78|0;do{if(j>>>0>(d[k]|0)>>>0){if(j>>>0>249){hm(c[b+12>>2]|0,9720)}else{a[k]=j;l=a[h]|0;break}}else{l=f}}while(0);a[h]=(l&255)+1;i=g;return}else{i=g;return}}function ll(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=c[b>>2]|0;if((e|0)==12){c[b>>2]=6;f=b+8|0;c[f>>2]=(c[(c[(c[a>>2]|0)+12>>2]|0)+(c[f>>2]<<2)>>2]|0)>>>6&255;i=d;return}else if((e|0)==13){e=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[e>>2]=c[e>>2]&8388607|16777216;c[b>>2]=11;i=d;return}else{i=d;return}}function ml(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;switch(c[f>>2]|0){case 7:{c[f>>2]=6;i=g;return};case 8:{h=f+8|0;c[h>>2]=dl(e,c[h>>2]<<23|5)|0;c[f>>2]=11;i=g;return};case 13:{h=(c[(c[e>>2]|0)+12>>2]|0)+(c[f+8>>2]<<2)|0;c[h>>2]=c[h>>2]&8388607|16777216;c[f>>2]=11;i=g;return};case 9:{h=f+8|0;j=b[h>>1]|0;if((j&256|0)==0?(d[e+46|0]|0)<=(j|0):0){j=e+48|0;a[j]=(a[j]|0)+ -1<<24>>24}j=h+2|0;if((a[h+3|0]|0)==7){if((d[e+46|0]|0)>(d[j]|0)){k=7}else{l=e+48|0;a[l]=(a[l]|0)+ -1<<24>>24;k=7}}else{k=6}c[h>>2]=dl(e,d[j]<<23|k|b[h>>1]<<14)|0;c[f>>2]=11;i=g;return};case 12:{c[f>>2]=6;h=f+8|0;c[h>>2]=(c[(c[(c[e>>2]|0)+12>>2]|0)+(c[h>>2]<<2)>>2]|0)>>>6&255;i=g;return};default:{i=g;return}}}function nl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;ml(b,e);if(((c[e>>2]|0)==6?(g=c[e+8>>2]|0,(g&256|0)==0):0)?(d[b+46|0]|0|0)<=(g|0):0){g=b+48|0;a[g]=(a[g]|0)+ -1<<24>>24}g=b+48|0;h=a[g]|0;j=(h&255)+1|0;k=(c[b>>2]|0)+78|0;if(!(j>>>0>(d[k]|0)>>>0)){l=h;m=l&255;n=m+1|0;o=n&255;a[g]=o;p=n&255;q=p+ -1|0;ol(b,e,q);i=f;return}if(j>>>0>249){hm(c[b+12>>2]|0,9720)}a[k]=j;l=a[g]|0;m=l&255;n=m+1|0;o=n&255;a[g]=o;p=n&255;q=p+ -1|0;ol(b,e,q);i=f;return}function ol(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;f=i;Fl(b,d,e);g=d+16|0;do{if((c[d>>2]|0)==10?(h=c[d+8>>2]|0,!((h|0)==-1)):0){j=c[g>>2]|0;if((j|0)==-1){c[g>>2]=h;break}k=c[(c[b>>2]|0)+12>>2]|0;l=j;while(1){m=k+(l<<2)|0;n=c[m>>2]|0;j=(n>>>14)+ -131071|0;if((j|0)==-1){break}o=l+1+j|0;if((o|0)==-1){break}else{l=o}}k=h+~l|0;if((((k|0)>-1?k:0-k|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[m>>2]=(k<<14)+2147467264|n&16383;break}}}while(0);n=c[g>>2]|0;m=d+20|0;k=c[m>>2]|0;if((n|0)==(k|0)){c[g>>2]=-1;c[m>>2]=-1;p=d+8|0;c[p>>2]=e;c[d>>2]=6;i=f;return}a:do{if((n|0)==-1){q=20}else{o=c[(c[b>>2]|0)+12>>2]|0;j=n;while(1){r=o+(j<<2)|0;if((j|0)>0?(s=c[o+(j+ -1<<2)>>2]|0,(a[4712+(s&63)|0]|0)<0):0){t=s}else{t=c[r>>2]|0}if((t&63|0)!=28){q=28;break a}s=((c[r>>2]|0)>>>14)+ -131071|0;if((s|0)==-1){q=20;break a}r=j+1+s|0;if((r|0)==-1){q=20;break}else{j=r}}}}while(0);b:do{if((q|0)==20){if((k|0)==-1){u=-1;v=-1}else{t=c[(c[b>>2]|0)+12>>2]|0;n=k;while(1){j=t+(n<<2)|0;if((n|0)>0?(o=c[t+(n+ -1<<2)>>2]|0,(a[4712+(o&63)|0]|0)<0):0){w=o}else{w=c[j>>2]|0}if((w&63|0)!=28){q=28;break b}o=((c[j>>2]|0)>>>14)+ -131071|0;if((o|0)==-1){u=-1;v=-1;break b}j=n+1+o|0;if((j|0)==-1){u=-1;v=-1;break}else{n=j}}}}}while(0);do{if((q|0)==28){w=b+28|0;do{if((c[d>>2]|0)!=10){k=c[w>>2]|0;c[w>>2]=-1;n=dl(b,2147450903)|0;if(!((k|0)==-1)){if(!((n|0)==-1)){t=c[(c[b>>2]|0)+12>>2]|0;j=n;while(1){x=t+(j<<2)|0;y=c[x>>2]|0;o=(y>>>14)+ -131071|0;if((o|0)==-1){break}l=j+1+o|0;if((l|0)==-1){break}else{j=l}}t=k+~j|0;if((((t|0)>-1?t:0-t|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[x>>2]=(t<<14)+2147467264|y&16383;z=n;break}}else{z=k}}else{z=n}}else{z=-1}}while(0);t=b+20|0;l=b+24|0;c[l>>2]=c[t>>2];o=e<<6;h=dl(b,o|16387)|0;c[l>>2]=c[t>>2];r=dl(b,o|8388611)|0;c[l>>2]=c[t>>2];if(!((z|0)==-1)){t=c[w>>2]|0;if((t|0)==-1){c[w>>2]=z;u=h;v=r;break}l=c[(c[b>>2]|0)+12>>2]|0;o=t;while(1){A=l+(o<<2)|0;B=c[A>>2]|0;t=(B>>>14)+ -131071|0;if((t|0)==-1){break}s=o+1+t|0;if((s|0)==-1){break}else{o=s}}l=z+~o|0;if((((l|0)>-1?l:0-l|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[A>>2]=(l<<14)+2147467264|B&16383;u=h;v=r;break}}else{u=h;v=r}}}while(0);B=c[b+20>>2]|0;c[b+24>>2]=B;A=c[m>>2]|0;c:do{if(!((A|0)==-1)){z=(e|0)==255;y=e<<6&16320;x=c[(c[b>>2]|0)+12>>2]|0;l=A;while(1){w=x+(l<<2)|0;s=c[w>>2]|0;t=(s>>>14)+ -131071|0;if((t|0)==-1){C=-1}else{C=l+1+t|0}if((l|0)>0?(t=x+(l+ -1<<2)|0,D=c[t>>2]|0,(a[4712+(D&63)|0]|0)<0):0){E=t;F=D}else{E=w;F=s}if((F&63|0)==28){D=F>>>23;if(z|(D|0)==(e|0)){G=F&8372224|D<<6|27}else{G=F&-16321|y}c[E>>2]=G;D=B+~l|0;if((((D|0)>-1?D:0-D|0)|0)>131071){q=58;break}H=c[w>>2]&16383|(D<<14)+2147467264}else{D=u+~l|0;if((((D|0)>-1?D:0-D|0)|0)>131071){q=61;break}H=s&16383|(D<<14)+2147467264}c[w>>2]=H;if((C|0)==-1){break c}else{l=C}}if((q|0)==58){hm(c[b+12>>2]|0,9808)}else if((q|0)==61){hm(c[b+12>>2]|0,9808)}}}while(0);C=c[g>>2]|0;if((C|0)==-1){c[g>>2]=-1;c[m>>2]=-1;p=d+8|0;c[p>>2]=e;c[d>>2]=6;i=f;return}H=e<<6;u=H&16320;G=c[(c[b>>2]|0)+12>>2]|0;if((e|0)==255){E=C;while(1){F=G+(E<<2)|0;A=c[F>>2]|0;l=(A>>>14)+ -131071|0;if((l|0)==-1){I=-1}else{I=E+1+l|0}if((E|0)>0?(l=G+(E+ -1<<2)|0,y=c[l>>2]|0,(a[4712+(y&63)|0]|0)<0):0){J=l;K=y}else{J=F;K=A}if((K&63|0)==28){c[J>>2]=K&8372224|K>>>23<<6|27;y=B+~E|0;if((((y|0)>-1?y:0-y|0)|0)>131071){q=87;break}L=c[F>>2]&16383|(y<<14)+2147467264}else{y=v+~E|0;if((((y|0)>-1?y:0-y|0)|0)>131071){q=90;break}L=A&16383|(y<<14)+2147467264}c[F>>2]=L;if((I|0)==-1){q=93;break}else{E=I}}if((q|0)==87){M=b+12|0;N=c[M>>2]|0;hm(N,9808)}else if((q|0)==90){O=b+12|0;P=c[O>>2]|0;hm(P,9808)}else if((q|0)==93){c[g>>2]=-1;c[m>>2]=-1;p=d+8|0;c[p>>2]=e;c[d>>2]=6;i=f;return}}else{Q=C}while(1){C=G+(Q<<2)|0;I=c[C>>2]|0;E=(I>>>14)+ -131071|0;if((E|0)==-1){R=-1}else{R=Q+1+E|0}if((Q|0)>0?(E=G+(Q+ -1<<2)|0,L=c[E>>2]|0,(a[4712+(L&63)|0]|0)<0):0){S=E;T=L}else{S=C;T=I}if((T&63|0)==28){if((T>>>23|0)==(e|0)){U=T&8372224|H|27}else{U=T&-16321|u}c[S>>2]=U;L=B+~Q|0;if((((L|0)>-1?L:0-L|0)|0)>131071){q=87;break}V=c[C>>2]&16383|(L<<14)+2147467264}else{L=v+~Q|0;if((((L|0)>-1?L:0-L|0)|0)>131071){q=90;break}V=I&16383|(L<<14)+2147467264}c[C>>2]=V;if((R|0)==-1){q=93;break}else{Q=R}}if((q|0)==87){M=b+12|0;N=c[M>>2]|0;hm(N,9808)}else if((q|0)==90){O=b+12|0;P=c[O>>2]|0;hm(P,9808)}else if((q|0)==93){c[g>>2]=-1;c[m>>2]=-1;p=d+8|0;c[p>>2]=e;c[d>>2]=6;i=f;return}}function pl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0;e=i;ml(a,b);if((c[b>>2]|0)==6){f=b+8|0;g=c[f>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){h=g;i=e;return h|0}if((g|0)<(d[a+46|0]|0|0)){j=f}else{ol(a,b,g);h=c[f>>2]|0;i=e;return h|0}}else{j=b+8|0}nl(a,b);h=c[j>>2]|0;i=e;return h|0}function ql(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;if((c[b>>2]|0)==8?(c[b+16>>2]|0)==(c[b+20>>2]|0):0){i=e;return}ml(a,b);if((c[b>>2]|0)==6){f=c[b+8>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){i=e;return}if((f|0)>=(d[a+46|0]|0|0)){ol(a,b,f);i=e;return}}nl(a,b);i=e;return}function rl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=i;f=b+16|0;g=b+20|0;if((c[f>>2]|0)==(c[g>>2]|0)){ml(a,b);i=e;return}ml(a,b);if((c[b>>2]|0)==6){h=c[b+8>>2]|0;if((c[f>>2]|0)==(c[g>>2]|0)){i=e;return}if((h|0)>=(d[a+46|0]|0|0)){ol(a,b,h);i=e;return}}nl(a,b);i=e;return}function sl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e+16|0;g=e;j=b+16|0;k=b+20|0;l=(c[j>>2]|0)==(c[k>>2]|0);ml(a,b);do{if(!l){if((c[b>>2]|0)==6){m=c[b+8>>2]|0;if((c[j>>2]|0)==(c[k>>2]|0)){break}if((m|0)>=(d[a+46|0]|0|0)){ol(a,b,m);break}}nl(a,b)}}while(0);l=c[b>>2]|0;switch(l|0){case 4:{n=c[b+8>>2]|0;o=18;break};case 1:case 3:case 2:{if((c[a+32>>2]|0)<256){if((l|0)==1){c[g+8>>2]=0;c[f>>2]=c[a+4>>2];c[f+8>>2]=69;p=il(a,f,g)|0}else{c[f>>2]=(l|0)==2;c[f+8>>2]=1;p=il(a,f,f)|0}c[b+8>>2]=p;c[b>>2]=4;q=p|256;i=e;return q|0}break};case 5:{p=b+8|0;r=+h[p>>3];h[f>>3]=r;l=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=r;c[g+8>>2]=3;if(r!=r|0.0!=0.0|r==0.0){m=l+8|0;s=c[m>>2]|0;c[m>>2]=s+16;t=Mi(l,f,8)|0;c[s>>2]=t;c[s+8>>2]=d[t+4|0]|0|64;t=il(a,(c[m>>2]|0)+ -16|0,g)|0;c[m>>2]=(c[m>>2]|0)+ -16;u=t}else{u=il(a,g,g)|0}c[p>>2]=u;c[b>>2]=4;n=u;o=18;break};default:{}}if((o|0)==18?(n|0)<256:0){q=n|256;i=e;return q|0}ml(a,b);if((c[b>>2]|0)==6){n=b+8|0;o=c[n>>2]|0;if((c[j>>2]|0)==(c[k>>2]|0)){q=o;i=e;return q|0}if((o|0)<(d[a+46|0]|0|0)){v=n}else{ol(a,b,o);q=c[n>>2]|0;i=e;return q|0}}else{v=b+8|0}nl(a,b);q=c[v>>2]|0;i=e;return q|0}function tl(b,f,g){b=b|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;j=c[f>>2]|0;if((j|0)==8){ml(b,g);if((c[g>>2]|0)==6){k=g+8|0;l=c[k>>2]|0;if((c[g+16>>2]|0)!=(c[g+20>>2]|0)){if((l|0)<(d[b+46|0]|0)){m=k;n=12}else{ol(b,g,l);o=c[k>>2]|0}}else{o=l}}else{m=g+8|0;n=12}if((n|0)==12){nl(b,g);o=c[m>>2]|0}dl(b,o<<6|c[f+8>>2]<<23|9)|0}else if((j|0)==7){if(((c[g>>2]|0)==6?(o=c[g+8>>2]|0,(o&256|0)==0):0)?(d[b+46|0]|0)<=(o|0):0){o=b+48|0;a[o]=(a[o]|0)+ -1<<24>>24}ol(b,g,c[f+8>>2]|0);i=h;return}else if((j|0)==9){j=f+8|0;f=(a[j+3|0]|0)==7?10:8;o=sl(b,g)|0;dl(b,o<<14|f|d[j+2|0]<<6|e[j>>1]<<23)|0}if((c[g>>2]|0)!=6){i=h;return}j=c[g+8>>2]|0;if((j&256|0)!=0){i=h;return}if((d[b+46|0]|0)>(j|0)){i=h;return}j=b+48|0;a[j]=(a[j]|0)+ -1<<24>>24;i=h;return}function ul(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;ml(b,e);if((c[e>>2]|0)==6){h=e+8|0;j=c[h>>2]|0;if((c[e+16>>2]|0)!=(c[e+20>>2]|0)){if((j|0)<(d[b+46|0]|0|0)){k=h;l=6}else{ol(b,e,j);m=h}}else{m=h}}else{k=e+8|0;l=6}if((l|0)==6){nl(b,e);m=k}k=c[m>>2]|0;if(((c[e>>2]|0)==6?(k&256|0)==0:0)?(d[b+46|0]|0|0)<=(k|0):0){l=b+48|0;a[l]=(a[l]|0)+ -1<<24>>24}l=b+48|0;c[m>>2]=d[l]|0;c[e>>2]=6;e=a[l]|0;h=(e&255)+2|0;j=(c[b>>2]|0)+78|0;do{if(h>>>0>(d[j]|0)>>>0){if(h>>>0>249){hm(c[b+12>>2]|0,9720)}else{a[j]=h;n=a[l]|0;break}}else{n=e}}while(0);a[l]=(n&255)+2;n=c[m>>2]|0;dl(b,k<<23|n<<6|(sl(b,f)|0)<<14|12)|0;if((c[f>>2]|0)!=6){i=g;return}n=c[f+8>>2]|0;if((n&256|0)!=0){i=g;return}if((d[b+46|0]|0|0)>(n|0)){i=g;return}a[l]=(a[l]|0)+ -1<<24>>24;i=g;return}function vl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;ml(b,e);g=c[e>>2]|0;do{if((g|0)==10){h=c[(c[b>>2]|0)+12>>2]|0;j=e+8|0;k=c[j>>2]|0;l=h+(k<<2)|0;if((k|0)>0?(m=h+(k+ -1<<2)|0,k=c[m>>2]|0,(a[4712+(k&63)|0]|0)<0):0){n=m;o=k}else{n=l;o=c[l>>2]|0}c[n>>2]=((o&16320|0)==0)<<6|o&-16321;p=c[j>>2]|0;q=18}else if(!((g|0)==2|(g|0)==5|(g|0)==4)){j=e+8|0;if((g|0)==11){l=c[(c[(c[b>>2]|0)+12>>2]|0)+(c[j>>2]<<2)>>2]|0;if((l&63|0)==20){k=b+20|0;c[k>>2]=(c[k>>2]|0)+ -1;p=El(b,27,l>>>23,0,1)|0;q=18;break}else{q=9}}else if((g|0)==6){q=14}else{q=9}if((q|0)==9){l=b+48|0;k=a[l]|0;m=(k&255)+1|0;h=(c[b>>2]|0)+78|0;do{if(m>>>0>(d[h]|0)>>>0){if(m>>>0>249){hm(c[b+12>>2]|0,9720)}else{a[h]=m;r=a[l]|0;break}}else{r=k}}while(0);k=(r&255)+1|0;a[l]=k;Fl(b,e,(k&255)+ -1|0);if((c[e>>2]|0)==6){q=14}}if(((q|0)==14?(k=c[j>>2]|0,(k&256|0)==0):0)?(d[b+46|0]|0)<=(k|0):0){k=b+48|0;a[k]=(a[k]|0)+ -1<<24>>24}p=El(b,28,255,c[j>>2]|0,0)|0;q=18}}while(0);do{if((q|0)==18?(r=e+20|0,!((p|0)==-1)):0){g=c[r>>2]|0;if((g|0)==-1){c[r>>2]=p;break}r=c[(c[b>>2]|0)+12>>2]|0;o=g;while(1){s=r+(o<<2)|0;t=c[s>>2]|0;g=(t>>>14)+ -131071|0;if((g|0)==-1){break}n=o+1+g|0;if((n|0)==-1){break}else{o=n}}r=p+~o|0;if((((r|0)>-1?r:0-r|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[s>>2]=(r<<14)+2147467264|t&16383;break}}}while(0);t=e+16|0;e=c[t>>2]|0;c[b+24>>2]=c[b+20>>2];s=b+28|0;if((e|0)==-1){c[t>>2]=-1;i=f;return}p=c[s>>2]|0;if((p|0)==-1){c[s>>2]=e;c[t>>2]=-1;i=f;return}s=c[(c[b>>2]|0)+12>>2]|0;q=p;while(1){u=s+(q<<2)|0;v=c[u>>2]|0;p=(v>>>14)+ -131071|0;if((p|0)==-1){break}r=q+1+p|0;if((r|0)==-1){break}else{q=r}}s=e+~q|0;if((((s|0)>-1?s:0-s|0)|0)>131071){hm(c[b+12>>2]|0,9808)}c[u>>2]=(s<<14)+2147467264|v&16383;c[t>>2]=-1;i=f;return}function wl(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;ml(b,e);g=c[e>>2]|0;do{if((g|0)==10){h=c[e+8>>2]|0;j=15}else if(!((g|0)==3|(g|0)==1)){k=e+8|0;if((g|0)==11){l=c[(c[(c[b>>2]|0)+12>>2]|0)+(c[k>>2]<<2)>>2]|0;if((l&63|0)==20){m=b+20|0;c[m>>2]=(c[m>>2]|0)+ -1;h=El(b,27,l>>>23,0,0)|0;j=15;break}else{j=6}}else if((g|0)==6){j=11}else{j=6}if((j|0)==6){l=b+48|0;m=a[l]|0;n=(m&255)+1|0;o=(c[b>>2]|0)+78|0;do{if(n>>>0>(d[o]|0)>>>0){if(n>>>0>249){hm(c[b+12>>2]|0,9720)}else{a[o]=n;p=a[l]|0;break}}else{p=m}}while(0);m=(p&255)+1|0;a[l]=m;Fl(b,e,(m&255)+ -1|0);if((c[e>>2]|0)==6){j=11}}if(((j|0)==11?(m=c[k>>2]|0,(m&256|0)==0):0)?(d[b+46|0]|0|0)<=(m|0):0){m=b+48|0;a[m]=(a[m]|0)+ -1<<24>>24}h=El(b,28,255,c[k>>2]|0,1)|0;j=15}}while(0);do{if((j|0)==15?(p=e+16|0,!((h|0)==-1)):0){g=c[p>>2]|0;if((g|0)==-1){c[p>>2]=h;break}p=c[(c[b>>2]|0)+12>>2]|0;m=g;while(1){q=p+(m<<2)|0;r=c[q>>2]|0;g=(r>>>14)+ -131071|0;if((g|0)==-1){break}n=m+1+g|0;if((n|0)==-1){break}else{m=n}}p=h+~m|0;if((((p|0)>-1?p:0-p|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[q>>2]=(p<<14)+2147467264|r&16383;break}}}while(0);r=e+20|0;e=c[r>>2]|0;c[b+24>>2]=c[b+20>>2];q=b+28|0;if((e|0)==-1){c[r>>2]=-1;i=f;return}h=c[q>>2]|0;if((h|0)==-1){c[q>>2]=e;c[r>>2]=-1;i=f;return}q=c[(c[b>>2]|0)+12>>2]|0;j=h;while(1){s=q+(j<<2)|0;t=c[s>>2]|0;h=(t>>>14)+ -131071|0;if((h|0)==-1){break}p=j+1+h|0;if((p|0)==-1){break}else{j=p}}q=e+~j|0;if((((q|0)>-1?q:0-q|0)|0)>131071){hm(c[b+12>>2]|0,9808)}c[s>>2]=(q<<14)+2147467264|t&16383;c[r>>2]=-1;i=f;return}function xl(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;h=e+8|0;a[h+2|0]=c[h>>2];b[h>>1]=sl(d,f)|0;a[h+3|0]=(c[e>>2]|0)==8?8:7;c[e>>2]=9;i=g;return}



function yl(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+32|0;k=j;c[k+20>>2]=-1;c[k+16>>2]=-1;c[k>>2]=5;h[k+8>>3]=0.0;if((e|0)==1){ml(b,f);switch(c[f>>2]|0){case 11:{l=b+48|0;m=a[l]|0;n=(m&255)+1|0;o=(c[b>>2]|0)+78|0;do{if(n>>>0>(d[o]|0)>>>0){if(n>>>0>249){hm(c[b+12>>2]|0,9720)}else{a[o]=n;p=a[l]|0;break}}else{p=m}}while(0);m=(p&255)+1|0;a[l]=m;Fl(b,f,(m&255)+ -1|0);if((c[f>>2]|0)==6){q=25}else{r=f+8|0;q=28}break};case 3:case 1:{c[f>>2]=2;break};case 10:{m=c[(c[b>>2]|0)+12>>2]|0;l=c[f+8>>2]|0;p=m+(l<<2)|0;if((l|0)>0?(n=m+(l+ -1<<2)|0,l=c[n>>2]|0,(a[4712+(l&63)|0]|0)<0):0){s=n;t=l}else{s=p;t=c[p>>2]|0}c[s>>2]=((t&16320|0)==0)<<6|t&-16321;break};case 2:case 5:case 4:{c[f>>2]=3;break};case 6:{q=25;break};default:{}}if((q|0)==25){t=f+8|0;s=c[t>>2]|0;if((s&256|0)==0?(d[b+46|0]|0)<=(s|0):0){s=b+48|0;a[s]=(a[s]|0)+ -1<<24>>24;r=t;q=28}else{r=t;q=28}}if((q|0)==28){c[r>>2]=dl(b,c[r>>2]<<23|20)|0;c[f>>2]=11}r=f+20|0;t=c[r>>2]|0;s=f+16|0;p=c[s>>2]|0;c[r>>2]=p;c[s>>2]=t;if((p|0)==-1){u=t}else{t=c[(c[b>>2]|0)+12>>2]|0;r=p;do{p=t+(r<<2)|0;if((r|0)>0?(l=t+(r+ -1<<2)|0,n=c[l>>2]|0,(a[4712+(n&63)|0]|0)<0):0){v=l;w=n}else{v=p;w=c[p>>2]|0}if((w&63|0)==28){c[v>>2]=w&8372224|w>>>23<<6|27}n=((c[p>>2]|0)>>>14)+ -131071|0;if((n|0)==-1){break}r=r+1+n|0}while(!((r|0)==-1));u=c[s>>2]|0}if((u|0)==-1){i=j;return}s=c[(c[b>>2]|0)+12>>2]|0;r=u;while(1){u=s+(r<<2)|0;if((r|0)>0?(w=s+(r+ -1<<2)|0,v=c[w>>2]|0,(a[4712+(v&63)|0]|0)<0):0){x=w;y=v}else{x=u;y=c[u>>2]|0}if((y&63|0)==28){c[x>>2]=y&8372224|y>>>23<<6|27}v=((c[u>>2]|0)>>>14)+ -131071|0;if((v|0)==-1){q=54;break}u=r+1+v|0;if((u|0)==-1){q=54;break}else{r=u}}if((q|0)==54){i=j;return}}else if((e|0)==0){if(((c[f>>2]|0)==5?(c[f+16>>2]|0)==-1:0)?(c[f+20>>2]|0)==-1:0){r=f+8|0;h[r>>3]=-+h[r>>3];i=j;return}ml(b,f);if((c[f>>2]|0)==6){r=c[f+8>>2]|0;if((c[f+16>>2]|0)!=(c[f+20>>2]|0)){if((r|0)<(d[b+46|0]|0)){q=10}else{ol(b,f,r)}}}else{q=10}if((q|0)==10){nl(b,f)}zl(b,19,f,k,g);i=j;return}else if((e|0)==2){ml(b,f);if((c[f>>2]|0)==6){e=c[f+8>>2]|0;if((c[f+16>>2]|0)!=(c[f+20>>2]|0)){if((e|0)<(d[b+46|0]|0)){q=52}else{ol(b,f,e)}}}else{q=52}if((q|0)==52){nl(b,f)}zl(b,21,f,k,g);i=j;return}else{i=j;return}}function zl(b,e,f,g,j){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;var k=0,l=0.0,m=0,n=0,o=0;k=i;if(((((((c[f>>2]|0)==5?(c[f+16>>2]|0)==-1:0)?(c[f+20>>2]|0)==-1:0)?(c[g>>2]|0)==5:0)?(c[g+16>>2]|0)==-1:0)?(c[g+20>>2]|0)==-1:0)?(l=+h[g+8>>3],!((e&-2|0)==16&l==0.0)):0){m=f+8|0;h[m>>3]=+Nh(e+ -13|0,+h[m>>3],l);i=k;return}if((e|0)==19|(e|0)==21){n=0}else{n=sl(b,g)|0}m=sl(b,f)|0;if((m|0)>(n|0)){if(((c[f>>2]|0)==6?(o=c[f+8>>2]|0,(o&256|0)==0):0)?(d[b+46|0]|0|0)<=(o|0):0){o=b+48|0;a[o]=(a[o]|0)+ -1<<24>>24}if(((c[g>>2]|0)==6?(o=c[g+8>>2]|0,(o&256|0)==0):0)?(d[b+46|0]|0|0)<=(o|0):0){o=b+48|0;a[o]=(a[o]|0)+ -1<<24>>24}}else{if(((c[g>>2]|0)==6?(o=c[g+8>>2]|0,(o&256|0)==0):0)?(d[b+46|0]|0|0)<=(o|0):0){o=b+48|0;a[o]=(a[o]|0)+ -1<<24>>24}if(((c[f>>2]|0)==6?(o=c[f+8>>2]|0,(o&256|0)==0):0)?(d[b+46|0]|0|0)<=(o|0):0){o=b+48|0;a[o]=(a[o]|0)+ -1<<24>>24}}c[f+8>>2]=dl(b,n<<14|e|m<<23)|0;c[f>>2]=11;c[(c[(c[b>>2]|0)+20>>2]|0)+((c[b+20>>2]|0)+ -1<<2)>>2]=j;i=k;return}function Al(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;a:do{switch(b|0){case 14:{wl(a,d);break};case 6:{nl(a,d);break};case 13:{vl(a,d);break};case 5:case 4:case 3:case 2:case 1:case 0:{if(((c[d>>2]|0)==5?(c[d+16>>2]|0)==-1:0)?(c[d+20>>2]|0)==-1:0){break a}sl(a,d)|0;break};default:{sl(a,d)|0}}}while(0);i=e;return}function Bl(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=i;switch(e|0){case 13:{ml(b,g);k=g+20|0;l=c[f+20>>2]|0;do{if(!((l|0)==-1)){m=c[k>>2]|0;if((m|0)==-1){c[k>>2]=l;break}n=c[(c[b>>2]|0)+12>>2]|0;o=m;while(1){p=n+(o<<2)|0;q=c[p>>2]|0;m=(q>>>14)+ -131071|0;if((m|0)==-1){break}r=o+1+m|0;if((r|0)==-1){break}else{o=r}}n=l+~o|0;if((((n|0)>-1?n:0-n|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[p>>2]=(n<<14)+2147467264|q&16383;break}}}while(0);c[f+0>>2]=c[g+0>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];i=j;return};case 5:case 4:case 3:case 2:case 1:case 0:{zl(b,e+13|0,f,g,h);i=j;return};case 6:{q=g+16|0;p=g+20|0;l=(c[q>>2]|0)==(c[p>>2]|0);ml(b,g);do{if(!l){if((c[g>>2]|0)==6){k=c[g+8>>2]|0;if((c[q>>2]|0)==(c[p>>2]|0)){break}if((k|0)>=(d[b+46|0]|0|0)){ol(b,g,k);break}}nl(b,g)}}while(0);if((c[g>>2]|0)==11?(p=g+8|0,q=c[p>>2]|0,l=(c[b>>2]|0)+12|0,k=c[l>>2]|0,n=c[k+(q<<2)>>2]|0,(n&63|0)==22):0){r=f+8|0;if(((c[f>>2]|0)==6?(m=c[r>>2]|0,(m&256|0)==0):0)?(d[b+46|0]|0|0)<=(m|0):0){m=b+48|0;a[m]=(a[m]|0)+ -1<<24>>24;m=c[p>>2]|0;s=c[l>>2]|0;t=s;u=m;v=c[s+(m<<2)>>2]|0}else{t=k;u=q;v=n}c[t+(u<<2)>>2]=c[r>>2]<<23|v&8388607;c[f>>2]=11;c[r>>2]=c[p>>2];i=j;return}nl(b,g);zl(b,22,f,g,h);i=j;return};case 14:{ml(b,g);h=g+16|0;p=c[f+16>>2]|0;do{if(!((p|0)==-1)){r=c[h>>2]|0;if((r|0)==-1){c[h>>2]=p;break}v=c[(c[b>>2]|0)+12>>2]|0;u=r;while(1){w=v+(u<<2)|0;x=c[w>>2]|0;r=(x>>>14)+ -131071|0;if((r|0)==-1){break}t=u+1+r|0;if((t|0)==-1){break}else{u=t}}v=p+~u|0;if((((v|0)>-1?v:0-v|0)|0)>131071){hm(c[b+12>>2]|0,9808)}else{c[w>>2]=(v<<14)+2147467264|x&16383;break}}}while(0);c[f+0>>2]=c[g+0>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];i=j;return};case 9:case 8:case 7:{x=e+17|0;w=sl(b,f)|0;p=sl(b,g)|0;if(((c[g>>2]|0)==6?(h=c[g+8>>2]|0,(h&256|0)==0):0)?(d[b+46|0]|0|0)<=(h|0):0){h=b+48|0;a[h]=(a[h]|0)+ -1<<24>>24}h=f+8|0;if(((c[f>>2]|0)==6?(v=c[h>>2]|0,(v&256|0)==0):0)?(d[b+46|0]|0|0)<=(v|0):0){v=b+48|0;a[v]=(a[v]|0)+ -1<<24>>24}c[h>>2]=El(b,x,1,w,p)|0;c[f>>2]=10;i=j;return};case 12:case 11:case 10:{p=e+14|0;e=sl(b,f)|0;w=sl(b,g)|0;if(((c[g>>2]|0)==6?(x=c[g+8>>2]|0,(x&256|0)==0):0)?(d[b+46|0]|0|0)<=(x|0):0){x=b+48|0;a[x]=(a[x]|0)+ -1<<24>>24}x=f+8|0;if(((c[f>>2]|0)==6?(g=c[x>>2]|0,(g&256|0)==0):0)?(d[b+46|0]|0|0)<=(g|0):0){g=b+48|0;a[g]=(a[g]|0)+ -1<<24>>24}g=(p|0)==24;c[x>>2]=El(b,p,g&1^1,g?e:w,g?w:e)|0;c[f>>2]=10;i=j;return};default:{i=j;return}}}function Cl(a,b){a=a|0;b=b|0;c[(c[(c[a>>2]|0)+20>>2]|0)+((c[a+20>>2]|0)+ -1<<2)>>2]=b;return}function Dl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;h=((e+ -1|0)/50|0)+1|0;e=(f|0)==-1?0:f;if((h|0)<512){dl(b,d<<6|e<<23|h<<14|36)|0;j=d+1|0;k=j&255;l=b+48|0;a[l]=k;i=g;return}if((h|0)>=67108864){hm(c[b+12>>2]|0,9760)}dl(b,d<<6|e<<23|36)|0;dl(b,h<<6|39)|0;j=d+1|0;k=j&255;l=b+48|0;a[l]=k;i=g;return}function El(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;dl(a,d<<6|b|e<<23|f<<14)|0;f=a+28|0;e=c[f>>2]|0;c[f>>2]=-1;f=dl(a,2147450903)|0;if((e|0)==-1){h=f;i=g;return h|0}if((f|0)==-1){h=e;i=g;return h|0}b=c[(c[a>>2]|0)+12>>2]|0;d=f;while(1){j=b+(d<<2)|0;k=c[j>>2]|0;l=(k>>>14)+ -131071|0;if((l|0)==-1){break}m=d+1+l|0;if((m|0)==-1){break}else{d=m}}b=e+~d|0;if((((b|0)>-1?b:0-b|0)|0)>131071){hm(c[a+12>>2]|0,9808)}c[j>>2]=(b<<14)+2147467264|k&16383;h=f;i=g;return h|0}function Fl(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0;f=i;i=i+32|0;g=f+16|0;j=f;ml(a,b);k=c[b>>2]|0;a:do{switch(k|0){case 4:{l=c[b+8>>2]|0;m=e<<6;if((l|0)<262144){dl(a,m|l<<14|1)|0;break a}else{dl(a,m|2)|0;dl(a,l<<6|39)|0;break a}break};case 6:{l=c[b+8>>2]|0;if((l|0)!=(e|0)){dl(a,l<<23|e<<6)|0}break};case 1:{l=e+1|0;m=c[a+20>>2]|0;do{if((m|0)>(c[a+24>>2]|0)?(n=(c[(c[a>>2]|0)+12>>2]|0)+(m+ -1<<2)|0,o=c[n>>2]|0,(o&63|0)==4):0){p=o>>>6&255;q=p+(o>>>23)|0;if(!((p|0)<=(e|0)?(q+1|0)>=(e|0):0)){r=6}if((r|0)==6?(p|0)<(e|0)|(p|0)>(l|0):0){break}s=(p|0)<(e|0)?p:e;c[n>>2]=s<<6&16320|o&8372287|((q|0)>(e|0)?q:e)-s<<23;break a}}while(0);dl(a,e<<6|4)|0;break};case 5:{t=+h[b+8>>3];h[g>>3]=t;l=c[(c[a+12>>2]|0)+52>>2]|0;h[j>>3]=t;c[j+8>>2]=3;if(t!=t|0.0!=0.0|t==0.0){m=l+8|0;s=c[m>>2]|0;c[m>>2]=s+16;q=Mi(l,g,8)|0;c[s>>2]=q;c[s+8>>2]=d[q+4|0]|0|64;q=il(a,(c[m>>2]|0)+ -16|0,j)|0;c[m>>2]=(c[m>>2]|0)+ -16;u=q}else{u=il(a,j,j)|0}q=e<<6;if((u|0)<262144){dl(a,q|u<<14|1)|0;break a}else{dl(a,q|2)|0;dl(a,u<<6|39)|0;break a}break};case 2:case 3:{dl(a,e<<6|((k|0)==2)<<23|3)|0;break};case 11:{q=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[q>>2]=c[q>>2]&-16321|e<<6&16320;break};default:{i=f;return}}}while(0);c[b+8>>2]=e;c[b>>2]=6;i=f;return}function Gl(a){a=a|0;var b=0;b=i;Gd(a,0,6);Ve(a,9840,0);i=b;return 1}function Hl(a){a=a|0;var b=0,c=0;b=i;ue(a,1,6);c=Ci(a)|0;_c(a,1);Qc(a,c,1);i=b;return 1}function Il(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=nd(a,1)|0;if((c|0)==0){ge(a,1,10040)|0}d=Ol(a,c,(Uc(a)|0)+ -1|0)|0;if((d|0)<0){yd(a,0);Xc(a,-2);e=2;i=b;return e|0}else{yd(a,1);Xc(a,~d);e=d+1|0;i=b;return e|0}return 0}function Jl(a){a=a|0;var b=0;b=i;yd(a,Ad(a)|0);i=b;return 2}function Kl(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;i=i+112|0;c=b;d=nd(a,1)|0;if((d|0)==0){ge(a,1,10040)|0}do{if((d|0)!=(a|0)){e=Wd(d)|0;if((e|0)==1){td(a,10064,9)|0;break}else if((e|0)==0){if((ff(d,0,c)|0)>0){td(a,10080,6)|0;break}if((Uc(d)|0)!=0){td(a,10064,9)|0;break}else{td(a,10088,4)|0;break}}else{td(a,10088,4)|0;break}}else{td(a,9912,7)|0}}while(0);i=b;return 1}function Ll(a){a=a|0;var b=0,c=0;b=i;ue(a,1,6);c=Ci(a)|0;_c(a,1);Qc(a,c,1);xd(a,168,1);i=b;return 1}function Ml(a){a=a|0;var b=0,c=0;b=i;c=Ef(a,Uc(a)|0,0,0)|0;i=b;return c|0}function Nl(a){a=a|0;var b=0,c=0,d=0;b=i;c=nd(a,-1001001)|0;d=Ol(a,c,Uc(a)|0)|0;if((d|0)>=0){i=b;return d|0}if((dd(a,-1)|0)==0){Yd(a)|0}je(a,1);Xc(a,-2);_d(a,2);Yd(a)|0;return 0}function Ol(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;do{if((Oc(b,c)|0)!=0){if((Wd(b)|0)==0?(Uc(b)|0)==0:0){td(a,9976,28)|0;e=-1;break}Qc(a,b,c);if(!((Bf(b,a,c)|0)>>>0<2)){Qc(b,a,1);e=-1;break}f=Uc(b)|0;if((Oc(a,f+1|0)|0)==0){Vc(b,~f);td(a,10008,26)|0;e=-1;break}else{Qc(b,a,f);e=f;break}}else{td(a,9944,28)|0;e=-1}}while(0);i=d;return e|0}function Pl(a){a=a|0;var b=0;b=i;Gd(a,0,16);Ve(a,10360,0);i=b;return 1}function Ql(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+256|0;d=b;e=b+4|0;f=c[p>>2]|0;mb(11224,11,1,f|0)|0;_b(f|0)|0;g=c[q>>2]|0;if((dc(e|0,250,g|0)|0)==0){i=b;return 0}while(1){if((Tm(e,11240)|0)==0){h=7;break}if(!((Me(a,e,Zm(e|0)|0,11248,0)|0)==0?(Sd(a,0,0,0,0,0)|0)==0:0)){c[d>>2]=kd(a,-1,0)|0;ob(f|0,11272,d|0)|0;_b(f|0)|0}Vc(a,0);mb(11224,11,1,f|0)|0;_b(f|0)|0;if((dc(e|0,250,g|0)|0)==0){h=7;break}}if((h|0)==7){i=b;return 0}return 0}function Rl(a){a=a|0;var b=0;b=i;if(($c(a,1)|0)==7){Id(a,1)}else{pd(a)}i=b;return 1}function Sl(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;c=i;i=i+16|0;d=c;if(($c(b,1)|0)==8){e=nd(b,1)|0}else{e=b}f=df(e)|0;g=cf(e)|0;if((g|0)!=0&(g|0)!=8){td(b,11208,13)|0}else{We(b,-1001e3,10768)|0;Ad(e)|0;Qc(e,b,1);Ed(b,-2);Wc(b,-2)}if((f&1|0)==0){h=0}else{a[d]=99;h=1}if((f&2|0)==0){j=h}else{a[d+h|0]=114;j=h+1|0}if((f&4|0)==0){k=j}else{a[d+j|0]=108;k=j+1|0}a[d+k|0]=0;ud(b,d)|0;rd(b,ef(e)|0);i=c;return 3}function Tl(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+112|0;f=e;if(($c(b,1)|0)==8){g=nd(b,1)|0;h=1}else{g=b;h=0}j=h|2;k=re(b,j,10968,0)|0;l=h+1|0;do{if((cd(b,l)|0)!=0){if((ff(g,hd(b,l,0)|0,f)|0)==0){pd(b);m=1;i=e;return m|0}else{n=k}}else{if(($c(b,l)|0)==6){c[f>>2]=k;wd(b,10976,f)|0;h=kd(b,-1,0)|0;_c(b,l);Qc(b,g,1);n=h;break}m=ge(b,l,10984)|0;i=e;return m|0}}while(0);if((kf(g,n,f)|0)==0){m=ge(b,j,11016)|0;i=e;return m|0}Gd(b,0,2);if((xm(n,83)|0)!=0){ud(b,c[f+16>>2]|0)|0;Ld(b,-2,11032);ud(b,f+36|0)|0;Ld(b,-2,11040);rd(b,c[f+24>>2]|0);Ld(b,-2,11056);rd(b,c[f+28>>2]|0);Ld(b,-2,11072);ud(b,c[f+12>>2]|0)|0;Ld(b,-2,11088)}if((xm(n,108)|0)!=0){rd(b,c[f+20>>2]|0);Ld(b,-2,11096)}if((xm(n,117)|0)!=0){rd(b,d[f+32|0]|0);Ld(b,-2,11112);rd(b,d[f+33|0]|0);Ld(b,-2,11120);yd(b,a[f+34|0]|0);Ld(b,-2,11128)}if((xm(n,110)|0)!=0){ud(b,c[f+4>>2]|0)|0;Ld(b,-2,11144);ud(b,c[f+8>>2]|0)|0;Ld(b,-2,11152)}if((xm(n,116)|0)!=0){yd(b,a[f+35|0]|0);Ld(b,-2,11168)}if((xm(n,76)|0)!=0){if((g|0)==(b|0)){_c(b,-2);Wc(b,-3)}else{Qc(g,b,1)}Ld(b,-2,11184)}if((xm(n,102)|0)==0){m=1;i=e;return m|0}if((g|0)==(b|0)){_c(b,-2);Wc(b,-3)}else{Qc(g,b,1)}Ld(b,-2,11200);m=1;i=e;return m|0}function Ul(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+112|0;c=b;if(($c(a,1)|0)==8){d=nd(a,1)|0;e=1}else{d=a;e=0}f=ye(a,e|2)|0;g=e+1|0;if(($c(a,g)|0)==6){_c(a,g);ud(a,gf(a,0,f)|0)|0;h=1;i=b;return h|0}if((ff(d,ye(a,g)|0,c)|0)==0){h=ge(a,g,10744)|0;i=b;return h|0}g=gf(d,c,f)|0;if((g|0)==0){pd(a);h=1;i=b;return h|0}else{Qc(d,a,1);ud(a,g)|0;_c(a,-2);h=2;i=b;return h|0}return 0}function Vl(a){a=a|0;var b=0;b=i;_c(a,-1001e3);i=b;return 1}function Wl(a){a=a|0;var b=0;b=i;ve(a,1);if((Hd(a,1)|0)==0){pd(a)}i=b;return 1}function Xl(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=ye(a,2)|0;ue(a,1,6);d=be(a,1,c)|0;if((d|0)==0){e=0;i=b;return e|0}ud(a,d)|0;Xc(a,-2);e=2;i=b;return e|0}function Yl(a){a=a|0;var b=0,c=0,e=0,f=0;b=i;i=i+112|0;c=b;e=ye(a,2)|0;ue(a,1,6);_c(a,1);kf(a,10912,c)|0;if(!((e|0)>0?(e|0)<=(d[c+32|0]|0|0):0)){ge(a,2,10920)|0}f=ye(a,4)|0;ue(a,3,6);_c(a,3);kf(a,10912,c)|0;if(!((f|0)>0?(f|0)<=(d[c+32|0]|0|0):0)){ge(a,4,10920)|0}if((bd(a,1)|0)!=0){ge(a,1,10944)|0}if((bd(a,3)|0)==0){ee(a,1,e,3,f);i=b;return 0}ge(a,3,10944)|0;ee(a,1,e,3,f);i=b;return 0}function Zl(a){a=a|0;var b=0,c=0,e=0;b=i;i=i+112|0;c=b;e=ye(a,2)|0;ue(a,1,6);_c(a,1);kf(a,10912,c)|0;if(!((e|0)>0?(e|0)<=(d[c+32|0]|0|0):0)){ge(a,2,10920)|0}zd(a,de(a,1,e)|0);i=b;return 1}function _l(a){a=a|0;var b=0;b=i;if(($c(a,1)|0)==2){ge(a,1,10864)|0}ue(a,1,7);if(($c(a,2)|0)>=1){ue(a,2,5)}Vc(a,2);Pd(a,1);i=b;return 1}function $l(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;if(($c(a,1)|0)==8){c=nd(a,1)|0;d=1}else{c=a;d=0}e=d+1|0;if(($c(a,e)|0)<1){Vc(a,e);f=0;g=0;h=0}else{j=se(a,d|2,0)|0;ue(a,e,6);k=Ae(a,d+3|0,0)|0;d=(xm(j,99)|0)!=0|0;l=(xm(j,114)|0)==0;m=l?d:d|2;d=(xm(j,108)|0)==0;j=d?m:m|4;f=k;g=8;h=(k|0)>0?j|8:j}if((We(a,-1001e3,10768)|0)!=0){Ad(c)|0;Qc(c,a,1);_c(a,e);Md(a,-3);bf(c,g,h,f)|0;i=b;return 0}ud(a,10776)|0;Ld(a,-2,10784);_c(a,-1);Od(a,-2)|0;Ad(c)|0;Qc(c,a,1);_c(a,e);Md(a,-3);bf(c,g,h,f)|0;i=b;return 0}function am(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;i=i+112|0;c=b;if(($c(a,1)|0)==8){d=nd(a,1)|0;e=1}else{d=a;e=0}f=e+1|0;if((ff(d,ye(a,f)|0,c)|0)==0){g=ge(a,f,10744)|0;i=b;return g|0}else{f=e+3|0;ve(a,f);Vc(a,f);Qc(a,d,1);ud(a,jf(d,c,ye(a,e|2)|0)|0)|0;g=1;i=b;return g|0}return 0}function bm(a){a=a|0;var b=0,c=0;b=i;c=$c(a,2)|0;if(!((c|0)==0|(c|0)==5)){ge(a,2,10720)|0}Vc(a,2);Od(a,1)|0;i=b;return 1}function cm(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;ve(a,3);c=ye(a,2)|0;ue(a,1,6);d=ce(a,1,c)|0;if((d|0)==0){e=0;i=b;return e|0}ud(a,d)|0;Xc(a,-1);e=1;i=b;return e|0}function dm(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;if(($c(a,1)|0)==8){c=nd(a,1)|0;d=1}else{c=a;d=0}e=d+1|0;f=kd(a,e,0)|0;if((f|0)==0?($c(a,e)|0)>=1:0){_c(a,e);i=b;return 1}fe(a,c,f,Ae(a,d|2,(c|0)==(a|0)|0)|0);i=b;return 1}function em(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;We(a,-1001e3,10768)|0;Ad(a)|0;Ed(a,-2);if(($c(a,-1)|0)!=6){i=d;return}ud(a,c[10792+(c[b>>2]<<2)>>2]|0)|0;e=c[b+20>>2]|0;if((e|0)>-1){rd(a,e)}else{pd(a)}Rd(a,2,0,0,0);i=d;return}function fm(b){b=b|0;var e=0,f=0,g=0,h=0;e=i;f=0;do{g=Ni(b,c[11280+(f<<2)>>2]|0)|0;h=g+5|0;a[h]=d[h]|0|32;f=f+1|0;a[g+6|0]=f}while((f|0)!=22);i=e;return}function gm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+16|0;f=e;if((d|0)>=257){g=c[11280+(d+ -257<<2)>>2]|0;if((d|0)>=286){h=g;i=e;return h|0}j=c[b+52>>2]|0;c[f>>2]=g;h=Rh(j,11440,f)|0;i=e;return h|0}j=c[b+52>>2]|0;if((a[d+10097|0]&4)==0){c[f>>2]=d;h=Rh(j,11424,f)|0;i=e;return h|0}else{c[f>>2]=d;h=Rh(j,11416,f)|0;i=e;return h|0}return 0}function hm(a,b){a=a|0;b=b|0;im(a,b,c[a+16>>2]|0)}function im(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+80|0;g=f;h=f+12|0;Sh(h,(c[b+68>>2]|0)+16|0,60);f=b+52|0;j=c[f>>2]|0;k=c[b+4>>2]|0;c[g>>2]=h;c[g+4>>2]=k;c[g+8>>2]=d;d=Rh(j,11776,g)|0;if((e|0)==0){l=c[f>>2]|0;sf(l,3)}j=c[f>>2]|0;do{if(!((e+ -287|0)>>>0<3)){if((e|0)>=257){k=c[11280+(e+ -257<<2)>>2]|0;if((e|0)>=286){m=k;break}c[g>>2]=k;m=Rh(j,11440,g)|0;break}if((a[e+10097|0]&4)==0){c[g>>2]=e;m=Rh(j,11424,g)|0;break}else{c[g>>2]=e;m=Rh(j,11416,g)|0;break}}else{k=b+60|0;h=c[k>>2]|0;n=h+4|0;o=c[n>>2]|0;p=h+8|0;q=c[p>>2]|0;do{if((o+1|0)>>>0>q>>>0){if(q>>>0>2147483645){im(b,11552,0)}r=q<<1;if((r|0)==-2){th(j)}else{s=uh(j,c[h>>2]|0,q,r)|0;c[h>>2]=s;c[p>>2]=r;t=c[n>>2]|0;u=s;break}}else{t=o;u=c[h>>2]|0}}while(0);c[n>>2]=t+1;a[u+t|0]=0;h=c[f>>2]|0;c[g>>2]=c[c[k>>2]>>2];m=Rh(h,11440,g)|0}}while(0);c[g>>2]=d;c[g+4>>2]=m;Rh(j,11792,g)|0;l=c[f>>2]|0;sf(l,3)}function jm(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=c[a+52>>2]|0;h=Mi(g,b,e)|0;e=g+8|0;b=c[e>>2]|0;c[e>>2]=b+16;c[b>>2]=h;c[b+8>>2]=d[h+4|0]|0|64;b=mj(g,c[(c[a+48>>2]|0)+4>>2]|0,(c[e>>2]|0)+ -16|0)|0;a=b+8|0;if((c[a>>2]|0)==0?(c[b>>2]=1,c[a>>2]=1,(c[(c[g+12>>2]|0)+12>>2]|0)>0):0){gg(g)}c[e>>2]=(c[e>>2]|0)+ -16;i=f;return h|0}function km(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;a[e+76|0]=46;k=e+52|0;c[k>>2]=b;c[e>>2]=h;c[e+32>>2]=286;c[e+56>>2]=f;c[e+48>>2]=0;c[e+4>>2]=1;c[e+8>>2]=1;c[e+68>>2]=g;g=Ni(b,11448)|0;c[e+72>>2]=g;b=g+5|0;a[b]=d[b]|0|32;b=e+60|0;e=c[b>>2]|0;g=uh(c[k>>2]|0,c[e>>2]|0,c[e+8>>2]|0,32)|0;c[c[b>>2]>>2]=g;c[(c[b>>2]|0)+8>>2]=32;i=j;return}function lm(a){a=a|0;var b=0,d=0,e=0;b=i;c[a+8>>2]=c[a+4>>2];d=a+32|0;if((c[d>>2]|0)==286){c[a+16>>2]=mm(a,a+24|0)|0;i=b;return}else{e=a+16|0;c[e+0>>2]=c[d+0>>2];c[e+4>>2]=c[d+4>>2];c[e+8>>2]=c[d+8>>2];c[e+12>>2]=c[d+12>>2];c[d>>2]=286;i=b;return}}function mm(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0;f=i;i=i+16|0;g=f;h=b+60|0;c[(c[h>>2]|0)+4>>2]=0;j=b+56|0;a:while(1){k=c[b>>2]|0;b:while(1){switch(k|0){case 45:{break b;break};case 61:{l=29;break a;break};case 39:case 34:{l=69;break a;break};case 60:{l=37;break a;break};case 91:{l=25;break a;break};case 126:{l=53;break a;break};case 58:{l=61;break a;break};case 13:case 10:{l=4;break b;break};case 11:case 9:case 12:case 32:{break};case 62:{l=45;break a;break};case 46:{l=161;break a;break};case 57:case 56:case 55:case 54:case 53:case 52:case 51:case 50:case 49:case 48:{m=k;break a;break};case-1:{n=286;l=306;break a;break};default:{l=283;break a}}o=c[j>>2]|0;p=c[o>>2]|0;c[o>>2]=p+ -1;if((p|0)==0){q=_j(o)|0}else{p=o+4|0;o=c[p>>2]|0;c[p>>2]=o+1;q=d[o]|0}c[b>>2]=q;k=q}if((l|0)==4){l=0;om(b);continue}o=c[j>>2]|0;p=c[o>>2]|0;c[o>>2]=p+ -1;if((p|0)==0){r=_j(o)|0}else{p=o+4|0;o=c[p>>2]|0;c[p>>2]=o+1;r=d[o]|0}c[b>>2]=r;if((r|0)!=45){n=45;l=306;break}o=c[j>>2]|0;p=c[o>>2]|0;c[o>>2]=p+ -1;if((p|0)==0){s=_j(o)|0}else{p=o+4|0;o=c[p>>2]|0;c[p>>2]=o+1;s=d[o]|0}c[b>>2]=s;do{if((s|0)==91){o=pm(b)|0;c[(c[h>>2]|0)+4>>2]=0;if((o|0)>-1){qm(b,0,o);c[(c[h>>2]|0)+4>>2]=0;continue a}else{t=c[b>>2]|0;break}}else{t=s}}while(0);while(1){if((t|0)==-1|(t|0)==13|(t|0)==10){continue a}o=c[j>>2]|0;p=c[o>>2]|0;c[o>>2]=p+ -1;if((p|0)==0){u=_j(o)|0}else{p=o+4|0;o=c[p>>2]|0;c[p>>2]=o+1;u=d[o]|0}c[b>>2]=u;t=u}}switch(l|0){case 25:{u=pm(b)|0;if((u|0)>-1){qm(b,e,u);n=289;i=f;return n|0}if((u|0)==-1){n=91;i=f;return n|0}else{im(b,11456,289)}break};case 29:{u=c[j>>2]|0;t=c[u>>2]|0;c[u>>2]=t+ -1;if((t|0)==0){v=_j(u)|0}else{t=u+4|0;u=c[t>>2]|0;c[t>>2]=u+1;v=d[u]|0}c[b>>2]=v;if((v|0)!=61){n=61;i=f;return n|0}v=c[j>>2]|0;u=c[v>>2]|0;c[v>>2]=u+ -1;if((u|0)==0){w=_j(v)|0}else{u=v+4|0;v=c[u>>2]|0;c[u>>2]=v+1;w=d[v]|0}c[b>>2]=w;n=281;i=f;return n|0};case 37:{w=c[j>>2]|0;v=c[w>>2]|0;c[w>>2]=v+ -1;if((v|0)==0){x=_j(w)|0}else{v=w+4|0;w=c[v>>2]|0;c[v>>2]=w+1;x=d[w]|0}c[b>>2]=x;if((x|0)!=61){n=60;i=f;return n|0}x=c[j>>2]|0;w=c[x>>2]|0;c[x>>2]=w+ -1;if((w|0)==0){y=_j(x)|0}else{w=x+4|0;x=c[w>>2]|0;c[w>>2]=x+1;y=d[x]|0}c[b>>2]=y;n=283;i=f;return n|0};case 45:{y=c[j>>2]|0;x=c[y>>2]|0;c[y>>2]=x+ -1;if((x|0)==0){z=_j(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;z=d[y]|0}c[b>>2]=z;if((z|0)!=61){n=62;i=f;return n|0}z=c[j>>2]|0;y=c[z>>2]|0;c[z>>2]=y+ -1;if((y|0)==0){A=_j(z)|0}else{y=z+4|0;z=c[y>>2]|0;c[y>>2]=z+1;A=d[z]|0}c[b>>2]=A;n=282;i=f;return n|0};case 53:{A=c[j>>2]|0;z=c[A>>2]|0;c[A>>2]=z+ -1;if((z|0)==0){B=_j(A)|0}else{z=A+4|0;A=c[z>>2]|0;c[z>>2]=A+1;B=d[A]|0}c[b>>2]=B;if((B|0)!=61){n=126;i=f;return n|0}B=c[j>>2]|0;A=c[B>>2]|0;c[B>>2]=A+ -1;if((A|0)==0){C=_j(B)|0}else{A=B+4|0;B=c[A>>2]|0;c[A>>2]=B+1;C=d[B]|0}c[b>>2]=C;n=284;i=f;return n|0};case 61:{C=c[j>>2]|0;B=c[C>>2]|0;c[C>>2]=B+ -1;if((B|0)==0){D=_j(C)|0}else{B=C+4|0;C=c[B>>2]|0;c[B>>2]=C+1;D=d[C]|0}c[b>>2]=D;if((D|0)!=58){n=58;i=f;return n|0}D=c[j>>2]|0;C=c[D>>2]|0;c[D>>2]=C+ -1;if((C|0)==0){E=_j(D)|0}else{C=D+4|0;D=c[C>>2]|0;c[C>>2]=D+1;E=d[D]|0}c[b>>2]=E;n=285;i=f;return n|0};case 69:{E=c[h>>2]|0;D=E+4|0;C=c[D>>2]|0;B=E+8|0;A=c[B>>2]|0;do{if((C+1|0)>>>0>A>>>0){if(A>>>0>2147483645){im(b,11552,0)}z=A<<1;y=c[b+52>>2]|0;if((z|0)==-2){th(y)}else{x=uh(y,c[E>>2]|0,A,z)|0;c[E>>2]=x;c[B>>2]=z;F=c[D>>2]|0;G=x;break}}else{F=C;G=c[E>>2]|0}}while(0);E=k&255;c[D>>2]=F+1;a[G+F|0]=E;F=c[j>>2]|0;G=c[F>>2]|0;c[F>>2]=G+ -1;if((G|0)==0){H=_j(F)|0}else{G=F+4|0;F=c[G>>2]|0;c[G>>2]=F+1;H=d[F]|0}c[b>>2]=H;c:do{if((H|0)!=(k|0)){F=b+52|0;G=H;d:while(1){e:do{if((G|0)==-1){l=82;break d}else if((G|0)==13|(G|0)==10){l=83;break d}else if((G|0)==92){D=c[j>>2]|0;C=c[D>>2]|0;c[D>>2]=C+ -1;if((C|0)==0){I=_j(D)|0}else{C=D+4|0;D=c[C>>2]|0;c[C>>2]=D+1;I=d[D]|0}c[b>>2]=I;do{switch(I|0){case-1:{J=-1;break e;break};case 98:{K=8;l=124;break};case 102:{K=12;l=124;break};case 110:{K=10;l=124;break};case 114:{K=13;l=124;break};case 116:{K=9;l=124;break};case 118:{K=11;l=124;break};case 120:{c[g>>2]=120;L=1;D=0;while(1){C=c[j>>2]|0;B=c[C>>2]|0;c[C>>2]=B+ -1;if((B|0)==0){M=_j(C)|0}else{B=C+4|0;C=c[B>>2]|0;c[B>>2]=C+1;M=d[C]|0}c[b>>2]=M;c[g+(L<<2)>>2]=M;if((a[M+10097|0]&16)==0){l=100;break d}C=(Oh(M)|0)+(D<<4)|0;B=L+1|0;if((B|0)<3){L=B;D=C}else{K=C;l=124;break}}break};case 97:{K=7;l=124;break};case 13:case 10:{om(b);N=10;break};case 39:case 34:case 92:{K=I;l=124;break};case 122:{D=c[j>>2]|0;C=c[D>>2]|0;c[D>>2]=C+ -1;if((C|0)==0){O=_j(D)|0}else{C=D+4|0;D=c[C>>2]|0;c[C>>2]=D+1;O=d[D]|0}c[b>>2]=O;if((a[O+10097|0]&8)==0){J=O;break e}else{P=O}while(1){if((P|0)==13|(P|0)==10){om(b);Q=c[b>>2]|0}else{D=c[j>>2]|0;C=c[D>>2]|0;c[D>>2]=C+ -1;if((C|0)==0){R=_j(D)|0}else{C=D+4|0;D=c[C>>2]|0;c[C>>2]=D+1;R=d[D]|0}c[b>>2]=R;Q=R}if((a[Q+10097|0]&8)==0){J=Q;break e}else{P=Q}}break};default:{if((a[I+10097|0]&2)==0){l=116;break d}else{S=I;T=0;U=0}while(1){if((a[S+10097|0]&2)==0){V=T;W=U;break}c[g+(T<<2)>>2]=S;D=S+ -48+(U*10|0)|0;C=c[j>>2]|0;B=c[C>>2]|0;c[C>>2]=B+ -1;if((B|0)==0){X=_j(C)|0}else{B=C+4|0;C=c[B>>2]|0;c[B>>2]=C+1;X=d[C]|0}c[b>>2]=X;C=T+1|0;if((C|0)<3){S=X;T=C;U=D}else{V=C;W=D;break}}if((W|0)>255){l=123;break d}else{N=W}}}}while(0);if((l|0)==124){l=0;D=c[j>>2]|0;C=c[D>>2]|0;c[D>>2]=C+ -1;if((C|0)==0){Y=_j(D)|0}else{C=D+4|0;D=c[C>>2]|0;c[C>>2]=D+1;Y=d[D]|0}c[b>>2]=Y;N=K}D=c[h>>2]|0;C=D+4|0;B=c[C>>2]|0;A=D+8|0;x=c[A>>2]|0;if((B+1|0)>>>0>x>>>0){if(x>>>0>2147483645){l=131;break d}z=x<<1;Z=c[F>>2]|0;if((z|0)==-2){l=133;break d}y=uh(Z,c[D>>2]|0,x,z)|0;c[D>>2]=y;c[A>>2]=z;_=c[C>>2]|0;$=y}else{_=B;$=c[D>>2]|0}c[C>>2]=_+1;a[$+_|0]=N;J=c[b>>2]|0}else{C=c[h>>2]|0;D=C+4|0;B=c[D>>2]|0;y=C+8|0;z=c[y>>2]|0;if((B+1|0)>>>0>z>>>0){if(z>>>0>2147483645){l=139;break d}A=z<<1;aa=c[F>>2]|0;if((A|0)==-2){l=141;break d}x=uh(aa,c[C>>2]|0,z,A)|0;c[C>>2]=x;c[y>>2]=A;ba=c[D>>2]|0;ca=x}else{ba=B;ca=c[C>>2]|0}c[D>>2]=ba+1;a[ca+ba|0]=G;D=c[j>>2]|0;C=c[D>>2]|0;c[D>>2]=C+ -1;if((C|0)==0){da=_j(D)|0}else{C=D+4|0;D=c[C>>2]|0;c[C>>2]=D+1;da=d[D]|0}c[b>>2]=da;J=da}}while(0);if((J|0)==(k|0)){break c}else{G=J}}if((l|0)==82){im(b,11584,286)}else if((l|0)==83){im(b,11584,289)}else if((l|0)==100){sm(b,g,L+1|0,11664)}else if((l|0)==116){sm(b,b,1,11608)}else if((l|0)==123){sm(b,g,V,11632)}else if((l|0)==131){im(b,11552,0)}else if((l|0)==133){th(Z)}else if((l|0)==139){im(b,11552,0)}else if((l|0)==141){th(aa)}}}while(0);aa=c[h>>2]|0;Z=aa+4|0;V=c[Z>>2]|0;g=aa+8|0;L=c[g>>2]|0;do{if((V+1|0)>>>0>L>>>0){if(L>>>0>2147483645){im(b,11552,0)}J=L<<1;da=c[b+52>>2]|0;if((J|0)==-2){th(da)}else{ba=uh(da,c[aa>>2]|0,L,J)|0;c[aa>>2]=ba;c[g>>2]=J;ea=c[Z>>2]|0;fa=ba;break}}else{ea=V;fa=c[aa>>2]|0}}while(0);c[Z>>2]=ea+1;a[fa+ea|0]=E;E=c[j>>2]|0;ea=c[E>>2]|0;c[E>>2]=ea+ -1;if((ea|0)==0){ga=_j(E)|0}else{ea=E+4|0;E=c[ea>>2]|0;c[ea>>2]=E+1;ga=d[E]|0}c[b>>2]=ga;ga=c[h>>2]|0;E=c[b+52>>2]|0;ea=Mi(E,(c[ga>>2]|0)+1|0,(c[ga+4>>2]|0)+ -2|0)|0;ga=E+8|0;fa=c[ga>>2]|0;c[ga>>2]=fa+16;c[fa>>2]=ea;c[fa+8>>2]=d[ea+4|0]|64;fa=mj(E,c[(c[b+48>>2]|0)+4>>2]|0,(c[ga>>2]|0)+ -16|0)|0;Z=fa+8|0;if((c[Z>>2]|0)==0?(c[fa>>2]=1,c[Z>>2]=1,(c[(c[E+12>>2]|0)+12>>2]|0)>0):0){gg(E)}c[ga>>2]=(c[ga>>2]|0)+ -16;c[e>>2]=ea;n=289;i=f;return n|0};case 161:{ea=c[h>>2]|0;ga=ea+4|0;E=c[ga>>2]|0;Z=ea+8|0;fa=c[Z>>2]|0;do{if((E+1|0)>>>0>fa>>>0){if(fa>>>0>2147483645){im(b,11552,0)}aa=fa<<1;V=c[b+52>>2]|0;if((aa|0)==-2){th(V)}else{g=uh(V,c[ea>>2]|0,fa,aa)|0;c[ea>>2]=g;c[Z>>2]=aa;ha=c[ga>>2]|0;ia=g;break}}else{ha=E;ia=c[ea>>2]|0}}while(0);c[ga>>2]=ha+1;a[ia+ha|0]=46;ha=c[j>>2]|0;ia=c[ha>>2]|0;c[ha>>2]=ia+ -1;if((ia|0)==0){ja=_j(ha)|0}else{ia=ha+4|0;ha=c[ia>>2]|0;c[ia>>2]=ha+1;ja=d[ha]|0}c[b>>2]=ja;if((ja|0)!=0?(vm(11488,ja,2)|0)!=0:0){ha=c[h>>2]|0;ia=ha+4|0;ga=c[ia>>2]|0;ea=ha+8|0;E=c[ea>>2]|0;do{if((ga+1|0)>>>0>E>>>0){if(E>>>0>2147483645){im(b,11552,0)}Z=E<<1;fa=c[b+52>>2]|0;if((Z|0)==-2){th(fa)}else{g=uh(fa,c[ha>>2]|0,E,Z)|0;c[ha>>2]=g;c[ea>>2]=Z;ka=c[ia>>2]|0;la=g;break}}else{ka=ga;la=c[ha>>2]|0}}while(0);c[ia>>2]=ka+1;a[la+ka|0]=ja;ka=c[j>>2]|0;la=c[ka>>2]|0;c[ka>>2]=la+ -1;if((la|0)==0){ma=_j(ka)|0}else{la=ka+4|0;ka=c[la>>2]|0;c[la>>2]=ka+1;ma=d[ka]|0}c[b>>2]=ma;if((ma|0)==0){n=279;i=f;return n|0}if((vm(11488,ma,2)|0)==0){n=279;i=f;return n|0}ka=c[h>>2]|0;la=ka+4|0;ia=c[la>>2]|0;ha=ka+8|0;ga=c[ha>>2]|0;do{if((ia+1|0)>>>0>ga>>>0){if(ga>>>0>2147483645){im(b,11552,0)}ea=ga<<1;E=c[b+52>>2]|0;if((ea|0)==-2){th(E)}else{g=uh(E,c[ka>>2]|0,ga,ea)|0;c[ka>>2]=g;c[ha>>2]=ea;na=c[la>>2]|0;oa=g;break}}else{na=ia;oa=c[ka>>2]|0}}while(0);c[la>>2]=na+1;a[oa+na|0]=ma;ma=c[j>>2]|0;na=c[ma>>2]|0;c[ma>>2]=na+ -1;if((na|0)==0){pa=_j(ma)|0}else{na=ma+4|0;ma=c[na>>2]|0;c[na>>2]=ma+1;pa=d[ma]|0}c[b>>2]=pa;n=280;i=f;return n|0}if((a[ja+10097|0]&2)==0){n=46;i=f;return n|0}else{m=ja}break};case 283:{if((a[k+10097|0]&1)==0){ja=c[j>>2]|0;pa=c[ja>>2]|0;c[ja>>2]=pa+ -1;if((pa|0)==0){qa=_j(ja)|0}else{pa=ja+4|0;ja=c[pa>>2]|0;c[pa>>2]=ja+1;qa=d[ja]|0}c[b>>2]=qa;n=k;i=f;return n|0}qa=b+52|0;ja=k;while(1){k=c[h>>2]|0;pa=k+4|0;ma=c[pa>>2]|0;na=k+8|0;oa=c[na>>2]|0;if((ma+1|0)>>>0>oa>>>0){if(oa>>>0>2147483645){l=288;break}la=oa<<1;ra=c[qa>>2]|0;if((la|0)==-2){l=290;break}ka=uh(ra,c[k>>2]|0,oa,la)|0;c[k>>2]=ka;c[na>>2]=la;sa=c[pa>>2]|0;ta=ka}else{sa=ma;ta=c[k>>2]|0}c[pa>>2]=sa+1;a[ta+sa|0]=ja;pa=c[j>>2]|0;k=c[pa>>2]|0;c[pa>>2]=k+ -1;if((k|0)==0){ua=_j(pa)|0}else{k=pa+4|0;pa=c[k>>2]|0;c[k>>2]=pa+1;ua=d[pa]|0}c[b>>2]=ua;if((a[ua+10097|0]&3)==0){l=296;break}else{ja=ua}}if((l|0)==288){im(b,11552,0)}else if((l|0)==290){th(ra)}else if((l|0)==296){ra=c[h>>2]|0;ua=c[qa>>2]|0;qa=Mi(ua,c[ra>>2]|0,c[ra+4>>2]|0)|0;ra=ua+8|0;ja=c[ra>>2]|0;c[ra>>2]=ja+16;c[ja>>2]=qa;sa=qa+4|0;c[ja+8>>2]=d[sa]|64;ja=mj(ua,c[(c[b+48>>2]|0)+4>>2]|0,(c[ra>>2]|0)+ -16|0)|0;ta=ja+8|0;if((c[ta>>2]|0)==0?(c[ja>>2]=1,c[ta>>2]=1,(c[(c[ua+12>>2]|0)+12>>2]|0)>0):0){gg(ua)}c[ra>>2]=(c[ra>>2]|0)+ -16;c[e>>2]=qa;if((a[sa]|0)!=4){n=288;i=f;return n|0}sa=a[qa+6|0]|0;if(sa<<24>>24==0){n=288;i=f;return n|0}n=sa&255|256;i=f;return n|0}break};case 306:{i=f;return n|0}}sa=c[h>>2]|0;qa=sa+4|0;ra=c[qa>>2]|0;ua=sa+8|0;ta=c[ua>>2]|0;do{if((ra+1|0)>>>0>ta>>>0){if(ta>>>0>2147483645){im(b,11552,0)}ja=ta<<1;pa=c[b+52>>2]|0;if((ja|0)==-2){th(pa)}else{k=uh(pa,c[sa>>2]|0,ta,ja)|0;c[sa>>2]=k;c[ua>>2]=ja;va=c[qa>>2]|0;wa=k;break}}else{va=ra;wa=c[sa>>2]|0}}while(0);c[qa>>2]=va+1;a[wa+va|0]=m;va=c[j>>2]|0;wa=c[va>>2]|0;c[va>>2]=wa+ -1;if((wa|0)==0){xa=_j(va)|0}else{wa=va+4|0;va=c[wa>>2]|0;c[wa>>2]=va+1;xa=d[va]|0}c[b>>2]=xa;if((m|0)==48){if((xa|0)!=0){if((vm(11504,xa,3)|0)==0){ya=xa;za=11496}else{m=c[h>>2]|0;va=m+4|0;wa=c[va>>2]|0;qa=m+8|0;sa=c[qa>>2]|0;do{if((wa+1|0)>>>0>sa>>>0){if(sa>>>0>2147483645){im(b,11552,0)}ra=sa<<1;ua=c[b+52>>2]|0;if((ra|0)==-2){th(ua)}else{ta=uh(ua,c[m>>2]|0,sa,ra)|0;c[m>>2]=ta;c[qa>>2]=ra;Aa=c[va>>2]|0;Ba=ta;break}}else{Aa=wa;Ba=c[m>>2]|0}}while(0);c[va>>2]=Aa+1;a[Ba+Aa|0]=xa;Aa=c[j>>2]|0;Ba=c[Aa>>2]|0;c[Aa>>2]=Ba+ -1;if((Ba|0)==0){Ca=_j(Aa)|0}else{Ba=Aa+4|0;Aa=c[Ba>>2]|0;c[Ba>>2]=Aa+1;Ca=d[Aa]|0}c[b>>2]=Ca;ya=Ca;za=11512}}else{ya=0;za=11496}}else{ya=xa;za=11496}xa=b+52|0;Ca=ya;while(1){if((Ca|0)!=0){if((vm(za,Ca,3)|0)!=0){ya=c[h>>2]|0;Aa=ya+4|0;Ba=c[Aa>>2]|0;va=ya+8|0;m=c[va>>2]|0;if((Ba+1|0)>>>0>m>>>0){if(m>>>0>2147483645){l=227;break}wa=m<<1;Da=c[xa>>2]|0;if((wa|0)==-2){l=229;break}qa=uh(Da,c[ya>>2]|0,m,wa)|0;c[ya>>2]=qa;c[va>>2]=wa;Ea=c[Aa>>2]|0;Fa=qa}else{Ea=Ba;Fa=c[ya>>2]|0}c[Aa>>2]=Ea+1;a[Fa+Ea|0]=Ca;Aa=c[j>>2]|0;ya=c[Aa>>2]|0;c[Aa>>2]=ya+ -1;if((ya|0)==0){Ga=_j(Aa)|0}else{ya=Aa+4|0;Aa=c[ya>>2]|0;c[ya>>2]=Aa+1;Ga=d[Aa]|0}c[b>>2]=Ga;if((Ga|0)!=0){if((vm(11520,Ga,3)|0)==0){Ha=Ga}else{Aa=c[h>>2]|0;ya=Aa+4|0;Ba=c[ya>>2]|0;qa=Aa+8|0;wa=c[qa>>2]|0;if((Ba+1|0)>>>0>wa>>>0){if(wa>>>0>2147483645){l=239;break}va=wa<<1;Ia=c[xa>>2]|0;if((va|0)==-2){l=241;break}m=uh(Ia,c[Aa>>2]|0,wa,va)|0;c[Aa>>2]=m;c[qa>>2]=va;Ja=c[ya>>2]|0;Ka=m}else{Ja=Ba;Ka=c[Aa>>2]|0}c[ya>>2]=Ja+1;a[Ka+Ja|0]=Ga;ya=c[j>>2]|0;Aa=c[ya>>2]|0;c[ya>>2]=Aa+ -1;if((Aa|0)==0){La=_j(ya)|0}else{Aa=ya+4|0;ya=c[Aa>>2]|0;c[Aa>>2]=ya+1;La=d[ya]|0}c[b>>2]=La;Ha=La}}else{Ha=0}}else{Ha=Ca}}else{Ha=0}Ma=c[h>>2]|0;Na=Ma+4|0;Oa=c[Na>>2]|0;Pa=Ma+8|0;Qa=c[Pa>>2]|0;Ra=(Oa+1|0)>>>0>Qa>>>0;if(!((a[Ha+10097|0]&16)!=0|(Ha|0)==46)){l=259;break}if(Ra){if(Qa>>>0>2147483645){l=251;break}ya=Qa<<1;Sa=c[xa>>2]|0;if((ya|0)==-2){l=253;break}Aa=uh(Sa,c[Ma>>2]|0,Qa,ya)|0;c[Ma>>2]=Aa;c[Pa>>2]=ya;Ta=c[Na>>2]|0;Ua=Aa}else{Ta=Oa;Ua=c[Ma>>2]|0}c[Na>>2]=Ta+1;a[Ua+Ta|0]=Ha;Aa=c[j>>2]|0;ya=c[Aa>>2]|0;c[Aa>>2]=ya+ -1;if((ya|0)==0){Va=_j(Aa)|0}else{ya=Aa+4|0;Aa=c[ya>>2]|0;c[ya>>2]=Aa+1;Va=d[Aa]|0}c[b>>2]=Va;Ca=Va}if((l|0)==227){im(b,11552,0)}else if((l|0)==229){th(Da)}else if((l|0)==239){im(b,11552,0)}else if((l|0)==241){th(Ia)}else if((l|0)==251){im(b,11552,0)}else if((l|0)==253){th(Sa)}else if((l|0)==259){do{if(Ra){if(Qa>>>0>2147483645){im(b,11552,0)}l=Qa<<1;Sa=c[xa>>2]|0;if((l|0)==-2){th(Sa)}else{Ia=uh(Sa,c[Ma>>2]|0,Qa,l)|0;c[Ma>>2]=Ia;c[Pa>>2]=l;Wa=c[Na>>2]|0;Xa=Ia;break}}else{Wa=Oa;Xa=c[Ma>>2]|0}}while(0);c[Na>>2]=Wa+1;a[Xa+Wa|0]=0;Wa=b+76|0;Xa=a[Wa]|0;Na=c[h>>2]|0;Ma=c[Na>>2]|0;Oa=c[Na+4>>2]|0;if((Oa|0)==0){Ya=Ma;Za=-1}else{Na=Oa;do{Na=Na+ -1|0;Oa=Ma+Na|0;if((a[Oa]|0)==46){a[Oa]=Xa}}while((Na|0)!=0);Na=c[h>>2]|0;Ya=c[Na>>2]|0;Za=(c[Na+4>>2]|0)+ -1|0}if((Ph(Ya,Za,e)|0)!=0){n=287;i=f;return n|0}Za=a[Wa]|0;Ya=a[c[(hb()|0)>>2]|0]|0;a[Wa]=Ya;Na=c[h>>2]|0;Xa=c[Na>>2]|0;Ma=c[Na+4>>2]|0;if((Ma|0)==0){_a=Xa;$a=-1}else{Na=Ma;do{Na=Na+ -1|0;Ma=Xa+Na|0;if((a[Ma]|0)==Za<<24>>24){a[Ma]=Ya}}while((Na|0)!=0);Na=c[h>>2]|0;_a=c[Na>>2]|0;$a=(c[Na+4>>2]|0)+ -1|0}if((Ph(_a,$a,e)|0)!=0){n=287;i=f;return n|0}n=a[Wa]|0;Wa=c[h>>2]|0;h=c[Wa>>2]|0;f=c[Wa+4>>2]|0;if((f|0)==0){im(b,11528,287)}else{ab=f}do{ab=ab+ -1|0;f=h+ab|0;if((a[f]|0)==n<<24>>24){a[f]=46}}while((ab|0)!=0);im(b,11528,287)}return 0}function nm(a){a=a|0;var b=0,d=0;b=i;d=mm(a,a+40|0)|0;c[a+32>>2]=d;i=b;return d|0}function om(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;e=c[a>>2]|0;f=a+56|0;g=c[f>>2]|0;h=c[g>>2]|0;c[g>>2]=h+ -1;if((h|0)==0){j=_j(g)|0}else{h=g+4|0;g=c[h>>2]|0;c[h>>2]=g+1;j=d[g]|0}c[a>>2]=j;if((j|0)==13|(j|0)==10?(j|0)!=(e|0):0){e=c[f>>2]|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f|0)==0){k=_j(e)|0}else{f=e+4|0;e=c[f>>2]|0;c[f>>2]=e+1;k=d[e]|0}c[a>>2]=k}k=a+4|0;e=c[k>>2]|0;c[k>>2]=e+1;if((e|0)>2147483643){hm(a,11744)}else{i=b;return}}function pm(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=i;f=c[b>>2]|0;g=b+60|0;h=c[g>>2]|0;j=h+4|0;k=c[j>>2]|0;l=h+8|0;m=c[l>>2]|0;do{if((k+1|0)>>>0>m>>>0){if(m>>>0>2147483645){im(b,11552,0)}n=m<<1;o=c[b+52>>2]|0;if((n|0)==-2){th(o)}else{p=uh(o,c[h>>2]|0,m,n)|0;c[h>>2]=p;c[l>>2]=n;q=c[j>>2]|0;r=p;break}}else{q=k;r=c[h>>2]|0}}while(0);c[j>>2]=q+1;a[r+q|0]=f;q=b+56|0;r=c[q>>2]|0;j=c[r>>2]|0;c[r>>2]=j+ -1;if((j|0)==0){s=_j(r)|0}else{j=r+4|0;r=c[j>>2]|0;c[j>>2]=r+1;s=d[r]|0}c[b>>2]=s;if((s|0)!=61){t=s;u=0;v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;i=e;return x|0}s=b+52|0;r=0;while(1){j=c[g>>2]|0;h=j+4|0;k=c[h>>2]|0;l=j+8|0;m=c[l>>2]|0;if((k+1|0)>>>0>m>>>0){if(m>>>0>2147483645){y=16;break}p=m<<1;z=c[s>>2]|0;if((p|0)==-2){y=18;break}n=uh(z,c[j>>2]|0,m,p)|0;c[j>>2]=n;c[l>>2]=p;A=c[h>>2]|0;B=n}else{A=k;B=c[j>>2]|0}c[h>>2]=A+1;a[B+A|0]=61;h=c[q>>2]|0;j=c[h>>2]|0;c[h>>2]=j+ -1;if((j|0)==0){C=_j(h)|0}else{j=h+4|0;h=c[j>>2]|0;c[j>>2]=h+1;C=d[h]|0}c[b>>2]=C;h=r+1|0;if((C|0)==61){r=h}else{t=C;u=h;y=24;break}}if((y|0)==16){im(b,11552,0)}else if((y|0)==18){th(z)}else if((y|0)==24){v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;i=e;return x|0}return 0}function qm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;h=c[b>>2]|0;j=b+60|0;k=c[j>>2]|0;l=k+4|0;m=c[l>>2]|0;n=k+8|0;o=c[n>>2]|0;do{if((m+1|0)>>>0>o>>>0){if(o>>>0>2147483645){im(b,11552,0)}p=o<<1;q=c[b+52>>2]|0;if((p|0)==-2){th(q)}else{r=uh(q,c[k>>2]|0,o,p)|0;c[k>>2]=r;c[n>>2]=p;s=c[l>>2]|0;t=r;break}}else{s=m;t=c[k>>2]|0}}while(0);c[l>>2]=s+1;a[t+s|0]=h;h=b+56|0;s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t+ -1;if((t|0)==0){u=_j(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;u=d[s]|0}c[b>>2]=u;if((u|0)==13|(u|0)==10){om(b);v=13}else{w=u}a:while(1){if((v|0)==13){v=0;w=c[b>>2]|0}x=(e|0)==0;y=b+52|0;b:do{if(x){u=w;while(1){if((u|0)==93){v=22;break b}else if((u|0)==13|(u|0)==10){break b}else if((u|0)==-1){v=21;break a}s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t+ -1;if((t|0)==0){z=_j(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;z=d[s]|0}c[b>>2]=z;u=z}}else{u=w;while(1){if((u|0)==-1){v=21;break a}else if((u|0)==93){v=22;break b}else if((u|0)==13|(u|0)==10){break b}s=c[j>>2]|0;t=s+4|0;l=c[t>>2]|0;k=s+8|0;m=c[k>>2]|0;if((l+1|0)>>>0>m>>>0){if(m>>>0>2147483645){v=46;break a}n=m<<1;A=c[y>>2]|0;if((n|0)==-2){v=48;break a}o=uh(A,c[s>>2]|0,m,n)|0;c[s>>2]=o;c[k>>2]=n;B=c[t>>2]|0;C=o}else{B=l;C=c[s>>2]|0}c[t>>2]=B+1;a[C+B|0]=u;t=c[h>>2]|0;s=c[t>>2]|0;c[t>>2]=s+ -1;if((s|0)==0){D=_j(t)|0}else{s=t+4|0;t=c[s>>2]|0;c[s>>2]=t+1;D=d[t]|0}c[b>>2]=D;u=D}}}while(0);if((v|0)==22){v=0;if((pm(b)|0)==(f|0)){v=23;break}else{v=13;continue}}u=c[j>>2]|0;t=u+4|0;s=c[t>>2]|0;l=u+8|0;o=c[l>>2]|0;if((s+1|0)>>>0>o>>>0){if(o>>>0>2147483645){v=37;break}n=o<<1;E=c[y>>2]|0;if((n|0)==-2){v=39;break}k=uh(E,c[u>>2]|0,o,n)|0;c[u>>2]=k;c[l>>2]=n;F=c[t>>2]|0;G=k}else{F=s;G=c[u>>2]|0}c[t>>2]=F+1;a[G+F|0]=10;om(b);if(!x){v=13;continue}c[(c[j>>2]|0)+4>>2]=0;v=13}if((v|0)==21){im(b,(e|0)!=0?11696:11720,286)}else if((v|0)==23){F=c[b>>2]|0;G=c[j>>2]|0;D=G+4|0;B=c[D>>2]|0;C=G+8|0;w=c[C>>2]|0;do{if((B+1|0)>>>0>w>>>0){if(w>>>0>2147483645){im(b,11552,0)}z=w<<1;t=c[y>>2]|0;if((z|0)==-2){th(t)}else{u=uh(t,c[G>>2]|0,w,z)|0;c[G>>2]=u;c[C>>2]=z;H=c[D>>2]|0;I=u;break}}else{H=B;I=c[G>>2]|0}}while(0);c[D>>2]=H+1;a[I+H|0]=F;F=c[h>>2]|0;h=c[F>>2]|0;c[F>>2]=h+ -1;if((h|0)==0){J=_j(F)|0}else{h=F+4|0;F=c[h>>2]|0;c[h>>2]=F+1;J=d[F]|0}c[b>>2]=J;if(x){i=g;return}x=c[j>>2]|0;j=f+2|0;f=c[y>>2]|0;y=Mi(f,(c[x>>2]|0)+j|0,(c[x+4>>2]|0)-(j<<1)|0)|0;j=f+8|0;x=c[j>>2]|0;c[j>>2]=x+16;c[x>>2]=y;c[x+8>>2]=d[y+4|0]|0|64;x=mj(f,c[(c[b+48>>2]|0)+4>>2]|0,(c[j>>2]|0)+ -16|0)|0;J=x+8|0;if((c[J>>2]|0)==0?(c[x>>2]=1,c[J>>2]=1,(c[(c[f+12>>2]|0)+12>>2]|0)>0):0){gg(f)}c[j>>2]=(c[j>>2]|0)+ -16;c[e>>2]=y;i=g;return}else if((v|0)==37){im(b,11552,0)}else if((v|0)==39){th(E)}else if((v|0)==46){im(b,11552,0)}else if((v|0)==48){th(A)}}function rm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;f=c[b+60>>2]|0;g=f+4|0;h=c[g>>2]|0;j=f+8|0;k=c[j>>2]|0;if(!((h+1|0)>>>0>k>>>0)){l=h;m=c[f>>2]|0;n=d&255;o=l+1|0;c[g>>2]=o;p=m+l|0;a[p]=n;i=e;return}if(k>>>0>2147483645){im(b,11552,0)}h=k<<1;q=c[b+52>>2]|0;if((h|0)==-2){th(q)}b=uh(q,c[f>>2]|0,k,h)|0;c[f>>2]=b;c[j>>2]=h;l=c[g>>2]|0;m=b;n=d&255;o=l+1|0;c[g>>2]=o;p=m+l|0;a[p]=n;i=e;return}function sm(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;c[(c[a+60>>2]|0)+4>>2]=0;rm(a,92);a:do{if((d|0)>0){f=0;do{g=c[b+(f<<2)>>2]|0;if((g|0)==-1){break a}rm(a,g);f=f+1|0}while((f|0)<(d|0))}}while(0);im(a,e,289)}function tm(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=Tm(a,b)|0;i=c;return d|0}function um(a,b){a=+a;b=b|0;var c=0,d=0.0;c=i;d=+Nm(a,b);i=c;return+d}function vm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;g=d&255;h=(e|0)==0;a:do{if((b&3|0)==0|h){j=e;k=h;l=b;m=5}else{n=d&255;o=e;p=b;while(1){if((a[p]|0)==n<<24>>24){q=o;r=p;m=6;break a}s=p+1|0;t=o+ -1|0;u=(t|0)==0;if((s&3|0)==0|u){j=t;k=u;l=s;m=5;break}else{o=t;p=s}}}}while(0);if((m|0)==5){if(k){v=0;w=l}else{q=j;r=l;m=6}}b:do{if((m|0)==6){l=d&255;if(!((a[r]|0)==l<<24>>24)){j=da(g,16843009)|0;c:do{if(q>>>0>3){k=q;b=r;while(1){e=c[b>>2]^j;if(((e&-2139062144^-2139062144)&e+ -16843009|0)!=0){x=k;y=b;break c}e=b+4|0;h=k+ -4|0;if(h>>>0>3){k=h;b=e}else{x=h;y=e;break}}}else{x=q;y=r}}while(0);if((x|0)==0){v=0;w=y}else{j=x;b=y;while(1){if((a[b]|0)==l<<24>>24){v=j;w=b;break b}k=b+1|0;e=j+ -1|0;if((e|0)==0){v=0;w=k;break}else{j=e;b=k}}}}else{v=q;w=r}}}while(0);i=f;return((v|0)!=0?w:0)|0}function wm(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=c&255;c=d;while(1){d=c+ -1|0;if((c|0)==0){g=0;h=4;break}j=b+d|0;if((a[j]|0)==f<<24>>24){g=j;h=4;break}else{c=d}}if((h|0)==4){i=e;return g|0}return 0}function xm(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;e=ym(b,c)|0;i=d;return((a[e]|0)==(c&255)<<24>>24?e:0)|0}function ym(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=d&255;if((f|0)==0){g=b+(Zm(b|0)|0)|0;i=e;return g|0}a:do{if((b&3|0)!=0){h=d&255;j=b;while(1){k=a[j]|0;if(k<<24>>24==0){g=j;l=13;break}m=j+1|0;if(k<<24>>24==h<<24>>24){g=j;l=13;break}if((m&3|0)==0){n=m;break a}else{j=m}}if((l|0)==13){i=e;return g|0}}else{n=b}}while(0);b=da(f,16843009)|0;f=c[n>>2]|0;b:do{if(((f&-2139062144^-2139062144)&f+ -16843009|0)==0){l=f;j=n;while(1){h=l^b;m=j+4|0;if(((h&-2139062144^-2139062144)&h+ -16843009|0)!=0){o=j;break b}h=c[m>>2]|0;if(((h&-2139062144^-2139062144)&h+ -16843009|0)==0){l=h;j=m}else{o=m;break}}}else{o=n}}while(0);n=d&255;d=o;while(1){o=a[d]|0;if(o<<24>>24==0|o<<24>>24==n<<24>>24){g=d;break}else{d=d+1|0}}i=e;return g|0}function zm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+32|0;f=e;g=a[d]|0;if(!(g<<24>>24==0)?(a[d+1|0]|0)!=0:0){c[f+0>>2]=0;c[f+4>>2]=0;c[f+8>>2]=0;c[f+12>>2]=0;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;c[f+28>>2]=0;h=d;d=g;do{j=d&255;k=f+(j>>>5<<2)|0;c[k>>2]=c[k>>2]|1<<(j&31);h=h+1|0;d=a[h]|0}while(!(d<<24>>24==0));d=a[b]|0;a:do{if(d<<24>>24==0){l=b}else{h=b;j=d;while(1){k=j&255;m=h+1|0;if((c[f+(k>>>5<<2)>>2]&1<<(k&31)|0)!=0){l=h;break a}k=a[m]|0;if(k<<24>>24==0){l=m;break}else{h=m;j=k}}}}while(0);n=l-b|0;i=e;return n|0}n=(ym(b,g<<24>>24)|0)-b|0;i=e;return n|0}function Am(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;e=b+(zm(b,c)|0)|0;i=d;return((a[e]|0)!=0?e:0)|0}function Bm(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=wm(a,b,(Zm(a|0)|0)+1|0)|0;i=c;return d|0}function Cm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+32|0;f=e;c[f+0>>2]=0;c[f+4>>2]=0;c[f+8>>2]=0;c[f+12>>2]=0;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;c[f+28>>2]=0;g=a[d]|0;if(g<<24>>24==0){h=0;i=e;return h|0}if((a[d+1|0]|0)==0){j=b;while(1){if((a[j]|0)==g<<24>>24){j=j+1|0}else{break}}h=j-b|0;i=e;return h|0}else{k=d;l=g}do{g=l&255;d=f+(g>>>5<<2)|0;c[d>>2]=c[d>>2]|1<<(g&31);k=k+1|0;l=a[k]|0}while(!(l<<24>>24==0));l=a[b]|0;a:do{if(l<<24>>24==0){m=b}else{k=b;g=l;while(1){d=g&255;j=k+1|0;if((c[f+(d>>>5<<2)>>2]&1<<(d&31)|0)==0){m=k;break a}d=a[j]|0;if(d<<24>>24==0){m=j;break}else{k=j;g=d}}}}while(0);h=m-b|0;i=e;return h|0}function Dm(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;f=i;i=i+1056|0;g=f+1024|0;h=f;j=a[e]|0;if(j<<24>>24==0){k=b;i=f;return k|0}l=xm(b,j<<24>>24)|0;if((l|0)==0){k=0;i=f;return k|0}b=a[e+1|0]|0;if(b<<24>>24==0){k=l;i=f;return k|0}m=l+1|0;n=a[m]|0;if(n<<24>>24==0){k=0;i=f;return k|0}o=a[e+2|0]|0;if(o<<24>>24==0){p=b&255|(j&255)<<8;q=m;m=n;r=d[l]<<8|n&255;while(1){s=r&65535;if((s|0)==(p|0)){t=q;u=m;break}v=q+1|0;w=a[v]|0;if(w<<24>>24==0){t=v;u=0;break}else{q=v;m=w;r=w&255|s<<8}}k=u<<24>>24==0?0:t+ -1|0;i=f;return k|0}t=l+2|0;u=a[t]|0;if(u<<24>>24==0){k=0;i=f;return k|0}r=a[e+3|0]|0;if(r<<24>>24==0){m=(b&255)<<16|(j&255)<<24|(o&255)<<8;q=(u&255)<<8|(n&255)<<16|d[l]<<24;if((q|0)==(m|0)){x=t;y=0}else{p=t;t=q;while(1){q=p+1|0;s=a[q]|0;w=(s&255|t)<<8;v=s<<24>>24==0;if(v|(w|0)==(m|0)){x=q;y=v;break}else{p=q;t=w}}}k=y?0:x+ -2|0;i=f;return k|0}x=l+3|0;y=a[x]|0;if(y<<24>>24==0){k=0;i=f;return k|0}if((a[e+4|0]|0)==0){t=(b&255)<<16|(j&255)<<24|(o&255)<<8|r&255;r=(u&255)<<8|(n&255)<<16|y&255|d[l]<<24;if((r|0)==(t|0)){z=x;A=0}else{y=x;x=r;while(1){r=y+1|0;n=a[r]|0;u=n&255|x<<8;o=n<<24>>24==0;if(o|(u|0)==(t|0)){z=r;A=o;break}else{y=r;x=u}}}k=A?0:z+ -3|0;i=f;return k|0}c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[g+16>>2]=0;c[g+20>>2]=0;c[g+24>>2]=0;c[g+28>>2]=0;z=j;j=0;while(1){if((a[l+j|0]|0)==0){k=0;B=80;break}A=z&255;x=g+(A>>>5<<2)|0;c[x>>2]=c[x>>2]|1<<(A&31);C=j+1|0;c[h+(A<<2)>>2]=C;z=a[e+C|0]|0;if(z<<24>>24==0){break}else{j=C}}if((B|0)==80){i=f;return k|0}a:do{if(C>>>0>1){z=1;A=-1;x=0;b:while(1){y=z;t=x;u=1;while(1){r=y;D=t;c:while(1){E=r;o=1;while(1){F=a[e+(o+A)|0]|0;G=a[e+E|0]|0;if(!(F<<24>>24==G<<24>>24)){break c}n=o+1|0;if((o|0)==(u|0)){break}b=n+D|0;if(b>>>0<C>>>0){E=b;o=n}else{H=A;I=u;break b}}o=D+u|0;n=o+1|0;if(n>>>0<C>>>0){r=n;D=o}else{H=A;I=u;break b}}r=E-A|0;if(!((F&255)>(G&255))){break}o=E+1|0;if(o>>>0<C>>>0){y=o;t=E;u=r}else{H=A;I=r;break b}}u=D+2|0;if(u>>>0<C>>>0){z=u;A=D;x=D+1|0}else{H=D;I=1;break}}x=1;A=-1;z=0;while(1){u=x;t=z;y=1;while(1){r=u;J=t;d:while(1){K=r;o=1;while(1){L=a[e+(o+A)|0]|0;M=a[e+K|0]|0;if(!(L<<24>>24==M<<24>>24)){break d}n=o+1|0;if((o|0)==(y|0)){break}b=n+J|0;if(b>>>0<C>>>0){K=b;o=n}else{N=H;O=A;P=I;Q=y;break a}}o=J+y|0;n=o+1|0;if(n>>>0<C>>>0){r=n;J=o}else{N=H;O=A;P=I;Q=y;break a}}r=K-A|0;if(!((L&255)<(M&255))){break}o=K+1|0;if(o>>>0<C>>>0){u=o;t=K;y=r}else{N=H;O=A;P=I;Q=r;break a}}y=J+2|0;if(y>>>0<C>>>0){x=y;A=J;z=J+1|0}else{N=H;O=J;P=I;Q=1;break}}}else{N=-1;O=-1;P=1;Q=1}}while(0);I=(O+1|0)>>>0>(N+1|0)>>>0;J=I?Q:P;P=I?O:N;N=P+1|0;if((Sm(e,e+J|0,N)|0)==0){O=C-J|0;I=C|63;if((C|0)!=(J|0)){Q=l;H=0;K=l;e:while(1){M=Q;do{if((K-M|0)>>>0<C>>>0){L=vm(K,0,I)|0;if((L|0)!=0){if((L-M|0)>>>0<C>>>0){k=0;B=80;break e}else{R=L;break}}else{R=K+I|0;break}}else{R=K}}while(0);M=d[Q+j|0]|0;if((1<<(M&31)&c[g+(M>>>5<<2)>>2]|0)==0){Q=Q+C|0;H=0;K=R;continue}L=c[h+(M<<2)>>2]|0;M=C-L|0;if((C|0)!=(L|0)){Q=Q+((H|0)!=0&M>>>0<J>>>0?O:M)|0;H=0;K=R;continue}M=N>>>0>H>>>0?N:H;L=a[e+M|0]|0;f:do{if(L<<24>>24==0){S=N}else{D=L;E=M;while(1){G=E+1|0;if(!(D<<24>>24==(a[Q+E|0]|0))){break}F=a[e+G|0]|0;if(F<<24>>24==0){S=N;break f}else{D=F;E=G}}Q=Q+(E-P)|0;H=0;K=R;continue e}}while(0);while(1){if(!(S>>>0>H>>>0)){break}M=S+ -1|0;if((a[e+M|0]|0)==(a[Q+M|0]|0)){S=M}else{break}}if((S|0)==(H|0)){k=Q;B=80;break}Q=Q+J|0;H=O;K=R}if((B|0)==80){i=f;return k|0}}else{T=I;U=C}}else{I=C-P+ -1|0;T=C|63;U=(P>>>0>I>>>0?P:I)+1|0}I=e+N|0;R=l;K=l;g:while(1){l=R;do{if((K-l|0)>>>0<C>>>0){O=vm(K,0,T)|0;if((O|0)!=0){if((O-l|0)>>>0<C>>>0){k=0;B=80;break g}else{V=O;break}}else{V=K+T|0;break}}else{V=K}}while(0);l=d[R+j|0]|0;if((1<<(l&31)&c[g+(l>>>5<<2)>>2]|0)==0){R=R+C|0;K=V;continue}O=c[h+(l<<2)>>2]|0;if((C|0)!=(O|0)){R=R+(C-O)|0;K=V;continue}O=a[I]|0;h:do{if(O<<24>>24==0){W=N}else{l=O;H=N;while(1){J=H+1|0;if(!(l<<24>>24==(a[R+H|0]|0))){break}Q=a[e+J|0]|0;if(Q<<24>>24==0){W=N;break h}else{l=Q;H=J}}R=R+(H-P)|0;K=V;continue g}}while(0);do{if((W|0)==0){k=R;B=80;break g}W=W+ -1|0}while((a[e+W|0]|0)==(a[R+W|0]|0));R=R+U|0;K=V}if((B|0)==80){i=f;return k|0}return 0}function Em(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,za=0,Aa=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0;b=i;do{if(a>>>0<245){if(a>>>0<11){d=16}else{d=a+11&-8}e=d>>>3;f=c[3024]|0;g=f>>>e;if((g&3|0)!=0){h=(g&1^1)+e|0;j=h<<1;k=12136+(j<<2)|0;l=12136+(j+2<<2)|0;j=c[l>>2]|0;m=j+8|0;n=c[m>>2]|0;do{if((k|0)!=(n|0)){if(n>>>0<(c[12112>>2]|0)>>>0){Ua()}o=n+12|0;if((c[o>>2]|0)==(j|0)){c[o>>2]=k;c[l>>2]=n;break}else{Ua()}}else{c[3024]=f&~(1<<h)}}while(0);n=h<<3;c[j+4>>2]=n|3;l=j+(n|4)|0;c[l>>2]=c[l>>2]|1;p=m;i=b;return p|0}if(d>>>0>(c[12104>>2]|0)>>>0){if((g|0)!=0){l=2<<e;n=g<<e&(l|0-l);l=(n&0-n)+ -1|0;n=l>>>12&16;k=l>>>n;l=k>>>5&8;o=k>>>l;k=o>>>2&4;q=o>>>k;o=q>>>1&2;r=q>>>o;q=r>>>1&1;s=(l|n|k|o|q)+(r>>>q)|0;q=s<<1;r=12136+(q<<2)|0;o=12136+(q+2<<2)|0;q=c[o>>2]|0;k=q+8|0;n=c[k>>2]|0;do{if((r|0)!=(n|0)){if(n>>>0<(c[12112>>2]|0)>>>0){Ua()}l=n+12|0;if((c[l>>2]|0)==(q|0)){c[l>>2]=r;c[o>>2]=n;break}else{Ua()}}else{c[3024]=f&~(1<<s)}}while(0);f=s<<3;n=f-d|0;c[q+4>>2]=d|3;o=q+d|0;c[q+(d|4)>>2]=n|1;c[q+f>>2]=n;f=c[12104>>2]|0;if((f|0)!=0){r=c[12116>>2]|0;e=f>>>3;f=e<<1;g=12136+(f<<2)|0;m=c[3024]|0;j=1<<e;if((m&j|0)!=0){e=12136+(f+2<<2)|0;h=c[e>>2]|0;if(h>>>0<(c[12112>>2]|0)>>>0){Ua()}else{t=e;u=h}}else{c[3024]=m|j;t=12136+(f+2<<2)|0;u=g}c[t>>2]=r;c[u+12>>2]=r;c[r+8>>2]=u;c[r+12>>2]=g}c[12104>>2]=n;c[12116>>2]=o;p=k;i=b;return p|0}o=c[12100>>2]|0;if((o|0)!=0){n=(o&0-o)+ -1|0;o=n>>>12&16;g=n>>>o;n=g>>>5&8;r=g>>>n;g=r>>>2&4;f=r>>>g;r=f>>>1&2;j=f>>>r;f=j>>>1&1;m=c[12400+((n|o|g|r|f)+(j>>>f)<<2)>>2]|0;f=(c[m+4>>2]&-8)-d|0;j=m;r=m;while(1){m=c[j+16>>2]|0;if((m|0)==0){g=c[j+20>>2]|0;if((g|0)==0){break}else{v=g}}else{v=m}m=(c[v+4>>2]&-8)-d|0;g=m>>>0<f>>>0;f=g?m:f;j=v;r=g?v:r}j=c[12112>>2]|0;if(r>>>0<j>>>0){Ua()}k=r+d|0;if(!(r>>>0<k>>>0)){Ua()}q=c[r+24>>2]|0;s=c[r+12>>2]|0;do{if((s|0)==(r|0)){g=r+20|0;m=c[g>>2]|0;if((m|0)==0){o=r+16|0;n=c[o>>2]|0;if((n|0)==0){w=0;break}else{x=n;y=o}}else{x=m;y=g}while(1){g=x+20|0;m=c[g>>2]|0;if((m|0)!=0){x=m;y=g;continue}g=x+16|0;m=c[g>>2]|0;if((m|0)==0){break}else{x=m;y=g}}if(y>>>0<j>>>0){Ua()}else{c[y>>2]=0;w=x;break}}else{g=c[r+8>>2]|0;if(g>>>0<j>>>0){Ua()}m=g+12|0;if((c[m>>2]|0)!=(r|0)){Ua()}o=s+8|0;if((c[o>>2]|0)==(r|0)){c[m>>2]=s;c[o>>2]=g;w=s;break}else{Ua()}}}while(0);do{if((q|0)!=0){s=c[r+28>>2]|0;j=12400+(s<<2)|0;if((r|0)==(c[j>>2]|0)){c[j>>2]=w;if((w|0)==0){c[12100>>2]=c[12100>>2]&~(1<<s);break}}else{if(q>>>0<(c[12112>>2]|0)>>>0){Ua()}s=q+16|0;if((c[s>>2]|0)==(r|0)){c[s>>2]=w}else{c[q+20>>2]=w}if((w|0)==0){break}}if(w>>>0<(c[12112>>2]|0)>>>0){Ua()}c[w+24>>2]=q;s=c[r+16>>2]|0;do{if((s|0)!=0){if(s>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[w+16>>2]=s;c[s+24>>2]=w;break}}}while(0);s=c[r+20>>2]|0;if((s|0)!=0){if(s>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[w+20>>2]=s;c[s+24>>2]=w;break}}}}while(0);if(f>>>0<16){q=f+d|0;c[r+4>>2]=q|3;s=r+(q+4)|0;c[s>>2]=c[s>>2]|1}else{c[r+4>>2]=d|3;c[r+(d|4)>>2]=f|1;c[r+(f+d)>>2]=f;s=c[12104>>2]|0;if((s|0)!=0){q=c[12116>>2]|0;j=s>>>3;s=j<<1;g=12136+(s<<2)|0;o=c[3024]|0;m=1<<j;if((o&m|0)!=0){j=12136+(s+2<<2)|0;n=c[j>>2]|0;if(n>>>0<(c[12112>>2]|0)>>>0){Ua()}else{z=j;A=n}}else{c[3024]=o|m;z=12136+(s+2<<2)|0;A=g}c[z>>2]=q;c[A+12>>2]=q;c[q+8>>2]=A;c[q+12>>2]=g}c[12104>>2]=f;c[12116>>2]=k}p=r+8|0;i=b;return p|0}else{B=d}}else{B=d}}else{if(!(a>>>0>4294967231)){g=a+11|0;q=g&-8;s=c[12100>>2]|0;if((s|0)!=0){m=0-q|0;o=g>>>8;if((o|0)!=0){if(q>>>0>16777215){C=31}else{g=(o+1048320|0)>>>16&8;n=o<<g;o=(n+520192|0)>>>16&4;j=n<<o;n=(j+245760|0)>>>16&2;h=14-(o|g|n)+(j<<n>>>15)|0;C=q>>>(h+7|0)&1|h<<1}}else{C=0}h=c[12400+(C<<2)>>2]|0;a:do{if((h|0)==0){D=m;E=0;F=0}else{if((C|0)==31){G=0}else{G=25-(C>>>1)|0}n=m;j=0;g=q<<G;o=h;e=0;while(1){l=c[o+4>>2]&-8;H=l-q|0;if(H>>>0<n>>>0){if((l|0)==(q|0)){D=H;E=o;F=o;break a}else{I=H;J=o}}else{I=n;J=e}H=c[o+20>>2]|0;l=c[o+(g>>>31<<2)+16>>2]|0;K=(H|0)==0|(H|0)==(l|0)?j:H;if((l|0)==0){D=I;E=K;F=J;break}else{n=I;j=K;g=g<<1;o=l;e=J}}}}while(0);if((E|0)==0&(F|0)==0){h=2<<C;m=s&(h|0-h);if((m|0)==0){B=q;break}h=(m&0-m)+ -1|0;m=h>>>12&16;r=h>>>m;h=r>>>5&8;k=r>>>h;r=k>>>2&4;f=k>>>r;k=f>>>1&2;e=f>>>k;f=e>>>1&1;L=c[12400+((h|m|r|k|f)+(e>>>f)<<2)>>2]|0}else{L=E}if((L|0)==0){M=D;N=F}else{f=D;e=L;k=F;while(1){r=(c[e+4>>2]&-8)-q|0;m=r>>>0<f>>>0;h=m?r:f;r=m?e:k;m=c[e+16>>2]|0;if((m|0)!=0){f=h;e=m;k=r;continue}m=c[e+20>>2]|0;if((m|0)==0){M=h;N=r;break}else{f=h;e=m;k=r}}}if((N|0)!=0?M>>>0<((c[12104>>2]|0)-q|0)>>>0:0){k=c[12112>>2]|0;if(N>>>0<k>>>0){Ua()}e=N+q|0;if(!(N>>>0<e>>>0)){Ua()}f=c[N+24>>2]|0;s=c[N+12>>2]|0;do{if((s|0)==(N|0)){r=N+20|0;m=c[r>>2]|0;if((m|0)==0){h=N+16|0;o=c[h>>2]|0;if((o|0)==0){O=0;break}else{P=o;Q=h}}else{P=m;Q=r}while(1){r=P+20|0;m=c[r>>2]|0;if((m|0)!=0){P=m;Q=r;continue}r=P+16|0;m=c[r>>2]|0;if((m|0)==0){break}else{P=m;Q=r}}if(Q>>>0<k>>>0){Ua()}else{c[Q>>2]=0;O=P;break}}else{r=c[N+8>>2]|0;if(r>>>0<k>>>0){Ua()}m=r+12|0;if((c[m>>2]|0)!=(N|0)){Ua()}h=s+8|0;if((c[h>>2]|0)==(N|0)){c[m>>2]=s;c[h>>2]=r;O=s;break}else{Ua()}}}while(0);do{if((f|0)!=0){s=c[N+28>>2]|0;k=12400+(s<<2)|0;if((N|0)==(c[k>>2]|0)){c[k>>2]=O;if((O|0)==0){c[12100>>2]=c[12100>>2]&~(1<<s);break}}else{if(f>>>0<(c[12112>>2]|0)>>>0){Ua()}s=f+16|0;if((c[s>>2]|0)==(N|0)){c[s>>2]=O}else{c[f+20>>2]=O}if((O|0)==0){break}}if(O>>>0<(c[12112>>2]|0)>>>0){Ua()}c[O+24>>2]=f;s=c[N+16>>2]|0;do{if((s|0)!=0){if(s>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[O+16>>2]=s;c[s+24>>2]=O;break}}}while(0);s=c[N+20>>2]|0;if((s|0)!=0){if(s>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[O+20>>2]=s;c[s+24>>2]=O;break}}}}while(0);b:do{if(!(M>>>0<16)){c[N+4>>2]=q|3;c[N+(q|4)>>2]=M|1;c[N+(M+q)>>2]=M;f=M>>>3;if(M>>>0<256){s=f<<1;k=12136+(s<<2)|0;r=c[3024]|0;h=1<<f;if((r&h|0)!=0){f=12136+(s+2<<2)|0;m=c[f>>2]|0;if(m>>>0<(c[12112>>2]|0)>>>0){Ua()}else{R=f;S=m}}else{c[3024]=r|h;R=12136+(s+2<<2)|0;S=k}c[R>>2]=e;c[S+12>>2]=e;c[N+(q+8)>>2]=S;c[N+(q+12)>>2]=k;break}k=M>>>8;if((k|0)!=0){if(M>>>0>16777215){T=31}else{s=(k+1048320|0)>>>16&8;h=k<<s;k=(h+520192|0)>>>16&4;r=h<<k;h=(r+245760|0)>>>16&2;m=14-(k|s|h)+(r<<h>>>15)|0;T=M>>>(m+7|0)&1|m<<1}}else{T=0}m=12400+(T<<2)|0;c[N+(q+28)>>2]=T;c[N+(q+20)>>2]=0;c[N+(q+16)>>2]=0;h=c[12100>>2]|0;r=1<<T;if((h&r|0)==0){c[12100>>2]=h|r;c[m>>2]=e;c[N+(q+24)>>2]=m;c[N+(q+12)>>2]=e;c[N+(q+8)>>2]=e;break}r=c[m>>2]|0;if((T|0)==31){U=0}else{U=25-(T>>>1)|0}c:do{if((c[r+4>>2]&-8|0)!=(M|0)){m=M<<U;h=r;while(1){V=h+(m>>>31<<2)+16|0;s=c[V>>2]|0;if((s|0)==0){break}if((c[s+4>>2]&-8|0)==(M|0)){W=s;break c}else{m=m<<1;h=s}}if(V>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[V>>2]=e;c[N+(q+24)>>2]=h;c[N+(q+12)>>2]=e;c[N+(q+8)>>2]=e;break b}}else{W=r}}while(0);r=W+8|0;m=c[r>>2]|0;s=c[12112>>2]|0;if(W>>>0<s>>>0){Ua()}if(m>>>0<s>>>0){Ua()}else{c[m+12>>2]=e;c[r>>2]=e;c[N+(q+8)>>2]=m;c[N+(q+12)>>2]=W;c[N+(q+24)>>2]=0;break}}else{m=M+q|0;c[N+4>>2]=m|3;r=N+(m+4)|0;c[r>>2]=c[r>>2]|1}}while(0);p=N+8|0;i=b;return p|0}else{B=q}}else{B=q}}else{B=-1}}}while(0);N=c[12104>>2]|0;if(!(B>>>0>N>>>0)){M=N-B|0;W=c[12116>>2]|0;if(M>>>0>15){c[12116>>2]=W+B;c[12104>>2]=M;c[W+(B+4)>>2]=M|1;c[W+N>>2]=M;c[W+4>>2]=B|3}else{c[12104>>2]=0;c[12116>>2]=0;c[W+4>>2]=N|3;M=W+(N+4)|0;c[M>>2]=c[M>>2]|1}p=W+8|0;i=b;return p|0}W=c[12108>>2]|0;if(B>>>0<W>>>0){M=W-B|0;c[12108>>2]=M;W=c[12120>>2]|0;c[12120>>2]=W+B;c[W+(B+4)>>2]=M|1;c[W+4>>2]=B|3;p=W+8|0;i=b;return p|0}do{if((c[3142]|0)==0){W=Ba(30)|0;if((W+ -1&W|0)==0){c[12576>>2]=W;c[12572>>2]=W;c[12580>>2]=-1;c[12584>>2]=-1;c[12588>>2]=0;c[12540>>2]=0;c[3142]=(nb(0)|0)&-16^1431655768;break}else{Ua()}}}while(0);W=B+48|0;M=c[12576>>2]|0;N=B+47|0;V=M+N|0;U=0-M|0;M=V&U;if(!(M>>>0>B>>>0)){p=0;i=b;return p|0}T=c[12536>>2]|0;if((T|0)!=0?(S=c[12528>>2]|0,R=S+M|0,R>>>0<=S>>>0|R>>>0>T>>>0):0){p=0;i=b;return p|0}d:do{if((c[12540>>2]&4|0)==0){T=c[12120>>2]|0;e:do{if((T|0)!=0){R=12544|0;while(1){S=c[R>>2]|0;if(!(S>>>0>T>>>0)?(X=R+4|0,(S+(c[X>>2]|0)|0)>>>0>T>>>0):0){break}S=c[R+8>>2]|0;if((S|0)==0){Y=182;break e}else{R=S}}if((R|0)!=0){S=V-(c[12108>>2]|0)&U;if(S>>>0<2147483647){O=ya(S|0)|0;P=(O|0)==((c[R>>2]|0)+(c[X>>2]|0)|0);Z=O;_=S;$=P?O:-1;aa=P?S:0;Y=191}else{ba=0}}else{Y=182}}else{Y=182}}while(0);do{if((Y|0)==182){T=ya(0)|0;if((T|0)!=(-1|0)){q=T;S=c[12572>>2]|0;P=S+ -1|0;if((P&q|0)==0){ca=M}else{ca=M-q+(P+q&0-S)|0}S=c[12528>>2]|0;q=S+ca|0;if(ca>>>0>B>>>0&ca>>>0<2147483647){P=c[12536>>2]|0;if((P|0)!=0?q>>>0<=S>>>0|q>>>0>P>>>0:0){ba=0;break}P=ya(ca|0)|0;q=(P|0)==(T|0);Z=P;_=ca;$=q?T:-1;aa=q?ca:0;Y=191}else{ba=0}}else{ba=0}}}while(0);f:do{if((Y|0)==191){q=0-_|0;if(($|0)!=(-1|0)){da=$;ea=aa;Y=202;break d}do{if((Z|0)!=(-1|0)&_>>>0<2147483647&_>>>0<W>>>0?(T=c[12576>>2]|0,P=N-_+T&0-T,P>>>0<2147483647):0){if((ya(P|0)|0)==(-1|0)){ya(q|0)|0;ba=aa;break f}else{fa=P+_|0;break}}else{fa=_}}while(0);if((Z|0)==(-1|0)){ba=aa}else{da=Z;ea=fa;Y=202;break d}}}while(0);c[12540>>2]=c[12540>>2]|4;ga=ba;Y=199}else{ga=0;Y=199}}while(0);if((((Y|0)==199?M>>>0<2147483647:0)?(ba=ya(M|0)|0,M=ya(0)|0,(M|0)!=(-1|0)&(ba|0)!=(-1|0)&ba>>>0<M>>>0):0)?(fa=M-ba|0,M=fa>>>0>(B+40|0)>>>0,M):0){da=ba;ea=M?fa:ga;Y=202}if((Y|0)==202){ga=(c[12528>>2]|0)+ea|0;c[12528>>2]=ga;if(ga>>>0>(c[12532>>2]|0)>>>0){c[12532>>2]=ga}ga=c[12120>>2]|0;g:do{if((ga|0)!=0){fa=12544|0;while(1){ha=c[fa>>2]|0;ia=fa+4|0;ja=c[ia>>2]|0;if((da|0)==(ha+ja|0)){Y=214;break}M=c[fa+8>>2]|0;if((M|0)==0){break}else{fa=M}}if(((Y|0)==214?(c[fa+12>>2]&8|0)==0:0)?ga>>>0>=ha>>>0&ga>>>0<da>>>0:0){c[ia>>2]=ja+ea;M=(c[12108>>2]|0)+ea|0;ba=ga+8|0;if((ba&7|0)==0){ka=0}else{ka=0-ba&7}ba=M-ka|0;c[12120>>2]=ga+ka;c[12108>>2]=ba;c[ga+(ka+4)>>2]=ba|1;c[ga+(M+4)>>2]=40;c[12124>>2]=c[12584>>2];break}if(da>>>0<(c[12112>>2]|0)>>>0){c[12112>>2]=da}M=da+ea|0;ba=12544|0;while(1){if((c[ba>>2]|0)==(M|0)){Y=224;break}Z=c[ba+8>>2]|0;if((Z|0)==0){break}else{ba=Z}}if((Y|0)==224?(c[ba+12>>2]&8|0)==0:0){c[ba>>2]=da;M=ba+4|0;c[M>>2]=(c[M>>2]|0)+ea;M=da+8|0;if((M&7|0)==0){la=0}else{la=0-M&7}M=da+(ea+8)|0;if((M&7|0)==0){ma=0}else{ma=0-M&7}M=da+(ma+ea)|0;fa=la+B|0;Z=da+fa|0;aa=M-(da+la)-B|0;c[da+(la+4)>>2]=B|3;h:do{if((M|0)!=(c[12120>>2]|0)){if((M|0)==(c[12116>>2]|0)){_=(c[12104>>2]|0)+aa|0;c[12104>>2]=_;c[12116>>2]=Z;c[da+(fa+4)>>2]=_|1;c[da+(_+fa)>>2]=_;break}_=ea+4|0;N=c[da+(_+ma)>>2]|0;if((N&3|0)==1){W=N&-8;$=N>>>3;do{if(!(N>>>0<256)){ca=c[da+((ma|24)+ea)>>2]|0;X=c[da+(ea+12+ma)>>2]|0;do{if((X|0)==(M|0)){U=ma|16;V=da+(_+U)|0;q=c[V>>2]|0;if((q|0)==0){R=da+(U+ea)|0;U=c[R>>2]|0;if((U|0)==0){na=0;break}else{oa=U;pa=R}}else{oa=q;pa=V}while(1){V=oa+20|0;q=c[V>>2]|0;if((q|0)!=0){oa=q;pa=V;continue}V=oa+16|0;q=c[V>>2]|0;if((q|0)==0){break}else{oa=q;pa=V}}if(pa>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[pa>>2]=0;na=oa;break}}else{V=c[da+((ma|8)+ea)>>2]|0;if(V>>>0<(c[12112>>2]|0)>>>0){Ua()}q=V+12|0;if((c[q>>2]|0)!=(M|0)){Ua()}R=X+8|0;if((c[R>>2]|0)==(M|0)){c[q>>2]=X;c[R>>2]=V;na=X;break}else{Ua()}}}while(0);if((ca|0)!=0){X=c[da+(ea+28+ma)>>2]|0;h=12400+(X<<2)|0;if((M|0)==(c[h>>2]|0)){c[h>>2]=na;if((na|0)==0){c[12100>>2]=c[12100>>2]&~(1<<X);break}}else{if(ca>>>0<(c[12112>>2]|0)>>>0){Ua()}X=ca+16|0;if((c[X>>2]|0)==(M|0)){c[X>>2]=na}else{c[ca+20>>2]=na}if((na|0)==0){break}}if(na>>>0<(c[12112>>2]|0)>>>0){Ua()}c[na+24>>2]=ca;X=ma|16;h=c[da+(X+ea)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[na+16>>2]=h;c[h+24>>2]=na;break}}}while(0);h=c[da+(_+X)>>2]|0;if((h|0)!=0){if(h>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[na+20>>2]=h;c[h+24>>2]=na;break}}}}else{h=c[da+((ma|8)+ea)>>2]|0;ca=c[da+(ea+12+ma)>>2]|0;V=12136+($<<1<<2)|0;if((h|0)!=(V|0)){if(h>>>0<(c[12112>>2]|0)>>>0){Ua()}if((c[h+12>>2]|0)!=(M|0)){Ua()}}if((ca|0)==(h|0)){c[3024]=c[3024]&~(1<<$);break}if((ca|0)!=(V|0)){if(ca>>>0<(c[12112>>2]|0)>>>0){Ua()}V=ca+8|0;if((c[V>>2]|0)==(M|0)){qa=V}else{Ua()}}else{qa=ca+8|0}c[h+12>>2]=ca;c[qa>>2]=h}}while(0);ra=da+((W|ma)+ea)|0;sa=W+aa|0}else{ra=M;sa=aa}$=ra+4|0;c[$>>2]=c[$>>2]&-2;c[da+(fa+4)>>2]=sa|1;c[da+(sa+fa)>>2]=sa;$=sa>>>3;if(sa>>>0<256){_=$<<1;N=12136+(_<<2)|0;h=c[3024]|0;ca=1<<$;if((h&ca|0)!=0){$=12136+(_+2<<2)|0;V=c[$>>2]|0;if(V>>>0<(c[12112>>2]|0)>>>0){Ua()}else{ta=$;ua=V}}else{c[3024]=h|ca;ta=12136+(_+2<<2)|0;ua=N}c[ta>>2]=Z;c[ua+12>>2]=Z;c[da+(fa+8)>>2]=ua;c[da+(fa+12)>>2]=N;break}N=sa>>>8;if((N|0)!=0){if(sa>>>0>16777215){va=31}else{_=(N+1048320|0)>>>16&8;ca=N<<_;N=(ca+520192|0)>>>16&4;h=ca<<N;ca=(h+245760|0)>>>16&2;V=14-(N|_|ca)+(h<<ca>>>15)|0;va=sa>>>(V+7|0)&1|V<<1}}else{va=0}V=12400+(va<<2)|0;c[da+(fa+28)>>2]=va;c[da+(fa+20)>>2]=0;c[da+(fa+16)>>2]=0;ca=c[12100>>2]|0;h=1<<va;if((ca&h|0)==0){c[12100>>2]=ca|h;c[V>>2]=Z;c[da+(fa+24)>>2]=V;c[da+(fa+12)>>2]=Z;c[da+(fa+8)>>2]=Z;break}h=c[V>>2]|0;if((va|0)==31){wa=0}else{wa=25-(va>>>1)|0}i:do{if((c[h+4>>2]&-8|0)!=(sa|0)){V=sa<<wa;ca=h;while(1){xa=ca+(V>>>31<<2)+16|0;_=c[xa>>2]|0;if((_|0)==0){break}if((c[_+4>>2]&-8|0)==(sa|0)){za=_;break i}else{V=V<<1;ca=_}}if(xa>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[xa>>2]=Z;c[da+(fa+24)>>2]=ca;c[da+(fa+12)>>2]=Z;c[da+(fa+8)>>2]=Z;break h}}else{za=h}}while(0);h=za+8|0;W=c[h>>2]|0;V=c[12112>>2]|0;if(za>>>0<V>>>0){Ua()}if(W>>>0<V>>>0){Ua()}else{c[W+12>>2]=Z;c[h>>2]=Z;c[da+(fa+8)>>2]=W;c[da+(fa+12)>>2]=za;c[da+(fa+24)>>2]=0;break}}else{W=(c[12108>>2]|0)+aa|0;c[12108>>2]=W;c[12120>>2]=Z;c[da+(fa+4)>>2]=W|1}}while(0);p=da+(la|8)|0;i=b;return p|0}fa=12544|0;while(1){Aa=c[fa>>2]|0;if(!(Aa>>>0>ga>>>0)?(Ca=c[fa+4>>2]|0,Da=Aa+Ca|0,Da>>>0>ga>>>0):0){break}fa=c[fa+8>>2]|0}fa=Aa+(Ca+ -39)|0;if((fa&7|0)==0){Ea=0}else{Ea=0-fa&7}fa=Aa+(Ca+ -47+Ea)|0;Z=fa>>>0<(ga+16|0)>>>0?ga:fa;fa=Z+8|0;aa=da+8|0;if((aa&7|0)==0){Fa=0}else{Fa=0-aa&7}aa=ea+ -40-Fa|0;c[12120>>2]=da+Fa;c[12108>>2]=aa;c[da+(Fa+4)>>2]=aa|1;c[da+(ea+ -36)>>2]=40;c[12124>>2]=c[12584>>2];c[Z+4>>2]=27;c[fa+0>>2]=c[12544>>2];c[fa+4>>2]=c[12548>>2];c[fa+8>>2]=c[12552>>2];c[fa+12>>2]=c[12556>>2];c[12544>>2]=da;c[12548>>2]=ea;c[12556>>2]=0;c[12552>>2]=fa;fa=Z+28|0;c[fa>>2]=7;if((Z+32|0)>>>0<Da>>>0){aa=fa;do{fa=aa;aa=aa+4|0;c[aa>>2]=7}while((fa+8|0)>>>0<Da>>>0)}if((Z|0)!=(ga|0)){aa=Z-ga|0;fa=ga+(aa+4)|0;c[fa>>2]=c[fa>>2]&-2;c[ga+4>>2]=aa|1;c[ga+aa>>2]=aa;fa=aa>>>3;if(aa>>>0<256){M=fa<<1;ba=12136+(M<<2)|0;W=c[3024]|0;h=1<<fa;if((W&h|0)!=0){fa=12136+(M+2<<2)|0;V=c[fa>>2]|0;if(V>>>0<(c[12112>>2]|0)>>>0){Ua()}else{Ga=fa;Ha=V}}else{c[3024]=W|h;Ga=12136+(M+2<<2)|0;Ha=ba}c[Ga>>2]=ga;c[Ha+12>>2]=ga;c[ga+8>>2]=Ha;c[ga+12>>2]=ba;break}ba=aa>>>8;if((ba|0)!=0){if(aa>>>0>16777215){Ia=31}else{M=(ba+1048320|0)>>>16&8;h=ba<<M;ba=(h+520192|0)>>>16&4;W=h<<ba;h=(W+245760|0)>>>16&2;V=14-(ba|M|h)+(W<<h>>>15)|0;Ia=aa>>>(V+7|0)&1|V<<1}}else{Ia=0}V=12400+(Ia<<2)|0;c[ga+28>>2]=Ia;c[ga+20>>2]=0;c[ga+16>>2]=0;h=c[12100>>2]|0;W=1<<Ia;if((h&W|0)==0){c[12100>>2]=h|W;c[V>>2]=ga;c[ga+24>>2]=V;c[ga+12>>2]=ga;c[ga+8>>2]=ga;break}W=c[V>>2]|0;if((Ia|0)==31){Ja=0}else{Ja=25-(Ia>>>1)|0}j:do{if((c[W+4>>2]&-8|0)!=(aa|0)){V=aa<<Ja;h=W;while(1){Ka=h+(V>>>31<<2)+16|0;M=c[Ka>>2]|0;if((M|0)==0){break}if((c[M+4>>2]&-8|0)==(aa|0)){La=M;break j}else{V=V<<1;h=M}}if(Ka>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[Ka>>2]=ga;c[ga+24>>2]=h;c[ga+12>>2]=ga;c[ga+8>>2]=ga;break g}}else{La=W}}while(0);W=La+8|0;aa=c[W>>2]|0;Z=c[12112>>2]|0;if(La>>>0<Z>>>0){Ua()}if(aa>>>0<Z>>>0){Ua()}else{c[aa+12>>2]=ga;c[W>>2]=ga;c[ga+8>>2]=aa;c[ga+12>>2]=La;c[ga+24>>2]=0;break}}}else{aa=c[12112>>2]|0;if((aa|0)==0|da>>>0<aa>>>0){c[12112>>2]=da}c[12544>>2]=da;c[12548>>2]=ea;c[12556>>2]=0;c[12132>>2]=c[3142];c[12128>>2]=-1;aa=0;do{W=aa<<1;Z=12136+(W<<2)|0;c[12136+(W+3<<2)>>2]=Z;c[12136+(W+2<<2)>>2]=Z;aa=aa+1|0}while((aa|0)!=32);aa=da+8|0;if((aa&7|0)==0){Ma=0}else{Ma=0-aa&7}aa=ea+ -40-Ma|0;c[12120>>2]=da+Ma;c[12108>>2]=aa;c[da+(Ma+4)>>2]=aa|1;c[da+(ea+ -36)>>2]=40;c[12124>>2]=c[12584>>2]}}while(0);ea=c[12108>>2]|0;if(ea>>>0>B>>>0){da=ea-B|0;c[12108>>2]=da;ea=c[12120>>2]|0;c[12120>>2]=ea+B;c[ea+(B+4)>>2]=da|1;c[ea+4>>2]=B|3;p=ea+8|0;i=b;return p|0}}c[(jc()|0)>>2]=12;p=0;i=b;return p|0}function Fm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=i;if((a|0)==0){i=b;return}d=a+ -8|0;e=c[12112>>2]|0;if(d>>>0<e>>>0){Ua()}f=c[a+ -4>>2]|0;g=f&3;if((g|0)==1){Ua()}h=f&-8;j=a+(h+ -8)|0;do{if((f&1|0)==0){k=c[d>>2]|0;if((g|0)==0){i=b;return}l=-8-k|0;m=a+l|0;n=k+h|0;if(m>>>0<e>>>0){Ua()}if((m|0)==(c[12116>>2]|0)){o=a+(h+ -4)|0;if((c[o>>2]&3|0)!=3){p=m;q=n;break}c[12104>>2]=n;c[o>>2]=c[o>>2]&-2;c[a+(l+4)>>2]=n|1;c[j>>2]=n;i=b;return}o=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;r=c[a+(l+12)>>2]|0;s=12136+(o<<1<<2)|0;if((k|0)!=(s|0)){if(k>>>0<e>>>0){Ua()}if((c[k+12>>2]|0)!=(m|0)){Ua()}}if((r|0)==(k|0)){c[3024]=c[3024]&~(1<<o);p=m;q=n;break}if((r|0)!=(s|0)){if(r>>>0<e>>>0){Ua()}s=r+8|0;if((c[s>>2]|0)==(m|0)){t=s}else{Ua()}}else{t=r+8|0}c[k+12>>2]=r;c[t>>2]=k;p=m;q=n;break}k=c[a+(l+24)>>2]|0;r=c[a+(l+12)>>2]|0;do{if((r|0)==(m|0)){s=a+(l+20)|0;o=c[s>>2]|0;if((o|0)==0){u=a+(l+16)|0;v=c[u>>2]|0;if((v|0)==0){w=0;break}else{x=v;y=u}}else{x=o;y=s}while(1){s=x+20|0;o=c[s>>2]|0;if((o|0)!=0){x=o;y=s;continue}s=x+16|0;o=c[s>>2]|0;if((o|0)==0){break}else{x=o;y=s}}if(y>>>0<e>>>0){Ua()}else{c[y>>2]=0;w=x;break}}else{s=c[a+(l+8)>>2]|0;if(s>>>0<e>>>0){Ua()}o=s+12|0;if((c[o>>2]|0)!=(m|0)){Ua()}u=r+8|0;if((c[u>>2]|0)==(m|0)){c[o>>2]=r;c[u>>2]=s;w=r;break}else{Ua()}}}while(0);if((k|0)!=0){r=c[a+(l+28)>>2]|0;s=12400+(r<<2)|0;if((m|0)==(c[s>>2]|0)){c[s>>2]=w;if((w|0)==0){c[12100>>2]=c[12100>>2]&~(1<<r);p=m;q=n;break}}else{if(k>>>0<(c[12112>>2]|0)>>>0){Ua()}r=k+16|0;if((c[r>>2]|0)==(m|0)){c[r>>2]=w}else{c[k+20>>2]=w}if((w|0)==0){p=m;q=n;break}}if(w>>>0<(c[12112>>2]|0)>>>0){Ua()}c[w+24>>2]=k;r=c[a+(l+16)>>2]|0;do{if((r|0)!=0){if(r>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[w+16>>2]=r;c[r+24>>2]=w;break}}}while(0);r=c[a+(l+20)>>2]|0;if((r|0)!=0){if(r>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[w+20>>2]=r;c[r+24>>2]=w;p=m;q=n;break}}else{p=m;q=n}}else{p=m;q=n}}else{p=d;q=h}}while(0);if(!(p>>>0<j>>>0)){Ua()}d=a+(h+ -4)|0;w=c[d>>2]|0;if((w&1|0)==0){Ua()}if((w&2|0)==0){if((j|0)==(c[12120>>2]|0)){e=(c[12108>>2]|0)+q|0;c[12108>>2]=e;c[12120>>2]=p;c[p+4>>2]=e|1;if((p|0)!=(c[12116>>2]|0)){i=b;return}c[12116>>2]=0;c[12104>>2]=0;i=b;return}if((j|0)==(c[12116>>2]|0)){e=(c[12104>>2]|0)+q|0;c[12104>>2]=e;c[12116>>2]=p;c[p+4>>2]=e|1;c[p+e>>2]=e;i=b;return}e=(w&-8)+q|0;x=w>>>3;do{if(!(w>>>0<256)){y=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(j|0)){g=a+(h+12)|0;f=c[g>>2]|0;if((f|0)==0){r=a+(h+8)|0;k=c[r>>2]|0;if((k|0)==0){z=0;break}else{A=k;B=r}}else{A=f;B=g}while(1){g=A+20|0;f=c[g>>2]|0;if((f|0)!=0){A=f;B=g;continue}g=A+16|0;f=c[g>>2]|0;if((f|0)==0){break}else{A=f;B=g}}if(B>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[B>>2]=0;z=A;break}}else{g=c[a+h>>2]|0;if(g>>>0<(c[12112>>2]|0)>>>0){Ua()}f=g+12|0;if((c[f>>2]|0)!=(j|0)){Ua()}r=t+8|0;if((c[r>>2]|0)==(j|0)){c[f>>2]=t;c[r>>2]=g;z=t;break}else{Ua()}}}while(0);if((y|0)!=0){t=c[a+(h+20)>>2]|0;n=12400+(t<<2)|0;if((j|0)==(c[n>>2]|0)){c[n>>2]=z;if((z|0)==0){c[12100>>2]=c[12100>>2]&~(1<<t);break}}else{if(y>>>0<(c[12112>>2]|0)>>>0){Ua()}t=y+16|0;if((c[t>>2]|0)==(j|0)){c[t>>2]=z}else{c[y+20>>2]=z}if((z|0)==0){break}}if(z>>>0<(c[12112>>2]|0)>>>0){Ua()}c[z+24>>2]=y;t=c[a+(h+8)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[z+16>>2]=t;c[t+24>>2]=z;break}}}while(0);t=c[a+(h+12)>>2]|0;if((t|0)!=0){if(t>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[z+20>>2]=t;c[t+24>>2]=z;break}}}}else{t=c[a+h>>2]|0;y=c[a+(h|4)>>2]|0;n=12136+(x<<1<<2)|0;if((t|0)!=(n|0)){if(t>>>0<(c[12112>>2]|0)>>>0){Ua()}if((c[t+12>>2]|0)!=(j|0)){Ua()}}if((y|0)==(t|0)){c[3024]=c[3024]&~(1<<x);break}if((y|0)!=(n|0)){if(y>>>0<(c[12112>>2]|0)>>>0){Ua()}n=y+8|0;if((c[n>>2]|0)==(j|0)){C=n}else{Ua()}}else{C=y+8|0}c[t+12>>2]=y;c[C>>2]=t}}while(0);c[p+4>>2]=e|1;c[p+e>>2]=e;if((p|0)==(c[12116>>2]|0)){c[12104>>2]=e;i=b;return}else{D=e}}else{c[d>>2]=w&-2;c[p+4>>2]=q|1;c[p+q>>2]=q;D=q}q=D>>>3;if(D>>>0<256){w=q<<1;d=12136+(w<<2)|0;e=c[3024]|0;C=1<<q;if((e&C|0)!=0){q=12136+(w+2<<2)|0;j=c[q>>2]|0;if(j>>>0<(c[12112>>2]|0)>>>0){Ua()}else{E=q;F=j}}else{c[3024]=e|C;E=12136+(w+2<<2)|0;F=d}c[E>>2]=p;c[F+12>>2]=p;c[p+8>>2]=F;c[p+12>>2]=d;i=b;return}d=D>>>8;if((d|0)!=0){if(D>>>0>16777215){G=31}else{F=(d+1048320|0)>>>16&8;E=d<<F;d=(E+520192|0)>>>16&4;w=E<<d;E=(w+245760|0)>>>16&2;C=14-(d|F|E)+(w<<E>>>15)|0;G=D>>>(C+7|0)&1|C<<1}}else{G=0}C=12400+(G<<2)|0;c[p+28>>2]=G;c[p+20>>2]=0;c[p+16>>2]=0;E=c[12100>>2]|0;w=1<<G;a:do{if((E&w|0)!=0){F=c[C>>2]|0;if((G|0)==31){H=0}else{H=25-(G>>>1)|0}b:do{if((c[F+4>>2]&-8|0)!=(D|0)){d=D<<H;e=F;while(1){I=e+(d>>>31<<2)+16|0;j=c[I>>2]|0;if((j|0)==0){break}if((c[j+4>>2]&-8|0)==(D|0)){J=j;break b}else{d=d<<1;e=j}}if(I>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[I>>2]=p;c[p+24>>2]=e;c[p+12>>2]=p;c[p+8>>2]=p;break a}}else{J=F}}while(0);F=J+8|0;d=c[F>>2]|0;j=c[12112>>2]|0;if(J>>>0<j>>>0){Ua()}if(d>>>0<j>>>0){Ua()}else{c[d+12>>2]=p;c[F>>2]=p;c[p+8>>2]=d;c[p+12>>2]=J;c[p+24>>2]=0;break}}else{c[12100>>2]=E|w;c[C>>2]=p;c[p+24>>2]=C;c[p+12>>2]=p;c[p+8>>2]=p}}while(0);p=(c[12128>>2]|0)+ -1|0;c[12128>>2]=p;if((p|0)==0){K=12552|0}else{i=b;return}while(1){p=c[K>>2]|0;if((p|0)==0){break}else{K=p+8|0}}c[12128>>2]=-1;i=b;return}function Gm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;do{if((a|0)!=0){if(b>>>0>4294967231){c[(jc()|0)>>2]=12;e=0;break}if(b>>>0<11){f=16}else{f=b+11&-8}g=Hm(a+ -8|0,f)|0;if((g|0)!=0){e=g+8|0;break}g=Em(b)|0;if((g|0)==0){e=0}else{h=c[a+ -4>>2]|0;j=(h&-8)-((h&3|0)==0?8:4)|0;an(g|0,a|0,(j>>>0<b>>>0?j:b)|0)|0;Fm(a);e=g}}else{e=Em(b)|0}}while(0);i=d;return e|0}function Hm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;e=a+4|0;f=c[e>>2]|0;g=f&-8;h=a+g|0;j=c[12112>>2]|0;if(a>>>0<j>>>0){Ua()}k=f&3;if(!((k|0)!=1&a>>>0<h>>>0)){Ua()}l=a+(g|4)|0;m=c[l>>2]|0;if((m&1|0)==0){Ua()}if((k|0)==0){if(b>>>0<256){n=0;i=d;return n|0}if(!(g>>>0<(b+4|0)>>>0)?!((g-b|0)>>>0>c[12576>>2]<<1>>>0):0){n=a;i=d;return n|0}n=0;i=d;return n|0}if(!(g>>>0<b>>>0)){k=g-b|0;if(!(k>>>0>15)){n=a;i=d;return n|0}c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;Im(a+b|0,k);n=a;i=d;return n|0}if((h|0)==(c[12120>>2]|0)){k=(c[12108>>2]|0)+g|0;if(!(k>>>0>b>>>0)){n=0;i=d;return n|0}l=k-b|0;c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=l|1;c[12120>>2]=a+b;c[12108>>2]=l;n=a;i=d;return n|0}if((h|0)==(c[12116>>2]|0)){l=(c[12104>>2]|0)+g|0;if(l>>>0<b>>>0){n=0;i=d;return n|0}k=l-b|0;if(k>>>0>15){c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=k|1;c[a+l>>2]=k;o=a+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=a+b|0;q=k}else{c[e>>2]=f&1|l|2;f=a+(l+4)|0;c[f>>2]=c[f>>2]|1;p=0;q=0}c[12104>>2]=q;c[12116>>2]=p;n=a;i=d;return n|0}if((m&2|0)!=0){n=0;i=d;return n|0}p=(m&-8)+g|0;if(p>>>0<b>>>0){n=0;i=d;return n|0}q=p-b|0;f=m>>>3;do{if(!(m>>>0<256)){l=c[a+(g+24)>>2]|0;k=c[a+(g+12)>>2]|0;do{if((k|0)==(h|0)){o=a+(g+20)|0;r=c[o>>2]|0;if((r|0)==0){s=a+(g+16)|0;t=c[s>>2]|0;if((t|0)==0){u=0;break}else{v=t;w=s}}else{v=r;w=o}while(1){o=v+20|0;r=c[o>>2]|0;if((r|0)!=0){v=r;w=o;continue}o=v+16|0;r=c[o>>2]|0;if((r|0)==0){break}else{v=r;w=o}}if(w>>>0<j>>>0){Ua()}else{c[w>>2]=0;u=v;break}}else{o=c[a+(g+8)>>2]|0;if(o>>>0<j>>>0){Ua()}r=o+12|0;if((c[r>>2]|0)!=(h|0)){Ua()}s=k+8|0;if((c[s>>2]|0)==(h|0)){c[r>>2]=k;c[s>>2]=o;u=k;break}else{Ua()}}}while(0);if((l|0)!=0){k=c[a+(g+28)>>2]|0;o=12400+(k<<2)|0;if((h|0)==(c[o>>2]|0)){c[o>>2]=u;if((u|0)==0){c[12100>>2]=c[12100>>2]&~(1<<k);break}}else{if(l>>>0<(c[12112>>2]|0)>>>0){Ua()}k=l+16|0;if((c[k>>2]|0)==(h|0)){c[k>>2]=u}else{c[l+20>>2]=u}if((u|0)==0){break}}if(u>>>0<(c[12112>>2]|0)>>>0){Ua()}c[u+24>>2]=l;k=c[a+(g+16)>>2]|0;do{if((k|0)!=0){if(k>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[u+16>>2]=k;c[k+24>>2]=u;break}}}while(0);k=c[a+(g+20)>>2]|0;if((k|0)!=0){if(k>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[u+20>>2]=k;c[k+24>>2]=u;break}}}}else{k=c[a+(g+8)>>2]|0;l=c[a+(g+12)>>2]|0;o=12136+(f<<1<<2)|0;if((k|0)!=(o|0)){if(k>>>0<j>>>0){Ua()}if((c[k+12>>2]|0)!=(h|0)){Ua()}}if((l|0)==(k|0)){c[3024]=c[3024]&~(1<<f);break}if((l|0)!=(o|0)){if(l>>>0<j>>>0){Ua()}o=l+8|0;if((c[o>>2]|0)==(h|0)){x=o}else{Ua()}}else{x=l+8|0}c[k+12>>2]=l;c[x>>2]=k}}while(0);if(q>>>0<16){c[e>>2]=p|c[e>>2]&1|2;x=a+(p|4)|0;c[x>>2]=c[x>>2]|1;n=a;i=d;return n|0}else{c[e>>2]=c[e>>2]&1|b|2;c[a+(b+4)>>2]=q|3;e=a+(p|4)|0;c[e>>2]=c[e>>2]|1;Im(a+b|0,q);n=a;i=d;return n|0}return 0}function Im(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;e=a+b|0;f=c[a+4>>2]|0;do{if((f&1|0)==0){g=c[a>>2]|0;if((f&3|0)==0){i=d;return}h=a+(0-g)|0;j=g+b|0;k=c[12112>>2]|0;if(h>>>0<k>>>0){Ua()}if((h|0)==(c[12116>>2]|0)){l=a+(b+4)|0;if((c[l>>2]&3|0)!=3){m=h;n=j;break}c[12104>>2]=j;c[l>>2]=c[l>>2]&-2;c[a+(4-g)>>2]=j|1;c[e>>2]=j;i=d;return}l=g>>>3;if(g>>>0<256){o=c[a+(8-g)>>2]|0;p=c[a+(12-g)>>2]|0;q=12136+(l<<1<<2)|0;if((o|0)!=(q|0)){if(o>>>0<k>>>0){Ua()}if((c[o+12>>2]|0)!=(h|0)){Ua()}}if((p|0)==(o|0)){c[3024]=c[3024]&~(1<<l);m=h;n=j;break}if((p|0)!=(q|0)){if(p>>>0<k>>>0){Ua()}q=p+8|0;if((c[q>>2]|0)==(h|0)){r=q}else{Ua()}}else{r=p+8|0}c[o+12>>2]=p;c[r>>2]=o;m=h;n=j;break}o=c[a+(24-g)>>2]|0;p=c[a+(12-g)>>2]|0;do{if((p|0)==(h|0)){q=16-g|0;l=a+(q+4)|0;s=c[l>>2]|0;if((s|0)==0){t=a+q|0;q=c[t>>2]|0;if((q|0)==0){u=0;break}else{v=q;w=t}}else{v=s;w=l}while(1){l=v+20|0;s=c[l>>2]|0;if((s|0)!=0){v=s;w=l;continue}l=v+16|0;s=c[l>>2]|0;if((s|0)==0){break}else{v=s;w=l}}if(w>>>0<k>>>0){Ua()}else{c[w>>2]=0;u=v;break}}else{l=c[a+(8-g)>>2]|0;if(l>>>0<k>>>0){Ua()}s=l+12|0;if((c[s>>2]|0)!=(h|0)){Ua()}t=p+8|0;if((c[t>>2]|0)==(h|0)){c[s>>2]=p;c[t>>2]=l;u=p;break}else{Ua()}}}while(0);if((o|0)!=0){p=c[a+(28-g)>>2]|0;k=12400+(p<<2)|0;if((h|0)==(c[k>>2]|0)){c[k>>2]=u;if((u|0)==0){c[12100>>2]=c[12100>>2]&~(1<<p);m=h;n=j;break}}else{if(o>>>0<(c[12112>>2]|0)>>>0){Ua()}p=o+16|0;if((c[p>>2]|0)==(h|0)){c[p>>2]=u}else{c[o+20>>2]=u}if((u|0)==0){m=h;n=j;break}}if(u>>>0<(c[12112>>2]|0)>>>0){Ua()}c[u+24>>2]=o;p=16-g|0;k=c[a+p>>2]|0;do{if((k|0)!=0){if(k>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[u+16>>2]=k;c[k+24>>2]=u;break}}}while(0);k=c[a+(p+4)>>2]|0;if((k|0)!=0){if(k>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[u+20>>2]=k;c[k+24>>2]=u;m=h;n=j;break}}else{m=h;n=j}}else{m=h;n=j}}else{m=a;n=b}}while(0);u=c[12112>>2]|0;if(e>>>0<u>>>0){Ua()}v=a+(b+4)|0;w=c[v>>2]|0;if((w&2|0)==0){if((e|0)==(c[12120>>2]|0)){r=(c[12108>>2]|0)+n|0;c[12108>>2]=r;c[12120>>2]=m;c[m+4>>2]=r|1;if((m|0)!=(c[12116>>2]|0)){i=d;return}c[12116>>2]=0;c[12104>>2]=0;i=d;return}if((e|0)==(c[12116>>2]|0)){r=(c[12104>>2]|0)+n|0;c[12104>>2]=r;c[12116>>2]=m;c[m+4>>2]=r|1;c[m+r>>2]=r;i=d;return}r=(w&-8)+n|0;f=w>>>3;do{if(!(w>>>0<256)){k=c[a+(b+24)>>2]|0;g=c[a+(b+12)>>2]|0;do{if((g|0)==(e|0)){o=a+(b+20)|0;l=c[o>>2]|0;if((l|0)==0){t=a+(b+16)|0;s=c[t>>2]|0;if((s|0)==0){x=0;break}else{y=s;z=t}}else{y=l;z=o}while(1){o=y+20|0;l=c[o>>2]|0;if((l|0)!=0){y=l;z=o;continue}o=y+16|0;l=c[o>>2]|0;if((l|0)==0){break}else{y=l;z=o}}if(z>>>0<u>>>0){Ua()}else{c[z>>2]=0;x=y;break}}else{o=c[a+(b+8)>>2]|0;if(o>>>0<u>>>0){Ua()}l=o+12|0;if((c[l>>2]|0)!=(e|0)){Ua()}t=g+8|0;if((c[t>>2]|0)==(e|0)){c[l>>2]=g;c[t>>2]=o;x=g;break}else{Ua()}}}while(0);if((k|0)!=0){g=c[a+(b+28)>>2]|0;j=12400+(g<<2)|0;if((e|0)==(c[j>>2]|0)){c[j>>2]=x;if((x|0)==0){c[12100>>2]=c[12100>>2]&~(1<<g);break}}else{if(k>>>0<(c[12112>>2]|0)>>>0){Ua()}g=k+16|0;if((c[g>>2]|0)==(e|0)){c[g>>2]=x}else{c[k+20>>2]=x}if((x|0)==0){break}}if(x>>>0<(c[12112>>2]|0)>>>0){Ua()}c[x+24>>2]=k;g=c[a+(b+16)>>2]|0;do{if((g|0)!=0){if(g>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[x+16>>2]=g;c[g+24>>2]=x;break}}}while(0);g=c[a+(b+20)>>2]|0;if((g|0)!=0){if(g>>>0<(c[12112>>2]|0)>>>0){Ua()}else{c[x+20>>2]=g;c[g+24>>2]=x;break}}}}else{g=c[a+(b+8)>>2]|0;k=c[a+(b+12)>>2]|0;j=12136+(f<<1<<2)|0;if((g|0)!=(j|0)){if(g>>>0<u>>>0){Ua()}if((c[g+12>>2]|0)!=(e|0)){Ua()}}if((k|0)==(g|0)){c[3024]=c[3024]&~(1<<f);break}if((k|0)!=(j|0)){if(k>>>0<u>>>0){Ua()}j=k+8|0;if((c[j>>2]|0)==(e|0)){A=j}else{Ua()}}else{A=k+8|0}c[g+12>>2]=k;c[A>>2]=g}}while(0);c[m+4>>2]=r|1;c[m+r>>2]=r;if((m|0)==(c[12116>>2]|0)){c[12104>>2]=r;i=d;return}else{B=r}}else{c[v>>2]=w&-2;c[m+4>>2]=n|1;c[m+n>>2]=n;B=n}n=B>>>3;if(B>>>0<256){w=n<<1;v=12136+(w<<2)|0;r=c[3024]|0;A=1<<n;if((r&A|0)!=0){n=12136+(w+2<<2)|0;e=c[n>>2]|0;if(e>>>0<(c[12112>>2]|0)>>>0){Ua()}else{C=n;D=e}}else{c[3024]=r|A;C=12136+(w+2<<2)|0;D=v}c[C>>2]=m;c[D+12>>2]=m;c[m+8>>2]=D;c[m+12>>2]=v;i=d;return}v=B>>>8;if((v|0)!=0){if(B>>>0>16777215){E=31}else{D=(v+1048320|0)>>>16&8;C=v<<D;v=(C+520192|0)>>>16&4;w=C<<v;C=(w+245760|0)>>>16&2;A=14-(v|D|C)+(w<<C>>>15)|0;E=B>>>(A+7|0)&1|A<<1}}else{E=0}A=12400+(E<<2)|0;c[m+28>>2]=E;c[m+20>>2]=0;c[m+16>>2]=0;C=c[12100>>2]|0;w=1<<E;if((C&w|0)==0){c[12100>>2]=C|w;c[A>>2]=m;c[m+24>>2]=A;c[m+12>>2]=m;c[m+8>>2]=m;i=d;return}w=c[A>>2]|0;if((E|0)==31){F=0}else{F=25-(E>>>1)|0}a:do{if((c[w+4>>2]&-8|0)==(B|0)){G=w}else{E=B<<F;A=w;while(1){H=A+(E>>>31<<2)+16|0;C=c[H>>2]|0;if((C|0)==0){break}if((c[C+4>>2]&-8|0)==(B|0)){G=C;break a}else{E=E<<1;A=C}}if(H>>>0<(c[12112>>2]|0)>>>0){Ua()}c[H>>2]=m;c[m+24>>2]=A;c[m+12>>2]=m;c[m+8>>2]=m;i=d;return}}while(0);H=G+8|0;B=c[H>>2]|0;w=c[12112>>2]|0;if(G>>>0<w>>>0){Ua()}if(B>>>0<w>>>0){Ua()}c[B+12>>2]=m;c[H>>2]=m;c[m+8>>2]=B;c[m+12>>2]=G;c[m+24>>2]=0;i=d;return}function Jm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0,Q=0.0,R=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0.0,ba=0,ca=0.0,ea=0,fa=0.0,ga=0,ha=0.0,ia=0,ja=0.0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0.0,sa=0,ta=0.0,ua=0,va=0,wa=0,xa=0,ya=0.0,za=0,Aa=0.0,Ba=0.0,Ca=0,Da=0.0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Ob=0,Pb=0,Qb=0,Rb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0.0,rc=0,sc=0,tc=0.0,uc=0.0,vc=0.0,wc=0.0,xc=0.0,yc=0.0,zc=0,Ac=0,Bc=0.0,Cc=0,Dc=0.0,Ec=0,Fc=0,Gc=0,Hc=0;g=i;i=i+512|0;h=g;if((e|0)==0){j=24;k=-149}else if((e|0)==1){j=53;k=-1074}else if((e|0)==2){j=53;k=-1074}else{l=0.0;i=g;return+l}e=b+4|0;m=b+100|0;do{n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;o=d[n]|0}else{o=Mm(b)|0}}while((Sb(o|0)|0)!=0);do{if((o|0)==43|(o|0)==45){n=1-(((o|0)==45)<<1)|0;p=c[e>>2]|0;if(p>>>0<(c[m>>2]|0)>>>0){c[e>>2]=p+1;q=d[p]|0;r=n;break}else{q=Mm(b)|0;r=n;break}}else{q=o;r=1}}while(0);o=q;q=0;while(1){if((o|32|0)!=(a[12592+q|0]|0)){s=o;t=q;break}do{if(q>>>0<7){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;u=d[n]|0;break}else{u=Mm(b)|0;break}}else{u=o}}while(0);n=q+1|0;if(n>>>0<8){o=u;q=n}else{s=u;t=n;break}}do{if((t|0)==3){v=23}else if((t|0)!=8){u=(f|0)==0;if(!(t>>>0<4|u)){if((t|0)==8){break}else{v=23;break}}a:do{if((t|0)==0){q=s;o=0;while(1){if((q|32|0)!=(a[12608+o|0]|0)){y=q;z=o;break a}do{if(o>>>0<2){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;A=d[n]|0;break}else{A=Mm(b)|0;break}}else{A=q}}while(0);n=o+1|0;if(n>>>0<3){q=A;o=n}else{y=A;z=n;break}}}else{y=s;z=t}}while(0);if((z|0)==0){do{if((y|0)==48){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;B=d[o]|0}else{B=Mm(b)|0}if((B|32|0)!=120){if((c[m>>2]|0)==0){C=48;break}c[e>>2]=(c[e>>2]|0)+ -1;C=48;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;E=0}else{D=Mm(b)|0;E=0}while(1){if((D|0)==46){v=70;break}else if((D|0)!=48){F=0;G=0;I=0;J=0;K=D;L=E;M=0;N=0;O=1.0;P=0;Q=0.0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;E=1;continue}else{D=Mm(b)|0;E=1;continue}}b:do{if((v|0)==70){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;R=d[o]|0}else{R=Mm(b)|0}if((R|0)==48){o=-1;q=-1;while(1){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;T=d[n]|0}else{T=Mm(b)|0}if((T|0)!=48){F=0;G=0;I=o;J=q;K=T;L=1;M=1;N=0;O=1.0;P=0;Q=0.0;break b}n=Ym(o|0,q|0,-1,-1)|0;o=n;q=H}}else{F=0;G=0;I=0;J=0;K=R;L=E;M=1;N=0;O=1.0;P=0;Q=0.0}}}while(0);c:while(1){q=K+ -48|0;do{if(!(q>>>0<10)){o=K|32;n=(K|0)==46;if(!((o+ -97|0)>>>0<6|n)){U=K;break c}if(n){if((M|0)==0){V=G;W=F;X=G;Y=F;Z=L;_=1;$=N;aa=O;ba=P;ca=Q;break}else{U=46;break c}}else{ea=(K|0)>57?o+ -87|0:q;v=84;break}}else{ea=q;v=84}}while(0);if((v|0)==84){v=0;do{if(!((F|0)<0|(F|0)==0&G>>>0<8)){if((F|0)<0|(F|0)==0&G>>>0<14){fa=O*.0625;ga=N;ha=fa;ia=P;ja=Q+fa*+(ea|0);break}if((ea|0)!=0&(N|0)==0){ga=1;ha=O;ia=P;ja=Q+O*.5}else{ga=N;ha=O;ia=P;ja=Q}}else{ga=N;ha=O;ia=ea+(P<<4)|0;ja=Q}}while(0);q=Ym(G|0,F|0,1,0)|0;V=I;W=J;X=q;Y=H;Z=1;_=M;$=ga;aa=ha;ba=ia;ca=ja}q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;F=Y;G=X;I=V;J=W;K=d[q]|0;L=Z;M=_;N=$;O=aa;P=ba;Q=ca;continue}else{F=Y;G=X;I=V;J=W;K=Mm(b)|0;L=Z;M=_;N=$;O=aa;P=ba;Q=ca;continue}}if((L|0)==0){q=(c[m>>2]|0)==0;if(!q){c[e>>2]=(c[e>>2]|0)+ -1}if(!u){if(!q?(q=c[e>>2]|0,c[e>>2]=q+ -1,(M|0)!=0):0){c[e>>2]=q+ -2}}else{Lm(b,0)}l=+(r|0)*0.0;i=g;return+l}q=(M|0)==0;o=q?G:I;n=q?F:J;if((F|0)<0|(F|0)==0&G>>>0<8){q=G;p=F;ka=P;while(1){la=ka<<4;ma=Ym(q|0,p|0,1,0)|0;na=H;if((na|0)<0|(na|0)==0&ma>>>0<8){q=ma;p=na;ka=la}else{oa=la;break}}}else{oa=P}do{if((U|32|0)==112){ka=Km(b,f)|0;p=H;if((ka|0)==0&(p|0)==-2147483648){if(u){Lm(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){pa=0;qa=0;break}c[e>>2]=(c[e>>2]|0)+ -1;pa=0;qa=0;break}}else{pa=ka;qa=p}}else{if((c[m>>2]|0)==0){pa=0;qa=0}else{c[e>>2]=(c[e>>2]|0)+ -1;pa=0;qa=0}}}while(0);p=cn(o|0,n|0,2)|0;ka=Ym(p|0,H|0,-32,-1)|0;p=Ym(ka|0,H|0,pa|0,qa|0)|0;ka=H;if((oa|0)==0){l=+(r|0)*0.0;i=g;return+l}if((ka|0)>0|(ka|0)==0&p>>>0>(0-k|0)>>>0){c[(jc()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}q=k+ -106|0;la=((q|0)<0)<<31>>31;if((ka|0)<(la|0)|(ka|0)==(la|0)&p>>>0<q>>>0){c[(jc()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((oa|0)>-1){q=p;la=ka;na=oa;fa=Q;while(1){ma=na<<1;if(!(fa>=.5)){ra=fa;sa=ma}else{ra=fa+-1.0;sa=ma|1}ta=fa+ra;ma=Ym(q|0,la|0,-1,-1)|0;ua=H;if((sa|0)>-1){q=ma;la=ua;na=sa;fa=ta}else{va=ma;wa=ua;xa=sa;ya=ta;break}}}else{va=p;wa=ka;xa=oa;ya=Q}na=Xm(32,0,k|0,((k|0)<0)<<31>>31|0)|0;la=Ym(va|0,wa|0,na|0,H|0)|0;na=H;if(0>(na|0)|0==(na|0)&j>>>0>la>>>0){za=(la|0)<0?0:la}else{za=j}if((za|0)<53){fa=+(r|0);ta=+Nb(+(+Nm(1.0,84-za|0)),+fa);if((za|0)<32&ya!=0.0){la=xa&1;Aa=fa;Ba=ta;Ca=(la^1)+xa|0;Da=(la|0)==0?0.0:ya}else{Aa=fa;Ba=ta;Ca=xa;Da=ya}}else{Aa=+(r|0);Ba=0.0;Ca=xa;Da=ya}ta=Aa*Da+(Ba+Aa*+(Ca>>>0))-Ba;if(!(ta!=0.0)){c[(jc()|0)>>2]=34}l=+Om(ta,va);i=g;return+l}else{C=y}}while(0);la=k+j|0;na=0-la|0;q=C;n=0;while(1){if((q|0)==46){v=139;break}else if((q|0)!=48){Ea=q;Fa=0;Ga=0;Ha=n;Ia=0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;q=d[o]|0;n=1;continue}else{q=Mm(b)|0;n=1;continue}}d:do{if((v|0)==139){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;Ja=d[q]|0}else{Ja=Mm(b)|0}if((Ja|0)==48){q=-1;o=-1;while(1){ua=c[e>>2]|0;if(ua>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ua+1;Ka=d[ua]|0}else{Ka=Mm(b)|0}if((Ka|0)!=48){Ea=Ka;Fa=q;Ga=o;Ha=1;Ia=1;break d}ua=Ym(q|0,o|0,-1,-1)|0;q=ua;o=H}}else{Ea=Ja;Fa=0;Ga=0;Ha=n;Ia=1}}}while(0);c[h>>2]=0;n=Ea+ -48|0;o=(Ea|0)==46;e:do{if(n>>>0<10|o){q=h+496|0;ka=Ea;p=0;ua=0;ma=o;La=n;Ma=Fa;Na=Ga;Oa=Ha;Pa=Ia;Qa=0;Ra=0;Sa=0;while(1){do{if(ma){if((Pa|0)==0){Ta=p;Ua=ua;Va=p;Wa=ua;Xa=Oa;Ya=1;Za=Qa;_a=Ra;$a=Sa}else{ab=ka;bb=Ma;cb=Na;db=p;eb=ua;fb=Oa;gb=Qa;hb=Ra;ib=Sa;break e}}else{jb=Ym(p|0,ua|0,1,0)|0;kb=H;lb=(ka|0)!=48;if((Ra|0)>=125){if(!lb){Ta=Ma;Ua=Na;Va=jb;Wa=kb;Xa=Oa;Ya=Pa;Za=Qa;_a=Ra;$a=Sa;break}c[q>>2]=c[q>>2]|1;Ta=Ma;Ua=Na;Va=jb;Wa=kb;Xa=Oa;Ya=Pa;Za=Qa;_a=Ra;$a=Sa;break}mb=h+(Ra<<2)|0;if((Qa|0)==0){nb=La}else{nb=ka+ -48+((c[mb>>2]|0)*10|0)|0}c[mb>>2]=nb;mb=Qa+1|0;ob=(mb|0)==9;Ta=Ma;Ua=Na;Va=jb;Wa=kb;Xa=1;Ya=Pa;Za=ob?0:mb;_a=(ob&1)+Ra|0;$a=lb?jb:Sa}}while(0);jb=c[e>>2]|0;if(jb>>>0<(c[m>>2]|0)>>>0){c[e>>2]=jb+1;pb=d[jb]|0}else{pb=Mm(b)|0}jb=pb+ -48|0;lb=(pb|0)==46;if(jb>>>0<10|lb){ka=pb;p=Va;ua=Wa;ma=lb;La=jb;Ma=Ta;Na=Ua;Oa=Xa;Pa=Ya;Qa=Za;Ra=_a;Sa=$a}else{qb=pb;rb=Ta;sb=Va;ub=Ua;vb=Wa;wb=Xa;xb=Ya;yb=Za;zb=_a;Ab=$a;v=162;break}}}else{qb=Ea;rb=Fa;sb=0;ub=Ga;vb=0;wb=Ha;xb=Ia;yb=0;zb=0;Ab=0;v=162}}while(0);if((v|0)==162){n=(xb|0)==0;ab=qb;bb=n?sb:rb;cb=n?vb:ub;db=sb;eb=vb;fb=wb;gb=yb;hb=zb;ib=Ab}n=(fb|0)!=0;if(n?(ab|32|0)==101:0){o=Km(b,f)|0;Sa=H;do{if((o|0)==0&(Sa|0)==-2147483648){if(u){Lm(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){Bb=0;Cb=0;break}c[e>>2]=(c[e>>2]|0)+ -1;Bb=0;Cb=0;break}}else{Bb=o;Cb=Sa}}while(0);Sa=Ym(Bb|0,Cb|0,bb|0,cb|0)|0;Db=Sa;Eb=H}else{if((ab|0)>-1?(c[m>>2]|0)!=0:0){c[e>>2]=(c[e>>2]|0)+ -1;Db=bb;Eb=cb}else{Db=bb;Eb=cb}}if(!n){c[(jc()|0)>>2]=22;Lm(b,0);l=0.0;i=g;return+l}Sa=c[h>>2]|0;if((Sa|0)==0){l=+(r|0)*0.0;i=g;return+l}do{if((Db|0)==(db|0)&(Eb|0)==(eb|0)&((eb|0)<0|(eb|0)==0&db>>>0<10)){if(!(j>>>0>30)?(Sa>>>j|0)!=0:0){break}l=+(r|0)*+(Sa>>>0);i=g;return+l}}while(0);Sa=(k|0)/-2|0;n=((Sa|0)<0)<<31>>31;if((Eb|0)>(n|0)|(Eb|0)==(n|0)&Db>>>0>Sa>>>0){c[(jc()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}Sa=k+ -106|0;n=((Sa|0)<0)<<31>>31;if((Eb|0)<(n|0)|(Eb|0)==(n|0)&Db>>>0<Sa>>>0){c[(jc()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((gb|0)==0){Fb=hb}else{if((gb|0)<9){Sa=h+(hb<<2)|0;n=c[Sa>>2]|0;o=gb;do{n=n*10|0;o=o+1|0}while((o|0)!=9);c[Sa>>2]=n}Fb=hb+1|0}do{if((ib|0)<9?(ib|0)<=(Db|0)&(Db|0)<18:0){if((Db|0)==9){l=+(r|0)*+((c[h>>2]|0)>>>0);i=g;return+l}if((Db|0)<9){l=+(r|0)*+((c[h>>2]|0)>>>0)/+(c[12624+(8-Db<<2)>>2]|0);i=g;return+l}o=j+27+(da(Db,-3)|0)|0;Ra=c[h>>2]|0;if((o|0)<=30?(Ra>>>o|0)!=0:0){break}l=+(r|0)*+(Ra>>>0)*+(c[12624+(Db+ -10<<2)>>2]|0);i=g;return+l}}while(0);n=(Db|0)%9|0;if((n|0)==0){Gb=0;Hb=0;Ib=Db;Jb=Fb}else{Sa=(Db|0)>-1?n:n+9|0;n=c[12624+(8-Sa<<2)>>2]|0;if((Fb|0)!=0){Ra=1e9/(n|0)|0;o=0;Qa=0;Pa=0;Oa=Db;while(1){Na=h+(Pa<<2)|0;Ma=c[Na>>2]|0;La=((Ma>>>0)/(n>>>0)|0)+Qa|0;c[Na>>2]=La;Qa=da((Ma>>>0)%(n>>>0)|0,Ra)|0;Ma=Pa;Pa=Pa+1|0;if((Ma|0)==(o|0)&(La|0)==0){Kb=Pa&127;Lb=Oa+ -9|0}else{Kb=o;Lb=Oa}if((Pa|0)==(Fb|0)){break}else{o=Kb;Oa=Lb}}if((Qa|0)==0){Mb=Kb;Ob=Lb;Pb=Fb}else{c[h+(Fb<<2)>>2]=Qa;Mb=Kb;Ob=Lb;Pb=Fb+1|0}}else{Mb=0;Ob=Db;Pb=0}Gb=Mb;Hb=0;Ib=9-Sa+Ob|0;Jb=Pb}f:while(1){Oa=h+(Gb<<2)|0;if((Ib|0)<18){o=Hb;Pa=Jb;while(1){Ra=0;n=Pa+127|0;La=Pa;while(1){Ma=n&127;Na=h+(Ma<<2)|0;ma=cn(c[Na>>2]|0,0,29)|0;ua=Ym(ma|0,H|0,Ra|0,0)|0;ma=H;if(ma>>>0>0|(ma|0)==0&ua>>>0>1e9){p=nn(ua|0,ma|0,1e9,0)|0;ka=on(ua|0,ma|0,1e9,0)|0;Qb=ka;Rb=p}else{Qb=ua;Rb=0}c[Na>>2]=Qb;Na=(Ma|0)==(Gb|0);if((Ma|0)!=(La+127&127|0)|Na){Tb=La}else{Tb=(Qb|0)==0?Ma:La}if(Na){break}else{Ra=Rb;n=Ma+ -1|0;La=Tb}}La=o+ -29|0;if((Rb|0)==0){o=La;Pa=Tb}else{Ub=La;Vb=Rb;Wb=Tb;break}}}else{if((Ib|0)==18){Xb=Hb;Yb=Jb}else{Zb=Gb;_b=Hb;$b=Ib;ac=Jb;break}while(1){if(!((c[Oa>>2]|0)>>>0<9007199)){Zb=Gb;_b=Xb;$b=18;ac=Yb;break f}Pa=0;o=Yb+127|0;La=Yb;while(1){n=o&127;Ra=h+(n<<2)|0;Ma=cn(c[Ra>>2]|0,0,29)|0;Na=Ym(Ma|0,H|0,Pa|0,0)|0;Ma=H;if(Ma>>>0>0|(Ma|0)==0&Na>>>0>1e9){ua=nn(Na|0,Ma|0,1e9,0)|0;p=on(Na|0,Ma|0,1e9,0)|0;bc=p;cc=ua}else{bc=Na;cc=0}c[Ra>>2]=bc;Ra=(n|0)==(Gb|0);if((n|0)!=(La+127&127|0)|Ra){dc=La}else{dc=(bc|0)==0?n:La}if(Ra){break}else{Pa=cc;o=n+ -1|0;La=dc}}La=Xb+ -29|0;if((cc|0)==0){Xb=La;Yb=dc}else{Ub=La;Vb=cc;Wb=dc;break}}}Oa=Gb+127&127;if((Oa|0)==(Wb|0)){La=Wb+127&127;o=h+((Wb+126&127)<<2)|0;c[o>>2]=c[o>>2]|c[h+(La<<2)>>2];ec=La}else{ec=Wb}c[h+(Oa<<2)>>2]=Vb;Gb=Oa;Hb=Ub;Ib=Ib+9|0;Jb=ec}g:while(1){fc=ac+1&127;Sa=h+((ac+127&127)<<2)|0;Qa=Zb;Oa=_b;La=$b;while(1){o=(La|0)==18;Pa=(La|0)>27?9:1;gc=Qa;hc=Oa;while(1){n=0;while(1){Ra=n+gc&127;if((Ra|0)==(ac|0)){ic=2;break}Na=c[h+(Ra<<2)>>2]|0;Ra=c[12616+(n<<2)>>2]|0;if(Na>>>0<Ra>>>0){ic=2;break}ua=n+1|0;if(Na>>>0>Ra>>>0){ic=n;break}if((ua|0)<2){n=ua}else{ic=ua;break}}if((ic|0)==2&o){break g}kc=Pa+hc|0;if((gc|0)==(ac|0)){gc=ac;hc=kc}else{break}}o=(1<<Pa)+ -1|0;n=1e9>>>Pa;lc=gc;mc=0;ua=gc;nc=La;do{Ra=h+(ua<<2)|0;Na=c[Ra>>2]|0;p=(Na>>>Pa)+mc|0;c[Ra>>2]=p;mc=da(Na&o,n)|0;Na=(ua|0)==(lc|0)&(p|0)==0;ua=ua+1&127;nc=Na?nc+ -9|0:nc;lc=Na?ua:lc}while((ua|0)!=(ac|0));if((mc|0)==0){Qa=lc;Oa=kc;La=nc;continue}if((fc|0)!=(lc|0)){break}c[Sa>>2]=c[Sa>>2]|1;Qa=lc;Oa=kc;La=nc}c[h+(ac<<2)>>2]=mc;Zb=lc;_b=kc;$b=nc;ac=fc}La=gc&127;if((La|0)==(ac|0)){c[h+(fc+ -1<<2)>>2]=0;oc=fc}else{oc=ac}ta=+((c[h+(La<<2)>>2]|0)>>>0);La=gc+1&127;if((La|0)==(oc|0)){Oa=oc+1&127;c[h+(Oa+ -1<<2)>>2]=0;pc=Oa}else{pc=oc}fa=+(r|0);qc=fa*(ta*1.0e9+ +((c[h+(La<<2)>>2]|0)>>>0));La=hc+53|0;Oa=La-k|0;if((Oa|0)<(j|0)){rc=(Oa|0)<0?0:Oa;sc=1}else{rc=j;sc=0}if((rc|0)<53){ta=+Nb(+(+Nm(1.0,105-rc|0)),+qc);tc=+tb(+qc,+(+Nm(1.0,53-rc|0)));uc=ta;vc=tc;wc=ta+(qc-tc)}else{uc=0.0;vc=0.0;wc=qc}Qa=gc+2&127;if((Qa|0)!=(pc|0)){Sa=c[h+(Qa<<2)>>2]|0;do{if(!(Sa>>>0<5e8)){if(Sa>>>0>5e8){xc=fa*.75+vc;break}if((gc+3&127|0)==(pc|0)){xc=fa*.5+vc;break}else{xc=fa*.75+vc;break}}else{if((Sa|0)==0?(gc+3&127|0)==(pc|0):0){xc=vc;break}xc=fa*.25+vc}}while(0);if((53-rc|0)>1?!(+tb(+xc,1.0)!=0.0):0){yc=xc+1.0}else{yc=xc}}else{yc=vc}fa=wc+yc-uc;do{if((La&2147483647|0)>(-2-la|0)){if(!(+S(+fa)>=9007199254740992.0)){zc=sc;Ac=hc;Bc=fa}else{zc=(sc|0)!=0&(rc|0)==(Oa|0)?0:sc;Ac=hc+1|0;Bc=fa*.5}if((Ac+50|0)<=(na|0)?!((zc|0)!=0&yc!=0.0):0){Cc=Ac;Dc=Bc;break}c[(jc()|0)>>2]=34;Cc=Ac;Dc=Bc}else{Cc=hc;Dc=fa}}while(0);l=+Om(Dc,Cc);i=g;return+l}else if((z|0)==3){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;Ec=d[na]|0}else{Ec=Mm(b)|0}if((Ec|0)==40){Fc=1}else{if((c[m>>2]|0)==0){l=w;i=g;return+l}c[e>>2]=(c[e>>2]|0)+ -1;l=w;i=g;return+l}while(1){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;Gc=d[na]|0}else{Gc=Mm(b)|0}if(!((Gc+ -48|0)>>>0<10|(Gc+ -65|0)>>>0<26)?!((Gc+ -97|0)>>>0<26|(Gc|0)==95):0){break}Fc=Fc+1|0}if((Gc|0)==41){l=w;i=g;return+l}na=(c[m>>2]|0)==0;if(!na){c[e>>2]=(c[e>>2]|0)+ -1}if(u){c[(jc()|0)>>2]=22;Lm(b,0);l=0.0;i=g;return+l}if((Fc|0)==0|na){l=w;i=g;return+l}else{Hc=Fc}while(1){na=Hc+ -1|0;c[e>>2]=(c[e>>2]|0)+ -1;if((na|0)==0){l=w;break}else{Hc=na}}i=g;return+l}else{if((c[m>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)+ -1}c[(jc()|0)>>2]=22;Lm(b,0);l=0.0;i=g;return+l}}}while(0);if((v|0)==23){v=(c[m>>2]|0)==0;if(!v){c[e>>2]=(c[e>>2]|0)+ -1}if(!(t>>>0<4|(f|0)==0|v)){v=t;do{c[e>>2]=(c[e>>2]|0)+ -1;v=v+ -1|0}while(v>>>0>3)}}l=+(r|0)*x;i=g;return+l}function Km(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;f=a+4|0;g=c[f>>2]|0;h=a+100|0;if(g>>>0<(c[h>>2]|0)>>>0){c[f>>2]=g+1;j=d[g]|0}else{j=Mm(a)|0}if((j|0)==43|(j|0)==45){g=(j|0)==45|0;k=c[f>>2]|0;if(k>>>0<(c[h>>2]|0)>>>0){c[f>>2]=k+1;l=d[k]|0}else{l=Mm(a)|0}if(!((l+ -48|0)>>>0<10|(b|0)==0)?(c[h>>2]|0)!=0:0){c[f>>2]=(c[f>>2]|0)+ -1;m=l;n=g}else{m=l;n=g}}else{m=j;n=0}if((m+ -48|0)>>>0>9){if((c[h>>2]|0)==0){o=-2147483648;p=0;H=o;i=e;return p|0}c[f>>2]=(c[f>>2]|0)+ -1;o=-2147483648;p=0;H=o;i=e;return p|0}else{q=m;r=0}while(1){s=q+ -48+r|0;m=c[f>>2]|0;if(m>>>0<(c[h>>2]|0)>>>0){c[f>>2]=m+1;t=d[m]|0}else{t=Mm(a)|0}if(!((t+ -48|0)>>>0<10&(s|0)<214748364)){break}q=t;r=s*10|0}r=((s|0)<0)<<31>>31;if((t+ -48|0)>>>0<10){q=s;m=r;j=t;while(1){g=mn(q|0,m|0,10,0)|0;l=H;b=Ym(j|0,((j|0)<0)<<31>>31|0,-48,-1)|0;k=Ym(b|0,H|0,g|0,l|0)|0;l=H;g=c[f>>2]|0;if(g>>>0<(c[h>>2]|0)>>>0){c[f>>2]=g+1;u=d[g]|0}else{u=Mm(a)|0}if((u+ -48|0)>>>0<10&((l|0)<21474836|(l|0)==21474836&k>>>0<2061584302)){q=k;m=l;j=u}else{v=k;w=l;x=u;break}}}else{v=s;w=r;x=t}if((x+ -48|0)>>>0<10){do{x=c[f>>2]|0;if(x>>>0<(c[h>>2]|0)>>>0){c[f>>2]=x+1;y=d[x]|0}else{y=Mm(a)|0}}while((y+ -48|0)>>>0<10)}if((c[h>>2]|0)!=0){c[f>>2]=(c[f>>2]|0)+ -1}f=(n|0)!=0;n=Xm(0,0,v|0,w|0)|0;o=f?H:w;p=f?n:v;H=o;i=e;return p|0}function Lm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a+104>>2]=b;e=c[a+8>>2]|0;f=c[a+4>>2]|0;g=e-f|0;c[a+108>>2]=g;if((b|0)!=0&(g|0)>(b|0)){c[a+100>>2]=f+b;i=d;return}else{c[a+100>>2]=e;i=d;return}}function Mm(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=b+104|0;g=c[f>>2]|0;if(!((g|0)!=0?(c[b+108>>2]|0)>=(g|0):0)){h=3}if((h|0)==3?(h=Qm(b)|0,(h|0)>=0):0){g=c[f>>2]|0;f=c[b+8>>2]|0;if((g|0)!=0?(j=c[b+4>>2]|0,k=g-(c[b+108>>2]|0)+ -1|0,(f-j|0)>(k|0)):0){c[b+100>>2]=j+k}else{c[b+100>>2]=f}k=c[b+4>>2]|0;if((f|0)!=0){j=b+108|0;c[j>>2]=f+1-k+(c[j>>2]|0)}j=k+ -1|0;if((d[j]|0|0)==(h|0)){l=h;i=e;return l|0}a[j]=h;l=h;i=e;return l|0}c[b+100>>2]=0;l=-1;i=e;return l|0}function Nm(a,b){a=+a;b=b|0;var d=0,e=0.0,f=0,g=0,j=0,l=0.0;d=i;if((b|0)>1023){e=a*8.98846567431158e+307;f=b+ -1023|0;if((f|0)>1023){g=b+ -2046|0;j=(g|0)>1023?1023:g;l=e*8.98846567431158e+307}else{j=f;l=e}}else{if((b|0)<-1022){e=a*2.2250738585072014e-308;f=b+1022|0;if((f|0)<-1022){g=b+2044|0;j=(g|0)<-1022?-1022:g;l=e*2.2250738585072014e-308}else{j=f;l=e}}else{j=b;l=a}}b=cn(j+1023|0,0,52)|0;j=H;c[k>>2]=b;c[k+4>>2]=j;a=l*+h[k>>3];i=d;return+a}function Om(a,b){a=+a;b=b|0;var c=0,d=0.0;c=i;d=+Nm(a,b);i=c;return+d}function Pm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=b+74|0;f=a[e]|0;a[e]=f+255|f;f=b+20|0;e=b+44|0;if((c[f>>2]|0)>>>0>(c[e>>2]|0)>>>0){sc[c[b+36>>2]&3](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[f>>2]=0;f=c[b>>2]|0;if((f&20|0)==0){g=c[e>>2]|0;c[b+8>>2]=g;c[b+4>>2]=g;h=0;i=d;return h|0}if((f&4|0)==0){h=-1;i=d;return h|0}c[b>>2]=f|32;h=-1;i=d;return h|0}function Qm(a){a=a|0;var b=0,e=0,f=0;b=i;i=i+16|0;e=b;if((c[a+8>>2]|0)==0?(Pm(a)|0)!=0:0){f=-1}else{if((sc[c[a+32>>2]&3](a,e,1)|0)==1){f=d[e]|0}else{f=-1}}i=b;return f|0}function Rm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0.0,j=0,k=0;d=i;i=i+112|0;e=d;f=e+0|0;g=f+112|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(g|0));f=e+4|0;c[f>>2]=a;g=e+8|0;c[g>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;Lm(e,0);h=+Jm(e,1,1);j=(c[f>>2]|0)-(c[g>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){i=d;return+h}if((j|0)==0){k=a}else{k=a+j|0}c[b>>2]=k;i=d;return+h}function Sm(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;a:do{if((d|0)==0){f=0}else{g=d;h=b;j=c;while(1){k=a[h]|0;l=a[j]|0;if(!(k<<24>>24==l<<24>>24)){break}m=g+ -1|0;if((m|0)==0){f=0;break a}else{g=m;h=h+1|0;j=j+1|0}}f=(k&255)-(l&255)|0}}while(0);i=e;return f|0}function Tm(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;e=a[b]|0;f=a[c]|0;if(e<<24>>24!=f<<24>>24|e<<24>>24==0|f<<24>>24==0){g=e;h=f;j=g&255;k=h&255;l=j-k|0;i=d;return l|0}else{m=b;n=c}while(1){c=m+1|0;b=n+1|0;f=a[c]|0;e=a[b]|0;if(f<<24>>24!=e<<24>>24|f<<24>>24==0|e<<24>>24==0){g=f;h=e;break}else{m=c;n=b}}j=g&255;k=h&255;l=j-k|0;i=d;return l|0}function Um(){}function Vm(a){a=a|0;var b=0;b=(da(c[a>>2]|0,31010991)|0)+1735287159&2147483647;c[a>>2]=b;return b|0}function Wm(){return Vm(o)|0}function Xm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(H=e,a-c>>>0|0)|0}function Ym(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(H=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function Zm(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function _m(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;u=u+1|0;c[a>>2]=u;while((e|0)<40){if((c[d+(e<<2)>>2]|0)==0){c[d+(e<<2)>>2]=u;c[d+((e<<2)+4)>>2]=b;c[d+((e<<2)+8)>>2]=0;return 0}e=e+2|0}fb(116);fb(111);fb(111);fb(32);fb(109);fb(97);fb(110);fb(121);fb(32);fb(115);fb(101);fb(116);fb(106);fb(109);fb(112);fb(115);fb(32);fb(105);fb(110);fb(32);fb(97);fb(32);fb(102);fb(117);fb(110);fb(99);fb(116);fb(105);fb(111);fb(110);fb(32);fb(99);fb(97);fb(108);fb(108);fb(44);fb(32);fb(98);fb(117);fb(105);fb(108);fb(100);fb(32);fb(119);fb(105);fb(116);fb(104);fb(32);fb(97);fb(32);fb(104);fb(105);fb(103);fb(104);fb(101);fb(114);fb(32);fb(118);fb(97);fb(108);fb(117);fb(101);fb(32);fb(102);fb(111);fb(114);fb(32);fb(77);fb(65);fb(88);fb(95);fb(83);fb(69);fb(84);fb(74);fb(77);fb(80);fb(83);fb(10);ea(0);return 0}function $m(a,b){a=a|0;b=b|0;var d=0,e=0;while((d|0)<20){e=c[b+(d<<2)>>2]|0;if((e|0)==0)break;if((e|0)==(a|0)){return c[b+((d<<2)+4)>>2]|0}d=d+2|0}return 0}function an(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return za(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function bn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function cn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){H=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}H=a<<c-32;return 0}function dn(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function en(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){H=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}H=0;return b>>>c-32|0}function fn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){H=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}H=(b|0)<0?-1:0;return b>>c-32|0}function gn(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function hn(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function jn(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=da(d,c)|0;f=a>>>16;a=(e>>>16)+(da(d,f)|0)|0;d=b>>>16;b=da(d,c)|0;return(H=(a>>>16)+(da(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function kn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=Xm(e^a,f^b,e,f)|0;b=H;a=g^e;e=h^f;f=Xm((pn(i,b,Xm(g^c,h^d,g,h)|0,H,0)|0)^a,H^e,a,e)|0;return f|0}function ln(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=Xm(h^a,j^b,h,j)|0;b=H;pn(m,b,Xm(k^d,l^e,k,l)|0,H,g)|0;l=Xm(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=H;i=f;return(H=j,l)|0}function mn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=jn(e,a)|0;f=H;return(H=(da(b,a)|0)+(da(d,e)|0)+f|f&0,c|0|0)|0}function nn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=pn(a,b,c,d,0)|0;return e|0}function on(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;pn(a,b,d,e,g)|0;i=f;return(H=c[g+4>>2]|0,c[g>>2]|0)|0}function pn(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(H=n,o)|0}else{if(!m){n=0;o=0;return(H=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(H=n,o)|0}}m=(l|0)==0;do{if((j|0)!=0){if(!m){p=(gn(l|0)|0)-(gn(i|0)|0)|0;if(p>>>0<=31){q=p+1|0;r=31-p|0;s=p-31>>31;t=q;u=g>>>(q>>>0)&s|i<<r;v=i>>>(q>>>0)&s;w=0;x=g<<r;break}if((f|0)==0){n=0;o=0;return(H=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(H=n,o)|0}r=j-1|0;if((r&j|0)!=0){s=(gn(j|0)|0)+33-(gn(i|0)|0)|0;q=64-s|0;p=32-s|0;y=p>>31;z=s-32|0;A=z>>31;t=s;u=p-1>>31&i>>>(z>>>0)|(i<<p|g>>>(s>>>0))&A;v=A&i>>>(s>>>0);w=g<<q&y;x=(i<<q|g>>>(z>>>0))&y|g<<p&s-33>>31;break}if((f|0)!=0){c[f>>2]=r&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(H=n,o)|0}else{r=hn(j|0)|0;n=i>>>(r>>>0)|0;o=i<<32-r|g>>>(r>>>0)|0;return(H=n,o)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(H=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(H=n,o)|0}r=l-1|0;if((r&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=r&i|b&0}n=0;o=i>>>((hn(l|0)|0)>>>0);return(H=n,o)|0}r=(gn(l|0)|0)-(gn(i|0)|0)|0;if(r>>>0<=30){s=r+1|0;p=31-r|0;t=s;u=i<<p|g>>>(s>>>0);v=i>>>(s>>>0);w=0;x=g<<p;break}if((f|0)==0){n=0;o=0;return(H=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(H=n,o)|0}}while(0);if((t|0)==0){B=x;C=w;D=v;E=u;F=0;G=0}else{b=d|0|0;d=k|e&0;e=Ym(b,d,-1,-1)|0;k=H;h=x;x=w;w=v;v=u;u=t;t=0;do{a=h;h=x>>>31|h<<1;x=t|x<<1;g=v<<1|a>>>31|0;a=v>>>31|w<<1|0;Xm(e,k,g,a)|0;i=H;l=i>>31|((i|0)<0?-1:0)<<1;t=l&1;v=Xm(g,a,l&b,(((i|0)<0?-1:0)>>31|((i|0)<0?-1:0)<<1)&d)|0;w=H;u=u-1|0}while((u|0)!=0);B=h;C=x;D=w;E=v;F=0;G=t}t=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(t|0)>>>31|(B|C)<<1|(C<<1|t>>>31)&0|F;o=(t<<1|0>>>31)&-2|G;return(H=n,o)|0}function qn(a,b){a=a|0;b=b|0;return rc[a&255](b|0)|0}function rn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return sc[a&3](b|0,c|0,d|0)|0}function sn(a,b,c){a=a|0;b=b|0;c=c|0;tc[a&15](b|0,c|0)}function tn(a,b,c){a=a|0;b=b|0;c=c|0;return uc[a&1](b|0,c|0)|0}function un(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return vc[a&3](b|0,c|0,d|0,e|0)|0}function vn(a){a=a|0;ea(0);return 0}function wn(a,b,c){a=a|0;b=b|0;c=c|0;ea(1);return 0}function xn(a,b){a=a|0;b=b|0;ea(2)}function yn(a,b){a=a|0;b=b|0;ea(3);return 0}function zn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ea(4);return 0}




// EMSCRIPTEN_END_FUNCS
var rc=[vn,qg,Eg,Fg,Gg,Hg,Ig,Jg,Kg,Lg,Mg,Ng,rg,sg,tg,ug,vg,wg,xg,yg,Sg,Tg,Ug,Vg,Wg,Xg,Yg,Zg,_g,$g,ah,bh,ch,dh,eh,fh,gh,hh,ih,jh,kh,lh,mh,nh,oh,ph,qh,rh,Hh,Ih,Jh,yh,zh,Uh,Vh,Wh,Xh,Yh,Zh,_h,$h,ai,bi,ci,Qi,Ri,Si,Ti,Ui,Vi,Wi,Xi,Yi,Zi,_i,$i,aj,bj,xj,yj,zj,Aj,Bj,Cj,Dj,dk,ek,gk,hk,ik,jk,kk,lk,mk,nk,ok,pk,qk,rk,sk,tk,uk,vk,wk,xk,yk,zk,Ak,Bk,Jk,Kk,Lk,Mk,Nk,Ok,Pk,Qk,Rk,Sk,Tk,Uk,Hl,Il,Jl,Kl,Ll,Ml,Ql,Rl,Sl,Tl,Ul,Vl,Wl,Xl,Yl,Zl,_l,$l,am,bm,cm,dm,$e,fk,vh,Gl,wj,og,Th,Pi,Ik,Rg,Pl,ck,pg,Dg,Og,Pg,wh,Ah,Bh,Ch,Dh,gj,Hk,Gk,Ck,Nl,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn,vn];var sc=[wn,Le,Ne,Fk];var tc=[xn,Pc,Td,Cf,Df,Hf,ig,Fi,em,xn,xn,xn,xn,xn,xn,xn];var uc=[yn,Ei];var vc=[zn,_e,hj,zn];return{_testSetjmp:$m,_saveSetjmp:_m,_free:Fm,_main:Nc,_rand_r:Vm,_realloc:Gm,_i64Add:Ym,_tolower:dn,_i64Subtract:Xm,_memset:bn,_malloc:Em,_memcpy:an,_strlen:Zm,_lua_execute:Mc,_rand:Wm,_bitshift64Shl:cn,runPostSets:Um,stackAlloc:wc,stackSave:xc,stackRestore:yc,setThrew:zc,setTempRet0:Cc,setTempRet1:Dc,setTempRet2:Ec,setTempRet3:Fc,setTempRet4:Gc,setTempRet5:Hc,setTempRet6:Ic,setTempRet7:Jc,setTempRet8:Kc,setTempRet9:Lc,dynCall_ii:qn,dynCall_iiii:rn,dynCall_vii:sn,dynCall_iii:tn,dynCall_iiiii:un}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_vii": invoke_vii, "invoke_iii": invoke_iii, "invoke_iiiii": invoke_iiiii, "_isalnum": _isalnum, "_fabs": _fabs, "_frexp": _frexp, "_exp": _exp, "_fread": _fread, "_log10": _log10, "_longjmp": _longjmp, "__addDays": __addDays, "_fsync": _fsync, "_rename": _rename, "_sbrk": _sbrk, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sinh": _sinh, "_sysconf": _sysconf, "_close": _close, "_ferror": _ferror, "_clock": _clock, "_cos": _cos, "_tanh": _tanh, "_emscripten_run_script_int": _emscripten_run_script_int, "_unlink": _unlink, "_write": _write, "__isLeapYear": __isLeapYear, "_ftell": _ftell, "_isupper": _isupper, "_gmtime_r": _gmtime_r, "_islower": _islower, "_tmpnam": _tmpnam, "_tmpfile": _tmpfile, "_emscripten_exit_with_live_runtime": _emscripten_exit_with_live_runtime, "_emscripten_run_script_string": _emscripten_run_script_string, "_send": _send, "_abort": _abort, "_setvbuf": _setvbuf, "_atan2": _atan2, "_setlocale": _setlocale, "_isgraph": _isgraph, "_modf": _modf, "_strerror_r": _strerror_r, "_gmtime": _gmtime, "_fscanf": _fscanf, "___setErrNo": ___setErrNo, "_isalpha": _isalpha, "_srand": _srand, "_mktime": _mktime, "_putchar": _putchar, "_floor": _floor, "_localeconv": _localeconv, "_printf": _printf, "_sprintf": _sprintf, "_localtime": _localtime, "_read": _read, "_fwrite": _fwrite, "_time": _time, "_fprintf": _fprintf, "_exit": _exit, "_freopen": _freopen, "_llvm_pow_f64": _llvm_pow_f64, "_fgetc": _fgetc, "_fmod": _fmod, "_lseek": _lseek, "_rmdir": _rmdir, "_asin": _asin, "___buildEnvironment": ___buildEnvironment, "_pwrite": _pwrite, "_localtime_r": _localtime_r, "_tzset": _tzset, "_open": _open, "_remove": _remove, "_snprintf": _snprintf, "__scanString": __scanString, "_strftime": _strftime, "_fseek": _fseek, "_iscntrl": _iscntrl, "_getenv": _getenv, "_fclose": _fclose, "_log": _log, "_recv": _recv, "_tan": _tan, "_copysign": _copysign, "__getFloat": __getFloat, "_fputc": _fputc, "_ispunct": _ispunct, "_ceil": _ceil, "_isspace": _isspace, "_fopen": _fopen, "_sin": _sin, "_acos": _acos, "_cosh": _cosh, "_difftime": _difftime, "_ungetc": _ungetc, "_system": _system, "_fflush": _fflush, "__reallyNegative": __reallyNegative, "_fileno": _fileno, "__exit": __exit, "__arraySum": __arraySum, "_fgets": _fgets, "_atan": _atan, "_pread": _pread, "_mkport": _mkport, "_toupper": _toupper, "_feof": _feof, "___errno_location": ___errno_location, "_clearerr": _clearerr, "_isxdigit": _isxdigit, "_strerror": _strerror, "_emscripten_longjmp": _emscripten_longjmp, "__formatString": __formatString, "_sqrt": _sqrt, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "___rand_seed": ___rand_seed, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr, "_stdin": _stdin, "_stdout": _stdout }, buffer);
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _rand_r = Module["_rand_r"] = asm["_rand_r"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _lua_execute = Module["_lua_execute"] = asm["_lua_execute"];
var _rand = Module["_rand"] = asm["_rand"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };


// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}







var Lua = {
  // public
  init: function() {
    Lua.execute("-- JS<-->Lua glue\n--\n-- Horribly hackish, this is not the right way to do it\n\njs.number = 1\njs.string = 2\njs.object = 3\njs.func = 4\n\njs.lua_table = {}\njs.lua_index = 1\n\njs.to_js = function(x)\n  if type(x) == 'number' then return tostring(x)\n  elseif type(x) == 'string' then return '\"' .. x .. '\"'\n  elseif type(x) == 'function' then\n    local lua_index = js.lua_index\n    js.lua_index = js.lua_index + 1\n    js.lua_table[lua_index] = x\n    return 'Lua.funcWrapper(' .. lua_index .. ')'\n  --elseif type(x) == 'table' then return 'Lua.wrappers[\n  else return '<{[Unsupported]}>' end\nend\n\njs.convert_args = function(args)\n  local js_args = ''\n  for i, v in ipairs(args) do\n    if i > 1 then js_args = js_args .. ',' end\n    js_args = js_args .. js.to_js(v)\n  end\n  return js_args\nend\n\njs.wrapper_index = 1\n\njs.wrapper = {}\n\njs.wrapper.__index = function(table, key)\n  if key == 'new' then\n    local ret = { what = 'Lua.wrappers[' .. table.index .. ']' }\n    setmetatable(ret, js.new.property)\n    return ret\n  end\n  return js.get('Lua.wrappers[' .. table.index .. '].' .. key, table)\nend\n\njs.wrapper.__newindex = function(table, key, v)\n  js.run('Lua.wrappers[' .. table.index .. '].'..key..\"=\"..js.to_js(v))\nend\n\njs.wrapper.__call = function(table, ...)\n  if rawget(table, 'parent') then\n    local suffix = js.convert_args({...})\n    if string.len(suffix) > 0 then suffix = ',' .. suffix end\n    return js.get('(tempFunc = Lua.wrappers[' .. table.index .. '], tempFunc).call(Lua.wrappers[' .. table.parent.index .. ']' .. suffix .. ')') -- tempFunc needed to work around js invalid call issue FIXME\n  else\n    return js.get('(tempFunc = Lua.wrappers[' .. table.index .. '], tempFunc)(' .. js.convert_args({...}) .. ')') -- tempFunc needed to work around js invalid call issue FIXME\n  end\nend\n\njs.wrapper.__gc = function(table)\n  js.run('delete Lua.reverseWrappers[Lua.wrappers['..table.index..']]')\n  js.run('delete Lua.wrappers['..table.index..']')\nend\n\nlocal wrapper_store = {}\nsetmetatable(wrapper_store, {__mode='v'})\n\njs.getWrapperStore = function() return wrapper_store end\njs.storeGet = function(idx) return wrapper_store[idx] end\n\njs.get = function(what, parent)\n  local ret = { index = js.wrapper_index, parent=false }\n  js.wrapper_index = js.wrapper_index + 1\n  local return_type = js.run(\"Lua.test('\" .. what .. \"', \"..(js.wrapper_index-1)..\")\")\n  if return_type < 0 then\n    return wrapper_store[-return_type]\n  elseif return_type == js.number then\n    return js.run('Lua.last')\n  elseif return_type == js.string then\n    return js.run_string('Lua.last')\n  elseif return_type == js.object or return_type == js.func then\n    js.run('Lua.wrappers[' .. ret.index .. '] = Lua.last')\n    ret.parent = parent\n    setmetatable(ret, js.wrapper)\n    wrapper_store[js.wrapper_index-1] = ret\n    return ret\n  else\n    return '!Unsupported!'\n  end\nend\n\njs.global = js.get('Lua.theGlobal')\n\njs.new = {}\nsetmetatable(js.new, js.new)\njs.new.__index = function(table, key)\n  local ret = { what = key }\n  setmetatable(ret, js.new.property)\n  return ret\nend\n\njs.new.property = {}\njs.new.property.__call = function(table, ...)\n  return js.get('new ' .. table.what .. '(' .. js.convert_args({...}) .. ')')\nend\n\n");

    if (typeof window == 'object') {
      // Run script tags on page
      var onload = window.onload;
      window.onload = function() {
        if (onload) onload();
        Lua.executeScripts();
      };
    }
  },
  execute: function(code) {
    Module.ccall('lua_execute', null, ['string'], [code]);
  },

  // internal
  executeScripts: function() {
    Array.prototype.forEach.call(document.querySelectorAll('script[type=\"text\/lua\"]'), function(tag) {
      Lua.execute(tag.innerHTML)
    });
  },

  // internal glue layer
  theGlobal: this,
  wrappers: {},
  reverseWrappers: {},
  last: null,
  test: function(what, idx) {
    Lua.last = eval(what);
    if (this.reverseWrappers[Lua.last]) {
      return -this.reverseWrappers[Lua.last];
    }
    this.reverseWrappers[Lua.last] = idx;
    switch (typeof Lua.last) {
      case 'number': return 1;
      case 'string': return 2;
      case 'object': return 3;
      case 'function': return 4;
      default: return 0;
    }
  },
  funcWrapper: function(i) {
    var realthis = this;
    return function() {
      if (realthis.reverseWrappers[this]) Lua.execute('js.lua_table[' + i + '](js.storeGet('+realthis.reverseWrappers[this]+'))');
      else Lua.execute('js.lua_table[' + i + ']()');
    };
  }
};

if (!Module.noInitialRun) Lua.init();

