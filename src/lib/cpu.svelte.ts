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
var wasmcpu;

var wasmImports = {
    exit: () => console.log('CPU EXITED'),
    
    _abort_js: () => abort('native code called abort()'),
    
    fd_close: () => abort('fd_close called but NOT IMPLEMENTED!'),
    
    fd_seek: () => abort('fd_seek called but NOT IMPLEMENTED!'),
    
    fd_write: _fd_write,

    emscripten_resize_heap: function(delta) {memory.grow(delta); }
};

// --------------------------------------------------------------
class CPU {
    #d: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]); // D0-D7
    #a: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]); // A0-A7
    #pc: number = $state(0);
    #sr: number = $state(0);
    #windowBaseAddr: number = $state(0);
    #memWindow: number[][] = $state([]); // Each row is 16 bytes
    breakpoints = new Set<number>(); // Breakpoints addresses

    #displayAddr: number = $state(14680064); // 0xE00000
    #ledsAddr:    number = $state(14680080); // 0xE00010
    #switchesAddr:number = $state(14680082); // 0xE00012
    #buttonsAddr: number = $state(14680084); // 0xE00014
    #display: number[] = $state([0, 0, 0, 0, 0, 0, 0, 0]);
    #leds:    number   = $state(0);
    #switches:number   = $state(255);
    #buttons: number   = $state(255);

