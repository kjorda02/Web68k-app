<script lang="ts">
    import { cpu } from '$lib/cpu.svelte';
    import Input  from './Input.svelte';

    var { grow = $bindable()} = $props();
    var baseaddr = $state(0);

</script>

<div id="mem" style:flex-grow={grow}>
    <div class="editor">
        <div class="controls">
            <button>Up</button>
            <button>Down</button>
        </div>

        <div class="displaymem">
            <div class="left">
                <div class="line toptitles">
                    <Input hexValue={baseaddr}/>
                </div>
                {#each {length: 16}, i}
                    <div class="line titles">{(cpu.windowBaseAddr + i*16).toString(16).toUpperCase().padStart(8, '0')}</div>
                {/each}
            </div>
    
            <div class="right">
                <div class="line titles toptitles">
                    {#each {length: 16}, i}
                        <div class="item">X{i.toString(16).toUpperCase()}</div>
                    {/each}
                </div>
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

    button {
        box-shadow: 1px 1px 1px hsl(60, 2%, 10%), 1px 1px 1px white inset;
        padding-right: 1ch;
        padding-left: 1ch;
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
        box-shadow: 3px 3px 4px hsl(60, 2%, 44%);
    }

    .displaymem {
        background: white;
        flex-grow: 1;
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