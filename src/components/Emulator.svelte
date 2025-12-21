<script lang="ts">
    import { cpu } from '$lib/cpu.svelte';
    import Input from './Input.svelte';
    var { grow = $bindable()} = $props();

</script>

<div id="emulator" style:flex-grow={grow}>
    
    <div class="test">
        <div class="lines">
            <div class="lines">
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i}=</span><div class="input"><Input bind:hexValue={cpu.d[i]} base={16} /></div>
                        </div>
                    {/each}
                </div>
            
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i+2}=</span><div class="input"><Input bind:hexValue={cpu.d[i+2]} base={16} /></div>
                        </div>
                    {/each}
                </div>
            </div>
    
            <div class="lines">
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i+4}=</span><div class="input"><Input bind:hexValue={cpu.d[i+4]} base={16} /></div>
                        </div>
                    {/each}
                </div>
        
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i+6}=</span><div class="input"><Input bind:hexValue={cpu.d[i+6]} base={16} /></div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    
        <div class="lines">
            <div class="lines">
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i}=</span><div class="input"><Input bind:hexValue={cpu.a[i]} base={16} /></div>
                        </div>
                    {/each}
                </div>
            
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i+2}=</span><div class="input"><Input bind:hexValue={cpu.a[i+2]} base={16} /></div>
                        </div>
                    {/each}
                </div>
            </div>
    
            <div class="lines">
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i+4}=</span><div class="input"><Input bind:hexValue={cpu.a[i+4]} base={16} /></div>
                        </div>
                    {/each}
                </div>
        
                <div class="lines">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i+6}=</span><div class="input"><Input bind:hexValue={cpu.a[i+6]} base={16} /></div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <div class="bottomline">
            <div class="reg">
                <span>PC=</span><div class="input"><Input bind:hexValue={cpu.pc} base={16} /></div>
            </div>

            <div class="col">
                <div class="flags">T.S..INT...XNZVC</div>
                <div class="reg">
                    <span>SR=</span><div class="input"><Input bind:hexValue={cpu.sr} base={2} /></div>
                </div>
            </div>
    </div>

    

</div>

<style>
    #emulator {
        flex:1 0 0;
        /* background: #f5f6f6; */
        border-radius: 5px;
        padding:10px;
        font-family: monospace;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        overflow-y: auto;
        background: #d4d0c8;
    }

    .input{
        overflow: hidden;
        border-right:solid white 1px;
        border-bottom:solid white 1px;
        position: relative;
    }

    .flags {
        text-align: right;
        font-weight: bold;
        font-family: monospace;
        padding-right: 0.7ch;
        margin-right: 6px;
        line-height: 1;
    }

    .input::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        box-shadow: inset 1px 1px 1px hsl(60, 2%, 24%), inset -1px -1px 0px #d4d0c8;
    }

    span {
        font-weight: bold;
        font-size: 1.2em;
        margin:0;
    }

    .lines {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .col {
        display: flex;
        flex-direction: column;
    }

    .bottomline {
        margin-top: 10px;
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        align-items:end;
    }

    .reg {
        margin-left: 5px;
        margin-right: 5px;
        display: flex;
        align-items: center;
        line-height: 1.5;
        margin-bottom: 3px;
    }

    .test {
        display: flex;
        justify-content: center;
    }

</style>