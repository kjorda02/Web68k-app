<script lang="ts">
    import Navbar from '../components/Navbar.svelte';
    import Files from '../components/Files.svelte';
    import Editor from '../components/Editor.svelte';
    import Emulator from '../components/Emulator.svelte';
    import Memory from '../components/Memory.svelte';
    import IO from '../components/IO.svelte';
    import Resizer from '../components/Resizer.svelte';
    
    
    let sidebarWidth = $state(250); // For some reason it works without $state() too

    function startResizing() {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    
    function stopResizing() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    }

    function resize(e) {
        const newWidth = Math.max(100, Math.min(400, e.clientX));
        sidebarWidth = newWidth;
    }

    var editor:Editor =$state();

    var editorGrow:number = $state(3);
    var rightcolGrow:number = $state(2);

    var emulatorGrow:number = $state(1);
    var memGrow:number = $state(3);
    var ioGrow:number = $state(2);

    var rightcolp = $state();
    var row = $state();

  </script>
  
    <div id="ev">
        <Navbar {editor}/>

            <div id="row" bind:this={row}>
                <Files width={sidebarWidth}/>
            
                <div 
                    class="resizerh" 
                    on:mousedown={startResizing}
                >
                </div>

                <Editor bind:this={editor} bind:grow={editorGrow} />
                
                <Resizer horizontal={true} basis={sidebarWidth +8} parent={row} bind:grow1={editorGrow} bind:grow2={rightcolGrow} totalGrow={5} />
                
                <div id="rightcol" style:flex-grow={rightcolGrow} bind:this={rightcolp} >
                    <Emulator bind:grow={emulatorGrow} />
                    <Resizer horizontal={false} basis={8} parent={rightcolp} bind:grow1={emulatorGrow} bind:grow2={memGrow} totalGrow={6} />
                    <Memory bind:grow={memGrow} />
                    <Resizer horizontal={false} basis={8} parent={rightcolp} bind:grow1={memGrow} bind:grow2={ioGrow} totalGrow={6} />
                    <IO bind:grow={ioGrow} />
                </div>
            </div>
    </div>
  
  <style>

    :global(html) {
        font-size: 14px;
    }

    #ev {
        display: flex;
        flex-direction: column;
        height: 100vh;
        /* background: #E4E5E6; */
        background: #a7a094;
    }
  
    #row {
        display: flex;
        overflow: hidden; /* IMPORTANTE!! */ 
        height: 100%;
        margin:5px;
        flex-grow: 1;
    }

    #rightcol {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        min-width: 0
    }

    .resizerh {
        width: 4px;
        height: 99%;
        cursor: col-resize;
        align-self: center;
    }
    
    .resizerh:hover {
        background: #999;
    }

    .resizerh:active {
        background: #666;
    }

  </style>