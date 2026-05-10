export var lineAddrs = {};
export var addrLines = {};
export var srecOutput:string;

var lstOutput;
var errOutput;

function parseLst(output) {
    const lines = output.split('\n');
    const addrs = {}; // Given line, what is corresponding address?
    const addrLines = {}; // Given address, what is the corresponding line?
    let currentFile = null;
    
    for (const line of lines) {
        // Check for source file declaration
        // Line example: Source: "/MAIN.X68"
        //                        ^^^^^^^^^-Want this
        const sourceMatch = line.match(/^Source:\s+"([^"]+)"/);
        if (sourceMatch) {
            const raw = sourceMatch[1];
            currentFile = raw.startsWith('/') ? raw : '/' + raw;
            if (!addrs[currentFile]) {
                addrs[currentFile] = {};
            }
            continue;
        }
        
        // Check for address/line number pattern
        // Line example: 00:0000101C 41F8100E        	    14:     LEA  ETI,A0
        //                  ^^^^^^^^-Want this              ^^-And this
        const addrMatch = line.match(/^(\d+):([0-9A-F]{8})\s+[0-9A-F]*\s+(\d+):/);
        if (addrMatch) {
            const address = parseInt(addrMatch[2], 16);
            const lineNumber = parseInt(addrMatch[3], 10);
            
            addrs[currentFile][lineNumber] = address;
            addrLines[address] = {src: currentFile, line: lineNumber};
        }
    }
    
    return [addrs, addrLines];
}

function parseSrec(output) {
    var match = output.match(/((?:S[0-9A-F]+\n)+)/);
    
    if (!match) {
        console.error('INVALID SREC!!!')
        console.log(output);
        return '';
    }

    return match[1];
}

// --------------------------------------------------------------

class ExitStatus {
    message:string;
    status:number;
    constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
    }
}

var wasmImports = {
    exit: (status, implicit) => {throw new ExitStatus(status);},
    
    __syscall_openat: openat,
    
    __syscall_fcntl64: fcntl64,
    
    __syscall_ioctl: ioctl,
    
    fd_write: write,
    
    fd_read: read,
    
    fd_close: close,
    
    __syscall_getcwd: getcwd,
    
    fd_seek: seek,
    
    __syscall_unlinkat: unlinkat,
    
    __syscall_rmdir: rmdir,
    
    _abort_js: (msg) => { console.error('native code called abort(): '+msg); },
    
    emscripten_resize_heap: function(delta) {memory.grow(delta); },
    
    segfault: () => console.error('[DEBUG] Segmentation fault'),
    
    alignfault: () => console.error('[DEBUG] alignment fault')
};


// --------------------------------------------------------------
var vasm;
var memory;
var HEAPU32;
var HEAPU8;

function reset() {
    memory = new WebAssembly.Memory({ // Each memory block is 2^16 bytes
        initial: 64,
        maximum: 8192
    });

    fds = [ null, {path: '/dev/stdout', position: -1}, {path: '/dev/stderr', position: -1} ]
    NULL_FD = null;
    nextFd = 3;
    
    return WebAssembly.instantiateStreaming(
        fetch("src/lib/wasm/vasmm68k_motvasm.wasm"), {
            env: wasmImports,
            wasi_snapshot_preview1: wasmImports,
            js: {
                mem: memory
            }
        }
    ).then(results => {
        vasm = results.instance.exports;
        HEAPU32 = new Uint32Array(vasm.memory.buffer);
        HEAPU8 = new Uint8Array(vasm.memory.buffer);
        memory = results.instance.exports.memory;
    });
}

// ---------------------------------------------------------------------

// Function to write a string to the WebAssembly memory
function writeStringToMemory(str, ptr) {
    const buffer = vasm.memory.buffer;
    const array = new Uint8Array(buffer, ptr, str.length + 1);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    array.set(bytes);
    array[str.length] = 0; // Null terminator
    return ptr + str.length + 1;
}

// Function to allocate memory in the WebAssembly heap
function allocateMemory(size) {
    // This is a very simplified memory allocator
    // In a real implementation, you would use the WebAssembly module's malloc
    if (!vasm.wasm_malloc) {
        console.error("malloc function not found in the WebAssembly module");
        return 0;
    }
    return vasm.wasm_malloc(size);
}


