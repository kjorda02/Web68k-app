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

    var editor:number = $state(1);
    var rightcol:number = $state(1);

    var emulator:number = $state(1);
    var mem:number = $state(3);
    var io:number = $state(2);

    var rightcolp = $state();
    var row = $state();

  </script>
  
    <div id="ev">
        <Navbar />

            <div id="row" bind:this={row}>
                <Files width={sidebarWidth}/>
            
                <div 
                    class="resizerh" 
                    on:mousedown={startResizing}
                >
                </div>

                <Editor bind:grow={editor} />
                
                <Resizer horizontal={true} basis={sidebarWidth +8} parent={row} bind:grow1={editor} bind:grow2={rightcol} totalGrow={2} />
                
                <div id="rightcol" style:flex-grow={rightcol} bind:this={rightcolp} >
                    <Emulator bind:grow={emulator} />
                    <Resizer horizontal={false} basis={8} parent={rightcolp} bind:grow1={emulator} bind:grow2={mem} totalGrow={6} />
                    <Memory bind:grow={mem} />
                    <Resizer horizontal={false} basis={8} parent={rightcolp} bind:grow1={mem} bind:grow2={io} totalGrow={6} />
                    <IO bind:grow={io} />
                </div>
            </div>
    </div>
  
  <style>

    #ev {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #E4E5E6;
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
    }

    .resizerh {
        width: 4px;
        height: 99%;
        cursor: col-resize;
        align-self: center;
    }

    .resizerv {
        height: 4px;
        width: 99%;
        cursor: row-resize;
        align-self: center;
    }
    
    .resizerh:hover, .resizerv:hover {
        background: #999;
    }

    .resizerh:active, .resizerv:active {
        background: #666;
    }

  </style>