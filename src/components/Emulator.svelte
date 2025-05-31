<script lang="ts">
    import { cpu } from '$lib/cpu.svelte';
    import Input from './Input.svelte';
    var { grow = $bindable()} = $props();

</script>

<div id="emulator" style:flex-grow={grow}>
    
    <div class="test">
        <div class="lines">
            <div class="lines">
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i}=</span><div class="input"><Input bind:hexValue={cpu.d[i]} /></div>
                        </div>
                    {/each}
                </div>
            
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i+2}=</span><div class="input"><Input bind:hexValue={cpu.d[i+2]} /></div>
                        </div>
                    {/each}
                </div>
            </div>
    
            <div class="lines">
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i+4}=</span><div class="input"><Input bind:hexValue={cpu.d[i+4]} /></div>
                        </div>
                    {/each}
                </div>
        
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>D{i+6}=</span><div class="input"><Input bind:hexValue={cpu.d[i+6]} /></div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    
        <div class="lines">
            <div class="lines">
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i}=</span><div class="input"><Input bind:hexValue={cpu.a[i]} /></div>
                        </div>
                    {/each}
                </div>
            
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i+2}=</span><div class="input"><Input bind:hexValue={cpu.a[i+2]} /></div>
                        </div>
                    {/each}
                </div>
            </div>
    
            <div class="lines">
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i+4}=</span><div class="input"><Input bind:hexValue={cpu.a[i+4]} /></div>
                        </div>
                    {/each}
                </div>
        
                <div class="line">
                    {#each {length: 2}, i}
                        <div class="reg">
                            <span>A{i+6}=</span><div class="input"><Input bind:hexValue={cpu.a[i+6]} /></div>
                        </div>
                    {/each}
                </div>
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
        /* box-shadow: 1px 1px 1px hsl(60, 2%, 24%) */

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

    .line {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 3px;
    }

    .reg {
        margin-left: 5px;
        margin-right: 5px;
        display: flex;
        align-items: center;
        line-height: 1.5;
    }

    .test {
        display: flex;
        justify-content: center;
    }

</style>