// Simplified assemble function
export async function assemble(entryFile) {
    var error;
    
    await reset(); // Instantiate new vasm module
    lstOutput = "";
    srecOutput = "";
    errOutput = "";
    
    // The arguments we want to pass to the assembler
    var args = ['vasm_m68k_mot', entryFile, '-m68000', '-chklabels', '-nocase' ,'-L', '/dev/stdout', '-o', '/dev/null'];
    
    lst = true;
    if (callMain(args) != 0) {
        error = "VASM ERROR "+errOutput;
    } else {
        error = errOutput;
    }

    console.log(lstOutput);
    [lineAddrs, addrLines] = parseLst(lstOutput);
    console.log(addrLines);

    if (error) {
        return error;
    }

    await reset(); // Instantiate new vasm module
    lst = false;

    // Call again with different arguments to obtain SREC output
    args = ['vasm_m68k_mot', entryFile, '-m68000', '-chklabels', '-nocase' ,'-Fsrec', '-exec=START', '-o', '/dev/stdout'];
    if (callMain(args) != 0 && !error) {
        error = "VASM ERROR "+errOutput;
    }
    
    srecOutput = parseSrec(srecOutput);

    return error;
}

// ====================================================================================

function callMain(args) {
    if (!vasm || !vasm.__main_argc_argv) {
        console.error('VASM WebAssembly module not loaded or main function not exported');
        return -1;
    }

    // Allocate memory for the argv array (pointers to strings)
    const argv = allocateMemory((args.length + 1) * 4); // 4 bytes per pointer

    if (!argv) {
        console.error('Failed to allocate memory for argv');
        return -1;
    }
    
    const dataView = new DataView(vasm.memory.buffer);
    
    // Allocate and write each argument string, then store its pointer in argv
    for (let i = 0; i < args.length; i++) {
        // Allocate memory for this argument string
        const argPtr = allocateMemory(args[i].length + 1); // +1 for null terminator
        
        if (!argPtr) {
            console.error(`Failed to allocate memory for argument ${i}`);
            return -1;
        }
        
        // Write the string to memory
        writeStringToMemory(args[i], argPtr);
        
        // Store the pointer in the argv array
        dataView.setUint32(argv + i * 4, argPtr, true);
    }
    
    // Set the last argv entry to null
    dataView.setUint32(argv + args.length * 4, 0, true);

    // Call the main function with argc and argv
    try {
        vasm.__main_argc_argv(args.length, argv);
    }
    catch(e) {
        console.log(e.message);
        return e.status;;
    }
}

// File descriptor table - only need to track open files and their positions
var fds = [ null, {path: '/dev/stdout', position: -1}, {path: '/dev/stderr', position: -1} ];
var nextFd = 3; // Start after stdin(0), stdout(1), stderr(2)
var NULL_FD = null;
var lst = true;

// Get a string from memory
function getStringFromMemory(ptr) {
    const memory = vasm.memory.buffer;
    const bytes = new Uint8Array(memory, ptr);
    let str = '';
    let i = 0;
    while (bytes[i] !== 0) {
        str += String.fromCharCode(bytes[i]);
        i++;
    }
    return str;
}

function openat(dirfd, pathPtr, flags, varargs) {
    const path = getStringFromMemory(pathPtr);
    // Simple path normalization - no need to be fancy
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    
    console.log(`[DEBUG] Opening file: ${normalizedPath}`);
    
    if (normalizedPath === '/dev/stdout') {
        return 1; // Return the stdout file descriptor directly
    } 
    else if (normalizedPath === '/dev/stderr') {
        return 2; // Return the stderr file descriptor directly
    }
    
    // Create a new file descriptor
    const fd = nextFd++;
    
    // Initialize fd entry with position at 0
    fds[fd] = {
        path: normalizedPath,
        position: 0
    };
    
    if (normalizedPath === '/dev/null') {
        NULL_FD = fd;
    }
    
    return fd;
}


function getcwd(buf, size) {
    if (size >= 2) {
        const arr = new Uint8Array(vasm.memory.buffer, buf, size);
        arr[0] = 47; // ASCII for '/'
        arr[1] = 0;  // null terminator
    }
    return 0;
}

