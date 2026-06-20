<script lang="ts">
    import { assemble, srecOutput, addrLines } from '$lib/assembler.svelte';
    import Editor from './Editor.svelte';
    import Files from './Files.svelte';
    import { cpu } from '$lib/cpu.svelte';
    import { Button } from "./ui/button";

    var freq = 1000000; // Target frequency
    var { editor, files }: { editor:Editor, files:Files } = $props();

    var cursor= $state("auto");
    var disabled = $state(false);
    var running = $state(false);
    var canRun = $state(false);
    var hasRun = $state(false);
    var buildFile:string; // File active when build was pressed; reset returns here

    function delay(ms:number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function build() {
        buildFile = files.getCurrentPath();
        editor.debugMode(); // Make editor non-editable

        cursor="wait";
        disabled= true;
        var error = await assemble(files.getCurrentPath()); // Disable clicking other buttons while assembling
        disabled= false;
        cursor="auto";

        if (error) {
            alert(error);
            editor.editMode();
        }
        else {
            canRun = true;
            console.log(srecOutput);
            const entryPoint = cpu.load(srecOutput);
            editor.addrGutters(true);
            const { src, line } = addrLines[entryPoint];
            if (src !== files.getCurrentPath()) {
                files.switchToPath(src);
            }
            editor.scrollToLine(line);
        }
    }

    const RUN = 0;
    const STEP_OVER = 1;
    const STEP_INTO = 2;
    const STEP_OUT = 3;

    async function run(mode:number) {
        running = true;
        let startTime:number = Date.now(); // Time in milliseconds
        let startCycles:number = cpu.cycles;

        if (cpu.breakpoints.has(cpu.pc)) { // run_burst will never run breakpoint instruction
            cpu.step_forwards();
        }
        
        do {
            let breakpoint = cpu.run_burst(freq/50, mode); // 20ms

            if (!addrLines[cpu.pc]) { // Reached end of program
                hasRun = true; // Cannot run again
                break;
            }

            const { src, line } = addrLines[cpu.pc];
            if (src !== files.getCurrentPath()) {
                files.switchToPath(src);
            }
            editor.scrollToLine(line);
            if (breakpoint) { break; } // Reached breakpoint
            
            let cputime = ((cpu.cycles - startCycles)/freq)*1000; // in milliseconds as well
            let actualTime = Date.now() - startTime;

            await delay(Math.max(cputime - actualTime, 0));
            
        }while(running)

        running = false;
    }

    function pause() {
        running = false;
    }

    function reset() {
        cpu.reset();
        files.switchToPath(buildFile); // Re-sync picker + editor to build-time file BEFORE restoring state
        editor.editMode();
        canRun = false;
        hasRun = false;
    }

    // function stepBack() {

    // }

    // $inspect(cpu.memWindow);
</script>

<div class="navbar" style:--cursor={cursor} >
    
    <div class="buttons">
         <!-- Play/pause button -->

        {#if running}
            <Button class="button" onclick={pause} title="Pause">
                <svg viewBox="-1 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>pause [#ffffff]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-227.000000, -3765.000000)" fill="#ffffff"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606" id="pause-[#ffffff]"> </path> </g> </g> </g> </g></svg>
            </Button>
        {:else}
            <Button class="button" variant="secondary" onclick={() => run(RUN)} disabled={ hasRun || !canRun } title="Run">
                <svg preserveAspectRatio="xMidYMin" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="--size: 16px; --rotate: 0deg; width: 16px; height: 16px;" aria-hidden="true" class="css-492dz9"><path fill-rule="evenodd" d="M20.593 10.91a1.25 1.25 0 0 1 0 2.18l-14.48 8.145a1.25 1.25 0 0 1-1.863-1.09V3.855a1.25 1.25 0 0 1 1.863-1.09l14.48 8.146Z" clip-rule="evenodd"></path></svg>
            </Button>
        {/if}
        
        <div class="spacer"></div>

        <!-- Build/reset buttons -->
        {#if canRun}
            <Button class="button" variant="destructive"  onclick={reset} disabled={ running } title="Reset">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 7L7 6L4.70711 3.70711L5.19868 3.21553C5.97697 2.43724 7.03256 2 8.13323 2C11.361 2 14 4.68015 14 7.93274C14 11.2589 11.3013 14 8 14C6.46292 14 4.92913 13.4144 3.75736 12.2426L2.34315 13.6569C3.90505 15.2188 5.95417 16 8 16C12.4307 16 16 12.3385 16 7.93274C16 3.60052 12.4903 0 8.13323 0C6.50213 0 4.93783 0.647954 3.78447 1.80132L3.29289 2.29289L1 0L0 1V7H6Z" fill="#ffffff"></path> </g></svg>
            </Button>
        {:else}
            <Button class="button" onclick={build} disabled={false} title="Assemble source">
                <svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>script [#1601]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-60.000000, -1919.000000)" fill="#ffffff"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M11,1769 L17,1769 L17,1767 L11,1767 L11,1769 Z M11,1765 L17,1765 L17,1763 L11,1763 L11,1765 Z M20,1763 L20,1761 C21.103,1761 22,1761.898 22,1763 L20,1763 Z M18,1775 C18,1776.103 17.103,1777 16,1777 L16,1773 L10,1773 L10,1763 C10,1761.898 10.897,1761 12,1761 L18,1761 L18,1775 Z M14,1777 L8,1777 C6.897,1777 6,1776.103 6,1775 L14,1775 L14,1777 Z M20,1759 L12,1759 C9.791,1759 8,1760.791 8,1763 L8,1773 L4,1773 L4,1775 C4,1777.21 5.791,1779 8,1779 L16,1779 C18.209,1779 20,1777.21 20,1775 L20,1765 L24,1765 L24,1763 C24,1760.791 22.209,1759 20,1759 L20,1759 Z" id="script-[#1601]"> </path> </g> </g> </g> </g></svg>
            </Button>
        {/if}
<!-- 
        <div class="spacer"></div>

        <Button class="button" onclick={stepBack} disabled={true} title="Step back">
            <svg fill="#ffffff" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z"></path></g></svg>
        </Button> -->

        <div class="spacer"></div>

        <!-- Step over -->
        <Button class="button" onclick={() => run(STEP_OVER)} disabled={running || hasRun || !canRun} title="Step over">
            <svg fill="#ffffff" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"></path></g></svg>
        </Button>

        <div class="spacer"></div>

        <!-- Step into -->
        <Button class="button" onclick={() => run(STEP_INTO)} disabled={running || hasRun || !canRun} title="Step into">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" transform="matrix(-1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.37115e-08 10L0 11L5 16L10 11V10L6 10L6 4L15 4V2L4 2L4 10H4.37115e-08Z" fill="#ffffff"></path> </g></svg>
        </Button>

        <div class="spacer"></div>

        <!-- Step out -->
        <Button class="button" onclick={() => run(STEP_OUT)} disabled={running || hasRun || !canRun} title="Step out">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.37115e-08 10L0 11L5 16L10 11V10L6 10L6 4L15 4V2L4 2L4 10H4.37115e-08Z" fill="#ffffff"></path> </g></svg>
        </Button>
        
    </div>
</div>

<style>
    .navbar {
        /* background: #E4E5E6; */
        height: 60px;
        display: flex;
        justify-content: center;
        background: #d4d0c8;
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
        overflow-x: auto;
    }

    :global(.button) {
        flex-grow: 5;
    }

    .spacer {
        min-width:5px;
        flex-grow: 10;
    }

</style>