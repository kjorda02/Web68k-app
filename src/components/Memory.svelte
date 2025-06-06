<script lang="ts">
    import { cpu } from '$lib/cpu.svelte';
    import Input  from './Input.svelte';
    import MemInput  from './MemInput.svelte';


    var { grow = $bindable()} = $props(); // resizer stuff
    var memEditor;

</script>

<div id="mem" style:flex-grow={grow}>
    <div class="editor">
        <div class="controls">
            <div class="buttons">
                <button onclick={() => cpu.windowBaseAddr -= 16}>Up</button>
                <button onclick={() => cpu.windowBaseAddr += 16}>Down</button>
            </div>
            
            <div class="buttons">
                <button onclick={() => cpu.windowBaseAddr -= cpu.memWindow.length*16} >PgUp</button>
                <button onclick={() => cpu.windowBaseAddr += cpu.memWindow.length*16}>PgDown</button>
            </div>
        </div>

        <div class="displaymem">
            <div class="left">
                <div class="line toptitles">
                    <Input bind:hexValue={cpu.windowBaseAddr}/>
                </div>
                {#each {length: cpu.memWindow.length}, i}
                    <div class="line titles">{(cpu.windowBaseAddr + i*16).toString(16).toUpperCase().padStart(8, '0').substring(0, 7) + "X" }</div>
                {/each}
            </div>
    
            <div class="right">
                <div class="line titles toptitles">
                    {#each {length: 16}, i}
                        <div class="item">X{i.toString(16).toUpperCase()}</div>
                    {/each}
                </div>

                <MemInput lines={cpu.memWindow} bind:this={memEditor} />
            </div>
        </div>
    </div>

</div>

<style>
    #mem {
        flex:1 0 0;
        /* background: #f5f6f6; */
        border-radius: 5px;
        /* padding: max(3%, 0.5rem); USING % CAUSES HORRIBLE FRACTIONAL PIXEL PROBLEMS */
        padding: 2em;
        width: 100%;
        min-height: 0;
        background: #d4d0c8;
    }

    .buttons {
        display: flex;
        gap: 15px;
    }

    button {
        box-shadow: 1px 1px 1px hsl(60, 2%, 10%), 1px 1px 1px white inset;
        padding-right: 1ch;
        padding-left: 1ch;
        font-size: 1.2rem;
        cursor: pointer;
    }

    button:hover {
        background: #c4c1b9;
    }

    .controls {
        flex: 0 0 auto;
        height: 40px;
        background: #d4d0c8;
        border-bottom: 1px solid;
        display: flex;
        justify-content: space-around;
        align-items: center;
    }

    .editor {
        display: flex;
        flex-direction: column;
        height:100%;
        border-radius: 3px;
        border: solid #858585 1px;
        overflow-y:hidden;
        overflow-x: auto;
        
        box-shadow: 3px 3px 4px hsl(60, 2%, 44%);
    }

    .displaymem {
        background: white;
        flex: 1 1 0;
        min-height: 0;
        display: flex;
    }

    .left {
        font-family: monospace;
        width: 10ch;
        flex-shrink: 0;
        background: #d4d0c8;
        border-right: 1px solid;
    }

    .right {
        flex-grow: 1;
        overflow-x: auto;
        display: flex;
        flex-direction: column;
    }

    .line {
        height: 1.5em;
        background: white;
        font-family: monospace;
        display: flex;
        justify-content: space-around;
        min-width: fit-content;
    }

    .titles {
        font-weight: bold;
        background: #d4d0c8;
    }

    .toptitles {
        border-bottom: 1px solid;
        margin-bottom: 0.2em;
    }

    .item {
        margin-right: 0.5ch;
        margin-left: 0.5ch;
    }
</style>