    // Fetches new values from wasm module
    #update_values() {
        this.#d.splice(0, 8, ...new Uint32Array(wasmcpu.memory.buffer, wasmcpu.read_D_regs(), 8));
        this.#a.splice(0, 8, ...new Uint32Array(wasmcpu.memory.buffer, wasmcpu.read_A_regs(), 8));
        this.#pc = wasmcpu.read_pc();
        this.#sr = wasmcpu.read_sr();
        this.cycles = wasmcpu.read_cycles();
        this.#update_display();
        this.#update_leds();
    }

    #update_display() {
        const ptr = wasmcpu.read_mem_window(this.#displayAddr, 8);
        this.#display.splice(0, 8, ...new Uint8Array(wasmcpu.memory.buffer, ptr, 8));
    }

    #update_leds() {
        const ptr = wasmcpu.read_mem_window(this.#ledsAddr, 1);
        this.#leds = new Uint8Array(wasmcpu.memory.buffer, ptr, 1)[0];
    }

    #update_window(start = 0, end = this.#memWindow.length) { // end is exclusive
        let ptr = wasmcpu.read_mem_window(this.windowBaseAddr + start*16, (end-start)*16);
        let window = new Uint8Array(wasmcpu.memory.buffer, ptr, (end-start)*16);
        
        for (let i = start; i < end; i++) {
            this.#memWindow[i] = [...window.subarray((i-start)*16, (i-start)*16 + 16)];
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

    get pc() { return this.#pc; }
    set pc(val:number) {
        wasmcpu.write_pc(val);
        this.#pc = val;
    }

    get sr() { return this.#sr; }
    set sr(val:number) {
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

    get windowBaseAddr() { return this.#windowBaseAddr; }
    set windowBaseAddr(val:number) {
        val -= val%16;

        if (val <= 0) { // 16777216 = 2^24
            val = 0;
        }

        if (val > 16777216 - this.#memWindow.length*16) {
            val = 16777216 - this.#memWindow.length*16;
        }

        let prev = (this.#windowBaseAddr-val)/16; // relative position of start of old window in rows
        let size = this.#memWindow.length;
        this.#windowBaseAddr = val; // position 0

        if (prev >= size || prev <= -size) { // If windows don't overlap
            this.#update_window();
            return;
        }

        // ⌄⌄⌄⌄⌄ Overlapping windows optimization, probably not worth it if you're scrolling like a normal person

        // Case 1: update Start of new window till start of prev window
        // remove from end of new window till end of prev window
        if (prev > 0) {
            this.#memWindow.splice(-prev, prev); // Removes old rows from the end, that no longer form part of our window
            this.#memWindow.unshift(...Array(prev).fill(null)); // adds nulls as placeholders at beginning of window
            this.#update_window(0, prev);
            return;
        }

        // Case 2: update end of prev window till end of current window
        // remove start of prev window till start of current window
        prev = -prev;
        this.#memWindow.splice(0, prev); // Removes old rows from the start
        this.#update_window(size -prev, size);
    }

    get displayAddr() { return this.#displayAddr; }
    set displayAddr(val:number) { this.#displayAddr = val; if (wasmcpu) this.#update_display(); }

    get ledsAddr() { return this.#ledsAddr; }
    set ledsAddr(val:number) { this.#ledsAddr = val; if (wasmcpu) this.#update_leds(); }

    get switchesAddr() { return this.#switchesAddr; }
    set switchesAddr(val:number) { this.#switchesAddr = val; if (wasmcpu) wasmcpu.write_mem(val, 0, this.#switches); }

    get buttonsAddr() { return this.#buttonsAddr; }
    set buttonsAddr(val:number) { this.#buttonsAddr = val; if (wasmcpu) wasmcpu.write_mem(val, 0, this.#buttons); }

    get display() { return this.#display; }
    get leds() { return this.#leds; }

    get switches() { return this.#switches; }
    set switches(val:number) {
        this.#switches = val;
        if (wasmcpu) { wasmcpu.write_mem(this.#switchesAddr, 0, val); this.#update_window(); }
    }

    get buttons() { return this.#buttons; }
    set buttons(val:number) {
        this.#buttons = val;
        if (wasmcpu) { wasmcpu.write_mem(this.#buttonsAddr, 0, val); this.#update_window(); }
    }

    memWindow = new Proxy(this.#memWindow, {
        get: (target, row) => {
            if (row === 'length') { return target.length; }
            
            return new Proxy(target[row], {
                set: (target, col, val) => { 
                    target[col] = val;
                    
                    let r = Number(row);
                    let c = Number(col);

                    //console.log(`ẀRITEEE. row: ${r}, col: ${c}, val: ${val}`);
                    let addr = this.windowBaseAddr; // User arrow functions so this still refers to cpu object
                    addr += r*16; // 16 bytes per row
                    addr += c;
                    
                    wasmcpu.write_mem(addr, 0, val);
                    if (addr >= this.#displayAddr && addr < this.#displayAddr + 8) this.#update_display();
                    else if (addr === this.#ledsAddr) this.#update_leds();
                    return true;
                }
            });
        }
    });

    // --- PUBLIC METHODS BELOW ---------------------------------
    update_window_size(size:number) { // size is how many rows the window should have based on its height

        if (size < this.#memWindow.length) {
            let toRemove = this.#memWindow.length - size;
            this.#memWindow.splice(-toRemove, toRemove);  // Always remove from end of window
            return;
        }

        let toAdd = size-this.#memWindow.length;
        
        if (!wasmcpu) { // Initial window on page load
            for (let i = 0; i < toAdd; i++) {
                this.#memWindow.push([]); // Will be populated by update_window() on reset()
            }
            return;
        }
        
        // Update when memory viewer height is changed (overcomplicated stuff to make it 1% more efficient, could just call #update_window())
        let toAddBefore = Math.max(0, (this.#windowBaseAddr + 16*size - 16777216)/16); // When window is at end of memory
        toAdd -= toAddBefore;  // 16777216 = 2^24 (number of m68k memory positions)

        this.#windowBaseAddr -= 16*toAddBefore; // If window is larger than available rows after, take them from before
        this.#memWindow.unshift(...Array(toAddBefore).fill(null)); // adds nulls as placeholders at beginning of window

        this.#update_window(0, toAddBefore);
        this.#update_window(this.#memWindow.length, size);
    }

    // For changing breakpoints once we've already assembled the program
    setBreakpoint(addr:number, val:boolean = !this.breakpoints.has(addr)) {
        if (val) {
            this.breakpoints.add(addr);
        }
        else {
            this.breakpoints.delete(addr);
        }
        wasmcpu.set_breakpoint(addr, val);
    }

    load(prog:string) {
        const ptr:number = this.#alloc_str(prog);
        const entryPoint = wasmcpu.load_program(ptr);
        wasmcpu.wasmfree(ptr);
        this.#update_window(); // update_values?
        return entryPoint;
    }

    reset() {
        wasmcpu.initCpu(); // Initializes register and RAM with 0s
        this.#update_values();
        this.#update_window();
        // Re-write input device state — initCpu zeroes all memory
        wasmcpu.write_mem(this.#switchesAddr, 0, this.#switches);
        wasmcpu.write_mem(this.#buttonsAddr,  0, this.#buttons);
    }

    run_burst(cycles:number, mode:number):boolean {
        let breakpoint = wasmcpu.run_burst(cycles, mode);
        this.#pc = wasmcpu.read_pc();
        this.#update_values();
        this.#update_window();

        return breakpoint;
    }

    step_forwards(): number {
        this.#pc = wasmcpu.step_forwards();
        // this.#update_values();
        // this.#update_window();
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

// --------------------------------------------------------------
WebAssembly.instantiateStreaming(
    fetch("/cpu.wasm"), {
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
    cpu.reset(); // Initialize with 0s
});