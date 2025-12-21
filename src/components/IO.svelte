<script lang="ts">
    import Input  from './Input.svelte';
    import { onMount } from 'svelte';

    var { grow = $bindable()} = $props();
    var digits:number[] = $state([1, 2, 4, 8, 16, 32, 64, 128]);
    var leds:number = $state(69);
    var switches:number = $state(255);
    var buttons:number = $state(255);

    var displayBaseAddr:number = $state(14680064); //0xE00000
    var ledsBaseAddr:number = $state(14680080); //0xE00010
    var switchesBaseAddr:number = $state(14680082); //0xE00012
    var buttonsBaseAddr:number = $state(14680084); //0xE00014
    var autoInterval:number = $state(1000);

    onMount(() => {
        // Preload switch images 
        const preloadImages = ['/switch_on.png', '/switch_off.png'];
        preloadImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    });
</script>
 
<div id="io" style:flex-grow={grow}>
    <div class="col"> 

        <div class="row">
            <div id="display">
                {#each {length: 8}, i}
                    <div class="digit">
                        <div class="hsegment s0" class:on={digits[i] & (1<<0)} class:off={(digits[i] & (1<<0)) == 0}></div>
                        <div class="vsegment s1" class:on={digits[i] & (1<<1)} class:off={(digits[i] & (1<<1)) == 0}></div>
                        <div class="vsegment s2" class:on={digits[i] & (1<<2)} class:off={(digits[i] & (1<<2)) == 0}></div>
                        <div class="hsegment s3" class:on={digits[i] & (1<<3)} class:off={(digits[i] & (1<<3)) == 0}></div>
                        <div class="vsegment s4" class:on={digits[i] & (1<<4)} class:off={(digits[i] & (1<<4)) == 0}></div>
                        <div class="vsegment s5" class:on={digits[i] & (1<<5)} class:off={(digits[i] & (1<<5)) == 0}></div>
                        <div class="hsegment s6" class:on={digits[i] & (1<<6)} class:off={(digits[i] & (1<<6)) == 0}></div>
                        <div class="dotsegment" class:on={digits[i] & (1<<7)} class:off={(digits[i] & (1<<7)) == 0}></div>
                    </div>
                {/each}
            </div>
    
            <div class="addr">
                <b>Address</b>
                <div class="input">
                    <Input bind:hexValue={displayBaseAddr} base={16} />
                </div>
            </div>
        </div>
    
        <div class="row">
            <div id="leds">
                {#each {length: 8}, i}
                        <div class="led" class:on={leds & (128>>i)} class:off={(leds & (128>>i)) == 0}></div>
                {/each}
            </div>
    
            <div class="addr">
                <b>Address</b>
                <div class="input">
                    <Input bind:hexValue={ledsBaseAddr} base={16} />
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="switches">
                {#each {length: 8}, i}
                    <button onclick={() => switches ^= (128>>i)}>
                        {#if switches & (128>>i) }
                            <img src="/switch_on.png"/>
                        {:else}
                            <img src="/switch_off.png"/>
                        {/if}
                    </button>
                {/each}
            </div>
    
            <div class="addr">
                <b>Address</b>
                <div class="input">
                    <Input bind:hexValue={switchesBaseAddr} base={16} />
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="switches">
                {#each {length: 8}, i}
                    <button onmousedown={() => buttons &= ~(128>>i)} onmouseup={() => buttons |= (128>>i)} >
                        <img src="/button.png"/>
                    </button>
                {/each}
            </div>
    
            <div class="addr">
                <b>Address</b>
                <div class="input">
                    <Input bind:hexValue={buttonsBaseAddr} base={16} />
                </div>
            </div>
        </div>
    
        <div id="interrupts">
            <div style="flex: 4 0 0;">
                <div class="label">Interrupt</div>
                
                <div class="row2">
                    {#each {length: 7}, i}
                    <div>{7-i}</div>
                    {/each}
                </div>
                
                <div class="row2" style="margin-bottom: 10px;">
                    {#each {length: 7}, i}
                        <button>
                            <img src="/button_small.png" alt="">
                        </button>
                    {/each}
                </div>

                <div class="row2">
                    {#each {length: 7}, i}
                        <input type="checkbox">
                    {/each}
                </div>


            </div>
            <div style="flex: 2 0 0;">
                <div class="label">Auto Interval</div>

                <div class="row3">
                    <div class="input">
                        <Input bind:hexValue={autoInterval} base={10}/>
                    </div>
                    ms
                </div>

                <div class="row3">
                    <select name="" id="" style="width: 40px;">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>

                    </select>
                    IRQ
                </div>
            </div>
            <div style="flex: 1 0 0;">
                <div class="label">Reset</div>

                <div class="row2">
                    <button>
                        <img src="/button_small.png" alt="">
                    </button>
                </div>
            </div>
        </div>
    </div>
    
</div>

<style>
    #io {
        flex:1 0 0;
        background: #f5f6f6; /* #faf8f5; */
        border-radius: 5px;
        background: #d4d0c8;
        display: flex;
        justify-content:space-around;
        overflow: auto;
        padding:2rem;
    }

    .col {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        height: fit-content;
        gap: 10px;
    }

    .input, select {
        color:black;
        background: white;
        font-weight: normal;
    }

    .input{
        overflow: hidden;
        border-right:solid white 1px;
        border-bottom:solid white 1px;
        position: relative;
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

    #leds, #display {
        position: relative;
        box-shadow: 2px 2px 2px hsl(60, 2%, 24%);
        border-left: 1px solid white;
        border-top: 1px solid white;
    }

    button {
        cursor:pointer;
        user-select: none;
        overflow:hidden;
    }

    button:active img {
        position:relative;
        left: 2px;
        top: 2px;
    }

    #interrupts {
        display: flex;
        background: #800000;
        padding: 6px;
        margin-top: 5px;
        color: white;
        font-weight: bold;
        font-family: monospace;
    }

    #interrupts > div {
        border: 1px solid white;
        height: 100px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding: 10px 0 10px 0;
    }

    .label {
        position: absolute;
        top:-7px;
        left: 5px;
        color: white;
        background: #800000;
        padding: 0 4px 0 4px;
        font-size: 12px;
        font-weight: bold;
        line-height: 1;
    }

    .row3 {
        display: flex;
        justify-content: center;
        gap: 5px;
    }

    .row2 {
        display:flex;
        justify-content: space-around;
    }
    .row {
        display:flex;
        align-items: flex-end;
        gap: 30px;
    }

    .switches {
        display: flex;
        justify-content: space-around;
        width: 350px;
    }

    #leds {
        display: flex;
        padding-top: 10px;
        padding-bottom: 10px;
        background: #808080;
        justify-content: space-around;
        width: 350px;
    }

    .led {
        height: 20px;
        width: 20px;
        border-radius: 10px;
        border: solid 3px #800000;
    }

    #display {
        display: flex;
        padding: 10px; /* aaaaa */
        background: black;
        justify-content: space-around;
        width: 350px;
    }

    .digit {
        width: 35px;
        height: 53px;
        position: relative;
    }

    .vsegment {
        position: absolute;
        width: 3px;
        height: 20px;
    }

    .hsegment {
        position: absolute;
        height: 3px;
        width: 20px;
    }

    .dotsegment {
        position: absolute;
        height: 3px;
        width: 3px;
        right: 0px;
        bottom: 0px;
    }

    .on {
        background: red;
    }

    .off {
        background: #400000;
    }

    .s0 {
        top: 0px;
        left: 4px;
    }

    .s1 {
        top: 4px;
        left: 25px;
    }

    .s2 {
        bottom: 4px;
        left: 25px;
    }

    .s3 {
        bottom: 0px;
        left: 4px;
    }

    .s4 {
        bottom: 4px;
        left: 0px;
    }

    .s5 {
        top: 4px;
        left: 0px;
    }

    .s6 {
        top: 25px;
        left: 4px;
    }

    img {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    }

</style>