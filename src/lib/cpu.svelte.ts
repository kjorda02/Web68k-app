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
    const buffer = wasmcpu.memory.buffer;
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
    exit: () => console.log('CPU EXITED'),
    
    _abort_js: () => abort('native code called abort()'),
    
    fd_close: () => abort('fd_close called but NOT IMPLEMENTED!'),
    
    fd_seek: () => abort('fd_seek called but NOT IMPLEMENTED!'),
    
    fd_write: _fd_write,

    emscripten_resize_heap: function(delta) {memory.grow(delta); }
};


// --------------------------------------------------------------
var wasmcpu;
WebAssembly.instantiateStreaming(
    fetch("/src/lib/wasm/cpu.wasm"), {
        env: wasmImports,
        wasi_snapshot_preview1: wasmImports,
        js: {
            mem: memory
        }
    }
).then(results => {
    wasmcpu = results.instance.exports;
    // HEAPU32 = new Uint32Array(cpu.memory.buffer);
    // HEAPU8 = new Uint8Array(cpu.memory.buffer);
    memory = results.instance.exports.memory as WebAssembly.Memory;
});

function alloc_str(str) {
    const ptr:number = wasmcpu.wasm_malloc(str.length +1); // +1 for sentinel null character at the end
    var arr = new Uint8Array(wasmcpu.memory.buffer, ptr, str.length +1);
    const bytes = (new TextEncoder()).encode(str);
    
    arr.set(bytes);
    arr[str.length] = 0; // sentinel
    return ptr;
}

// --------------------------------------------------------------
class CPU {
    #d: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]); // D0-D7
    #a: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]); // A0-A7
    #pc: number = $state(0);
    #sr: number = $state(0);
    #ram: number[] = $state([]);
    cycles: number = $state(0);
    running:boolean = $state(false);

    d = new Proxy(this.#d, {
        set(target, n, val) {
            target[n] = val;
            wasmcpu.write_Dn(val, n, 2);
            return true;
        }
    });

    a = new Proxy(this.#a, {
        set(target, n, val) {
            target[n] = val;
            wasmcpu.write_An(val, n, 2);
            return true;
        }
    });

    ram = new Proxy(this.#ram, {
        // TODO: How to handle get?
        // New function to set window size and start @?
        set(target, n, val) {
            //target[n] = val;
            wasmcpu.write_mem(n, 0, val);
            return true;
        }
    });

    get pc() { return this.#pc; }
    set pc(val) {
        wasmcpu.write_pc(val);
        this.#pc = val;
    }

    get sr() { return this.#sr; }
    set sr(val) {
        wasmcpu.write_sr(val); 
        this.#sr = val;
    }

    step_forwards(): number {
        return wasmcpu.step_forwards();
    }

    load_program(prog:string) {
        wasmcpu.initCpu(); // Initializes register and RAM with 0s
    
        const ptr:number = alloc_str(prog);
        wasmcpu.load_program(ptr);
    
        wasmcpu.wasmfree(ptr);
    }
}

export var cpu = new CPU();