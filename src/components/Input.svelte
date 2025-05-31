<script lang="ts">
    var { hexValue = $bindable() }: {hexValue:number} = $props();
    var hexChars:string[] = $derived( hexValue.toString(16).toUpperCase().padStart(8, '0').split('') );
    var cursorPos:number = $state(0);


    // let numVal = parseInt(val, 16) % 4294967296;

    function overwrite(event) {
        const { key } = event;
        
        // Don't interfere with browser shortcuts and function keys
        if (event.ctrlKey || event.metaKey || event.altKey || 
            key.startsWith('F') || // F1, F2, F3, etc.
            ['Tab', 'Escape'].includes(key)) {

                return; // Let the browser handle these
        }
        event.preventDefault();

        // Navigation
        switch(key) {
            case 'ArrowLeft':
                if (cursorPos > 0) { cursorPos--; }
                break;
            case 'ArrowRight':
                if (cursorPos < hexChars.length-1) { cursorPos++; }
                break;
            case 'Home':
                cursorPos = 0;
                break;
            case 'End':
                cursorPos = hexChars.length-1;
                break;
            case 'Backspace':
                if (cursorPos > 0) {
                    updateChar(cursorPos - 1, '0');
                    cursorPos--;
                }
                break;
            case 'Delete':
                updateChar(cursorPos, '0');
                break;
            case 'ArrowUp':
                let numU = parseInt(hexChars[cursorPos], 16);
                numU = (numU+1) % 16;
                updateChar(cursorPos, numU.toString(16));
                break;
            case 'ArrowDown':
                let numD = parseInt(hexChars[cursorPos], 16);
                numD = (numD+15) % 16;
                updateChar(cursorPos, numD.toString(16));
                break;
            default:
                if (/^[0-9A-Fa-f]$/.test(key)) {
                    updateChar(cursorPos, key);
                    if (cursorPos < 7) cursorPos++;
                }
                break;
        }
    }

    function updateChar(index:number, newChar:string) {
        hexChars[index] = newChar;
        hexValue = parseInt(hexChars.join(""), 16);
    }

</script>

<!-- <input type="text" id="test" maxlength="9" pattern="[0-9A-F]{8}" bind:value={cpu.d[0]} > -->

<div class="hex-editor" spellcheck="false" onkeydown={overwrite} role="textbox" tabindex="0">
    {#each hexChars as char, i}
      <span class:cursor={i === cursorPos} onclick={() => cursorPos = i} >
        {char}
      </span>
    {/each}
</div>

<style>
    div {
        background: white;
        /* border: solid #858585 1px;
        border-radius: 3px; */
        font-family: monospace;
        padding-left: 0.7ch;
        padding-right: 0.7ch;
        caret-color: transparent;
        display: flex;
        box-shadow: inset 1px 1px 1px hsl(60, 2%, 24%), inset -1px -1px 0px #d4d0c8;
    }

    div span {
        user-select: none;
        cursor:text;
    }

    div:focus .cursor {
        background: #0a246a;
        color:white;
        animation: blink 1s infinite;
    }

    span:hover {
        background: rgba(0, 255, 65, 0.3);
    }

    @keyframes blink {
        0%, 50% { background: #0a246a; color:white; }
        51%, 100% { background: transparent; color:black; }
    }
</style>