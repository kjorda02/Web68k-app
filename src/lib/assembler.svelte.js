import Assembler from './wasm/vasmm68k_motvasm.js';

function stdin() {
    if (pos >= code.length) {
        return null;
    }

    return code.charCodeAt(pos++);
}

function stdout(c) {
    if (c === null || c === 0) return;
    if (typeof printChar !== 'undefined') {
        printChar(c);
    } else {
        const char = String.fromCharCode(c);
        if (char === '\n') {
        console.log(Module.stdoutBuffer);
            Module.stdoutBuffer = '';
        } else {
            Module.stdoutBuffer = (Module.stdoutBuffer || '') + char;
        }
    }
}

function stderr(c) {
    if (c === null || c === 0) return;
    const char = String.fromCharCode(c);
    if (char === '\n') {
        console.error(Module.stderrBuffer);
        Module.stderrBuffer = '';
    } else {
        Module.stderrBuffer = (Module.stderrBuffer || '') + char;
    }
}

var Module;
var pos = 0;
var ready = false;
var code; // Input buffer


export async function initModule() {
    const moduleConfig = {
        noExitRuntime: false,
        
        preRun: [
                (Module) => {
                    // Prevent the automatic FS.init from doing anything by replacing it
                    Module['FS_createStandardStreams'] = () => { console.log('Skipping automatic FS initialization'); };
                    
                    // Initialize with our custom handlers
                    Module.FS.init(stdin, stdout, stderr);
                }
          ],

        onRuntimeInitialized: function() {
            console.log('Runtime initialized. Ready to assemble M68k code...');
            ready = true;
        },

        onExit: function(status) {
            console.log("Program exited with status: " + status);
        }
        
    };

    Module = await Assembler(moduleConfig);

    Module.stdoutBuffer = '';
    Module.stderrBuffer = '';
}

    
export function assembleLst(src) {
    code = src;

    const args = ['-m68000', '-chklabels', '-chklabels', '-L', '/dev/stdout'];
    // const args = ['-m68000', '-chklabels', '-chklabels', '-Fsrec', '-exec=START', '-o', '/dev/stdout'];

    var exitCode;

    if (ready) {
        exitCode = Module.callMain(args);
        Module.stdoutBuffer = '';
        Module.stderrBuffer = '';
        pos = 0;
    }
    else {
        console.error("assembleLst() was called but assembler wasm module not yet initialized!");
    }
    
    return exitCode;
}