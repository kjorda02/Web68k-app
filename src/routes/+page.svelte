<script lang="ts">
    import Navbar from '../components/Navbar.svelte';
    import Files from '../components/Files.svelte';
    import Editor from '../components/Editor.svelte';
    import Emulator from '../components/Emulator.svelte';
    import IO from '../components/IO.svelte';
    
    let isResizing = false;
    let sidebarWidth = 250;

    function startResizing() {
        isResizing = true;
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    
    function stopResizing() {
        isResizing = false;
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    }

    function resize(e) {
      if (isResizing) {
        const newWidth = Math.max(100, Math.min(400, e.clientX));
        sidebarWidth = newWidth;
      }
    }
    
  </script>
  
    <div id="ev">
        <Navbar />
        
        <div id="cont">
            
            <Files />
            
            <div 
                class="resizerh" 
                on:mousedown={startResizing}
            >
            </div>
            
            
            <div id="row">
                <Editor />
                
                <div class="resizerh"></div>
                
                <div id="rightcol">
                    <Emulator />
                    <div class="resizerv"></div>
                    <IO />
                </div>
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
    
  
    #cont {
        display: flex;
        overflow: hidden; /* IMPORTANTE!! */
        flex: 1;
        padding:5px;
    }
  
    #row {
        flex-grow: 1;
        height: 100%;
        display:flex;
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
    }

    .resizerv {
        height: 4px;
        width: 99%;
        cursor: row-resize;
    }
    
    .resizerh:hover, .resizerv:hover {
        background: #999;
    }

    .resizerh:active, .resizerv:active {
        background: #666;
    }

  </style>