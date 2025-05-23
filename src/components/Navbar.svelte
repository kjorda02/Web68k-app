<script lang="ts">
    import { onMount } from 'svelte';
    import { assemble, srecOutput } from '$lib/assembler.svelte';
    import Editor from './Editor.svelte';
    import { cpu } from '$lib/cpu.svelte';

    import { Button } from "./ui/button"
    

    var { editor }: { editor:Editor } = $props();

    onMount(async () => {

    var code = `
SELVTX    DS.W  1
EDITSTAT  DS.W  1
    
EDITINIT
    CLR.W   (SELVTX)    
    CLR.B   (EDITSTAT)     ; SELECT
    RTS`;

        localStorage.setItem('/folder/test.X68', code);

        
        // setTimeout(() => {console.log(code);}, 1000);
        setTimeout(() => {}, 2000);
    });

    var entryFile= '/MAIN.X68';
    var cursor= $state("auto");
    var disabled = $state(false);
    var running = $state(false);
    var hasRun = $state(false);


    async function run() {
        editor.debugMode(); // Make editor non-editable

        console.log('RUN');
        cursor="wait";
        disabled= true;
        var error = await assemble(entryFile);
        disabled= false;
        cursor="auto";

        if (error) {
            alert(error);
            editor.editMode();
        }
        else {
            editor.addrGutters(true); // TODO: Fix repaint bug
            running = true;
            hasRun = true;
            console.log(srecOutput);
            cpu.load_program(srecOutput);  // TODO: Pass in char* properly!!
        }
    }

    function pause() {
        running = false;
    }

    function reset() {
        editor.addrGutters(false);
        editor.editMode();
        hasRun = false;
    }

    function stepBack() {

    }

    function step() {

    }

    function stepInto() {

    }

    function stepOut() {

    }


</script>

<div class="navbar" style:--cursor={cursor} >
    

    <div class="buttons">
         <!-- Play/pause button -->

        {#if running}
            <Button class="button" onclick={pause} {disabled} >
                <svg viewBox="-1 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>pause [#ffffff]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-227.000000, -3765.000000)" fill="#ffffff"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606" id="pause-[#ffffff]"> </path> </g> </g> </g> </g></svg>
            </Button>
        {:else}

            <Button class="button" variant="secondary" onclick={run} {disabled}>
                <svg preserveAspectRatio="xMidYMin" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="--size: 16px; --rotate: 0deg; width: 16px; height: 16px;" aria-hidden="true" class="css-492dz9"><path fill-rule="evenodd" d="M20.593 10.91a1.25 1.25 0 0 1 0 2.18l-14.48 8.145a1.25 1.25 0 0 1-1.863-1.09V3.855a1.25 1.25 0 0 1 1.863-1.09l14.48 8.146Z" clip-rule="evenodd"></path></svg>
            </Button>
        {/if}
        

        <div class="spacer"></div>

        <Button class="button" variant="destructive"  onclick={reset} disabled={running || !hasRun } >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 7L7 6L4.70711 3.70711L5.19868 3.21553C5.97697 2.43724 7.03256 2 8.13323 2C11.361 2 14 4.68015 14 7.93274C14 11.2589 11.3013 14 8 14C6.46292 14 4.92913 13.4144 3.75736 12.2426L2.34315 13.6569C3.90505 15.2188 5.95417 16 8 16C12.4307 16 16 12.3385 16 7.93274C16 3.60052 12.4903 0 8.13323 0C6.50213 0 4.93783 0.647954 3.78447 1.80132L3.29289 2.29289L1 0L0 1V7H6Z" fill="#ffffff"></path> </g></svg>
        </Button>

        <div class="spacer"></div>

        <Button class="button" onclick={stepBack} disabled={true}>
            <svg fill="#ffffff" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z"></path></g></svg>
        </Button>

        <div class="spacer"></div>

        <Button class="button" onclick={step} {disabled}>
            <svg fill="#ffffff" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"></path></g></svg>
        </Button>

        <div class="spacer"></div>

        <Button class="button" onclick={stepInto} disabled={true}>
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" transform="matrix(-1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.37115e-08 10L0 11L5 16L10 11V10L6 10L6 4L15 4V2L4 2L4 10H4.37115e-08Z" fill="#ffffff"></path> </g></svg>
        </Button>

        <div class="spacer"></div>

        <Button class="button" onclick={stepOut} disabled={true}>
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.37115e-08 10L0 11L5 16L10 11V10L6 10L6 4L15 4V2L4 2L4 10H4.37115e-08Z" fill="#ffffff"></path> </g></svg>
        </Button>
        
    </div>

</div>

<style>
    .navbar {
        background: #E4E5E6;
        height: 60px;
        display: flex;
        justify-content: center;
    }

    .navbar * {
        cursor: var(--cursor);
    }

    .buttons {
        display: flex;
        cursor: var(--cursor);
        align-items: center;
        width: 50%;
        max-width:500px;
        height: 100%;
        overflow:scroll;
    }

    :global(.button) {
        flex-grow: 5;
    }

    .spacer {
        min-width:5px;
        flex-grow: 10;
    }

</style>