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

// --------------------------------------------------------------
class CPU {
    #d: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]); // D0-D7
    #a: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]); // A0-A7
    #pc: number = $state(0);
    #sr: number = $state(0);
    #memWindow: number[][] = $state([ // Each row is 16 bytes
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]);
    #firstRun: boolean = true;

    // Fetches new values from wasm module
    #update_values() {
        this.#d.splice(0, 8, ...new Uint32Array(wasmcpu.memory.buffer, wasmcpu.read_D_regs(), 8));
        this.#a.splice(0, 8, ...new Uint32Array(wasmcpu.memory.buffer, wasmcpu.read_A_regs(), 8));
        this.#sr = wasmcpu.read_sr();

        let ptr = wasmcpu.read_mem_window(this.windowBaseAddr, this.#memWindow.length*16);
        let window = new Uint8Array(wasmcpu.memory.buffer, ptr, this.#memWindow.length*16);
        
        for (let i = 0; i < this.#memWindow.length; i++) {
            this.#memWindow[i].splice(0, 16, ...window.subarray(i*16, i*16 + 16));
        }
    }

    #alloc_str(str: string) {
        const ptr:number = wasmcpu.wasm_malloc(str.length +1); // +1 for sentinel null character at the end
        var arr = new Uint8Array(wasmcpu.memory.buffer, ptr, str.length +1);
        const bytes = (new TextEncoder()).encode(str);
        
        arr.set(bytes);
        arr[str.length] = 0; // sentinel
        return ptr;
    }
    
    // --- PUBLIC ATTRIBUTES BELOW -----------------------------
    cycles: number = $state(0);
    running:boolean = $state(false);
    windowBaseAddr: number = 0;
    

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

    memWindow = new Proxy(this.#memWindow, {
        get(target, row) {
            if (row === 'length') { return target.length; }
            
            return new Proxy(target[row], {
                set(target, col, val) {
                    target[col] = val;
                    
                    let r = Number(row);
                    let c = Number(col);

                    //console.log(`ẀRITEEE. row: ${r}, col: ${c}, val: ${val}`);
                    let addr = this.windowBaseAddr;
                    addr += r*16; // 16 bytes per row
                    addr += c;
                    wasmcpu.write_mem(addr, 0, val);
                    return true;
                }
            });
        }
    });

    // --- PUBLIC METHODS BELOW ---------------------------------
    load(prog:string) {
        if (this.#firstRun) {
            this.reset();
            this.#firstRun = false;
        }
        const ptr:number = this.#alloc_str(prog);
        wasmcpu.load_program(ptr);
        wasmcpu.wasmfree(ptr);
    }

    reset() {
        wasmcpu.initCpu(); // Initializes register and RAM with 0s
        this.#update_values();
    }

    run() {

    }

    step_forwards(): number {
        this.#pc = wasmcpu.step_forwards();
        this.#update_values();
        return this.#pc;
    }

    step_back() {

    }

    step_into() {

    }

    step_out() {

    }
}

export var cpu = new CPU();