<script lang="ts">
    import { cpu } from "$lib/cpu.svelte";

    var { lines = $bindable() }: {lines:number[][]} = $props();
    var cursorPos:number = $state(0);

    var hexChars:string[][][] = $derived( lines.map((line:number[]) => { 
        return line.map((num:number) => num.toString(16).toUpperCase().padStart(2, '0').split(''));
    }));
    var containerHeight:number = $state(0);
    
    $effect(() => {
        let lineHeight = 1.5*parseFloat(getComputedStyle(document.documentElement).fontSize);
        let rows = Math.floor((containerHeight)/lineHeight);
        if (rows != lines.length) {
            cpu.update_window_size(rows);
        }
    });

    function overwrite(event) { // export for buttons in Memory.svelte
        const { key } = event;

        // Don't interfere with browser shortcuts and function keys
        if (event.ctrlKey || event.metaKey || event.altKey || 
            (key.startsWith('F') && key.length != 1) || // F1, F2, F3, etc.
            ['Tab', 'Escape'].includes(key)) {

                return; // Let the browser handle these
        }
        event.preventDefault();

        switch(key) {
            case 'ArrowLeft':
            case 'h':
            case 'H':
                offsetCursor(-1);
                break;
            case 'ArrowRight':
            case 'l':
            case 'L':
                offsetCursor(1);
                break;
            case 'Home':
                cursorPos = 0;
                break;
            case 'End':
                cursorPos = lines.length*32 -1;
                break;
            case 'Backspace':
                //console.log('baseaddr: '+cpu.windowBaseAddr);
                offsetCursor(-1);
                updateChar(cursorPos, '0');
                break;
            case 'Delete':
                updateChar(cursorPos, '0');
                break;
            case 'ArrowDown':
            case 'j':
            case 'J':
                offsetCursor(32);
                break;
            case 'ArrowUp':
            case 'k':
            case 'K':
                offsetCursor(-32);
                break;
            case 'PageUp':
                offsetCursor(-lines.length*32);
                break;

            case 'PageDown':
                offsetCursor(lines.length*32);
                break;
            
            default:
                if (/^[0-9A-Fa-f]$/.test(key)) {
                    updateChar(cursorPos, key);
                    offsetCursor(1);
                }
                break;
        }
    }

    // If cursor would go outside our window, we update our window
    function offsetCursor(offset:number) {
        let lineOffset = Math.floor((cursorPos+offset)/32) - Math.floor(cursorPos/32);
        // console.log(lineOffset);

        // If the new cursor pos falls outside current window
        if ((cursorPos + offset) < 0 || cursorPos + offset >= hexChars.length*32) {
            
            if (offset == 1 && cpu.windowBaseAddr + lines.length*16 != 16777216) {
                cursorPos -= 31;
            }
            else if (offset == -1 && cpu.windowBaseAddr != 0) {
                cursorPos += 31;
            }

            cpu.windowBaseAddr += lineOffset*16; // Bounds checking is handled by windowBaseAddr setter
            return;
        }
        
        cursorPos += offset;
    }

    function updateChar(pos:number, newChar:string) {
        let line:number = Math.floor(pos / 32); // 32 hex chars in a line
        let row = Math.floor((pos % 32) / 2); // 2 hex chars per byte

        let chars:string[] = hexChars[line][row];
        chars[pos % 2] = newChar;

        lines[line][row] = parseInt(chars.join(""), 16);
    }

    function scroll(event) {
        if (event.deltaY > 0) {
            cpu.windowBaseAddr += 16;
        }
        else {
            cpu.windowBaseAddr -= 16;
        }

    }

</script>

<div class="container" spellcheck="false" onkeydown={overwrite} onwheel={scroll} bind:clientHeight={containerHeight} role="textbox" tabindex="0">
    {#each hexChars as line, i}
        <div class="line">
            {#each line as num, j}
                <div class="item">
                    {#each num as char, k}
                        <span class:cursor={(i*32 + j*2 + k) === cursorPos} onmousedown={() => cursorPos = i*32 + j*2 + k}>
                            {char}
                        </span>
                    {/each}
                </div>
            {/each}
        </div>
    {/each}
</div>


<style>
    .container {
        flex-grow: 1;
        font-family: monospace;
        overflow:hidden;
        min-width: fit-content;
    }

    .line {
        height: 1.5rem;
        font-size:1rem;
        background: white;
        display: flex;
        justify-content: space-around;
        min-width: fit-content;
    }

    .item {
        margin-right: 0.5ch;
        margin-left: 0.5ch;
    }

    div span {
        user-select: none;
        cursor:text;
    }

    span:hover {
        background: rgba(0, 255, 65, 0.3);
    }

    div:focus .cursor {
        background: #0a246a;
        color:white;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0%, 50% { background: #0a246a; color:white; }
        51%, 100% { background: transparent; color:black; }
    }
</style>