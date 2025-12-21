<script lang="ts">
    var { hexValue = $bindable(), base }: {hexValue:number, base:number} = $props();
    var chars:string[] = $derived.by(() => {
        if (base== 16) {
            return hexValue.toString(16).toUpperCase().padStart(8, '0').split('');
        }
        else if (base==10) {
            return hexValue.toString(10).toUpperCase().padStart(8, '0').split('');
        }
        else if (base==2) {
            return hexValue.toString(2).toUpperCase().padStart(16, '0').split('');
        }
    
    });
    var cursorPos:number = $state(0);

    // let numVal = parseInt(val, 16) % 4294967296;

    function overwrite(event) {
        const { key } = event;
        
        // Don't interfere with browser shortcuts and function keys
        if (event.ctrlKey || event.metaKey || event.altKey || 
            (key.startsWith('F') && key.length != 1) || // F1, F2, F3, etc.
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
                if (cursorPos < chars.length-1) { cursorPos++; }
                break;
            case 'Home':
                cursorPos = 0;
                break;
            case 'End':
                cursorPos = chars.length-1;
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
                let numU = parseInt(chars[cursorPos], base);
                numU = (numU+1) % base;
                updateChar(cursorPos, numU.toString(base));
                break;
            case 'ArrowDown':
                let numD = parseInt(chars[cursorPos], base);
                numD = (numD+base-1) % base;
                updateChar(cursorPos, numD.toString(base));
                break;
            default:
                if ( (base==16 && /^[0-9A-Fa-f]$/.test(key))
                    || (base==10 && /^[0-9]$/.test(key)) 
                    || (base==2 && /^[0-1]$/.test(key)) ) {
                    updateChar(cursorPos, key);
                    if (cursorPos < chars.length -1) cursorPos++;
                }
                break;
        }
    }

    function updateChar(index:number, newChar:string) {
        let newchars = [...chars];
        newchars[index] = newChar;
        hexValue = parseInt(newchars.join(""), base);
        // console.log(hexValue);
    }

</script>

<!-- <input type="text" id="test" maxlength="9" pattern="[0-9A-F]{8}" bind:value={cpu.d[0]} > -->

<div spellcheck="false" onkeydown={overwrite} role="textbox" tabindex="0">
    {#each chars as char, i}
    <span class:cursor={i === cursorPos} onmousedown={() => cursorPos = i} >
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