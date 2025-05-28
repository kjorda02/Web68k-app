function __abort_js() {
    abort('native code called abort()');
}

// --------------------------------------------------------------
function exitJS(status, implicit) {
    var msg = 'Program exited ';

    if (implicit) msg += 'implicitly ';
    else msg += 'explicitly ';

    console.log(msg + `with status ${status}`);
};

// --------------------------------------------------------------
var _fd_close = (fd) => {
    abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
};

// --------------------------------------------------------------
function _fd_seek(fd, offset, whence, newOffset) {
    abort('fd_seek called without SYSCALLS_REQUIRE_FILESYSTEM');
}

// --------------------------------------------------------------
function abort(msg) {
    console.error('Aborted(' + msg + ')');
}

// --------------------------------------------------------------
var _fd_write = (fd, iov, iovcnt, pnum) => {
    let num = 0;
    let text = '';
    
    // Create a decoder once for all text
    const decoder = new TextDecoder();
    
    // Access the memory directly
    const buffer = cpu.memory.buffer;
    const view = new DataView(buffer);
    
    // Process all of the IOVs (I/O vectors)
    for (let i = 0; i < iovcnt; i++) {
        // Get pointer to the data and its length
        const ptr = view.getUint32(iov + i * 8, true);
        const len = view.getUint32(iov + i * 8 + 4, true);
        
        // Read the data as a string
        if (len > 0) {
        text += decoder.decode(new Uint8Array(buffer, ptr, len));
        num += len;
        }
    }
    
    // Output to the appropriate stream
    if (fd === 1) {
        console.log(text);
    } else if (fd === 2) {
        console.error(text);
    }
    
    // Write the number of bytes processed
    view.setUint32(pnum, num, true);
    return 0;
};

// --------------------------------------------------------------

// m68k ram takes 2^24 bytes. Each memory block is 2^16 bytes
var memory = new WebAssembly.Memory({ 
    initial: 512, // 2^25 / 2^16 = 2^9
    maximum: 1024 // 2^26 / 2^16 = 2^10
});

var wasmImports = {
    /** @export */
    exit: () => console.log('CPU EXITED'),
    /** @export */
    _abort_js: __abort_js,
    /** @export */
    fd_close: _fd_close,
    /** @export */
    fd_seek: _fd_seek,
    /** @export */
    fd_write: _fd_write,
    emscripten_resize_heap: function(delta) {memory.grow(delta); }
  };


// --------------------------------------------------------------
export var cpu;
WebAssembly.instantiateStreaming(
    fetch("/src/lib/wasm/cpu.wasm"), {
        env: wasmImports,
        wasi_snapshot_preview1: wasmImports,
        js: {
            mem: memory
        }
    }
).then(results => {
    cpu = results.instance.exports;
    // HEAPU32 = new Uint32Array(cpu.memory.buffer);
    // HEAPU8 = new Uint8Array(cpu.memory.buffer);
    memory = results.instance.exports.memory as WebAssembly.Memory;
});

function alloc_str(str) {
    const ptr:number = cpu.wasm_malloc(str.length +1); // +1 for sentinel null character at the end
    var arr = new Uint8Array(cpu.memory.buffer, ptr, str.length +1);
    const bytes = (new TextEncoder()).encode(str);
    
    arr.set(bytes);
    arr[str.length] = 0; // sentinel
    return ptr;
}

export function load_program(prog:string) {
    cpu.initCpu(); // Initializes register and RAM with 0s

    const ptr:number = alloc_str(prog);
    cpu.load_program(ptr);

    cpu.wasmfree(ptr);
}