function ioctl(fd, op, varargs) {
    const TIOCGWINSZ = 0x5413; // TIOCGWINSZ operation (get window size), value typically is 0x5413
    
    
    const view = new DataView(vasm.memory.buffer);
    const result_ptr = varargs;
    
    //console.log(`ioctl called with fd=${fd}, op=0x${op.toString(16)}`);
    
    // Handle special file descriptors
    if (fd === 1 || fd === 2 || (NULL_FD !== null && fd === NULL_FD)) { // stdout or stderr
        if (op === TIOCGWINSZ) {
            // Set fake terminal size (rows=25, cols=80) if needed
            if (result_ptr !== 0) {
                view.setUint16(result_ptr, 80, true);     // cols
                view.setUint16(result_ptr + 2, 25, true); // rows
            }
            return 0; // Success
        }
        else {
            console.error('[DEBUG] IOCTL CALLED WITH UNIMPLEMENTED OPERATION: '+op);
        }
    }
    
    console.error('[DEBUG] IOCTL CALLED WITH ACTUAL FILE FD: '+fd);
}

function rmdir(path) {
    console.error('[DEBUG] DIRECTORY DELETION NOT IMPLEMENTED');
}

function unlinkat(dirfd, path, flags) {
    console.error('[DEBUG] FILE DELETION NOT IMPLEMENTED');
}


// Implements writing but only to stdout and stderr. 
function write(fd, iov, iovcnt, pnum)  {
    let num = 0;
    let text = '';
    
    // Create a decoder once for all text
    const decoder = new TextDecoder();
    
    // Access the memory directly
    const buffer = vasm.memory.buffer;
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
        if (lst) { lstOutput += text; }
        else { srecOutput += text; }

    } else if (fd === 2) {
        errOutput += text;
    }
    else if (NULL_FD === null && fd !== NULL_FD) {
        console.error('[DEBUG] WRITE CALLED WITH ACTUAL FILE FD: '+fd);
    }
    
    // Write the number of bytes processed
    view.setUint32(pnum, num, true);
    return 0;
};


// Simplified read function that assumes a single buffer (simpler iovcnt handling)
function read(fd, iov, iovcnt, pnum) {
    // Check if fd is valid
    if (!fds[fd]) {
        return -8; // EBADF (Bad file descriptor)
    }
    
    const fileInfo = fds[fd];
    const path = fileInfo.path;
    
    // Get file content from localStorage
    const content = localStorage.getItem(path) || '';
    
    // Access the memory directly
    const buffer = vasm.memory.buffer;
    const view = new DataView(buffer);
    
    // For simplicity, we'll just handle the first iov
    // Get pointer to the data and its length
    const ptr = view.getUint32(iov, true);
    const len = view.getUint32(iov + 4, true);
    
    let bytesRead = 0;
    
    if (len > 0) {
        // Determine how much data we can read
        const remaining = content.length - fileInfo.position;
        const bytesToRead = Math.min(len, remaining);
        
        if (bytesToRead > 0) {
            // Get the content slice we want to read
            const slice = content.substring(fileInfo.position, fileInfo.position + bytesToRead);
            //console.log('[DEBUG] read: '+fileInfo.path+", "+slice);
            console.log('[DEBUG] read: '+fileInfo.path);
            
            // Encode it to bytes
            const bytes = new TextEncoder().encode(slice);
            
            // Write to memory
            new Uint8Array(buffer, ptr, bytesToRead).set(bytes);
            
            // Update counters
            bytesRead = bytesToRead;
            fileInfo.position += bytesToRead;
        }
    }
    
    
    // Write the number of bytes read
    view.setUint32(pnum, bytesRead, true);
    return 0;
}

// Minimal seek implementation
function seek(fd, offset, whence, newOffsetPtr) {
    // Check if fd is valid
    if (!fds[fd]) {
        return -8; // EBADF (Bad file descriptor)
    }
    
    const fileInfo = fds[fd];
    const content = localStorage.getItem(fileInfo.path) || '';
    
    // Handle the different seek modes
    if (whence === 0) { // SEEK_SET
        fileInfo.position = offset;
    } else if (whence === 1) { // SEEK_CUR
        fileInfo.position += offset;
    } else if (whence === 2) { // SEEK_END
        fileInfo.position = content.length + offset;
    }
    
    // Ensure position is never negative
    if (fileInfo.position < 0) {
        fileInfo.position = 0;
    }
    
    // Write the new offset if a pointer was provided
    if (newOffsetPtr !== 0) {
        const view = new DataView(vasm.memory.buffer);
        view.setBigInt64(newOffsetPtr, BigInt(fileInfo.position), true);
    }
    
    return 0;
}

// Minimal close implementation
function close(fd) {
    console.log('[DEBUG] Closed '+fds[fd].path+"\n");
    delete fds[fd];
    return 0;
}

function fcntl64(fd, cmd, varargs) {
    console.error('[DEBUG] FCNTL64  NOT IMPLEMENTED');
}