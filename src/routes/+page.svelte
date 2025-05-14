<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment'; 
    import Organizer from '../components/Organizer.svelte';

    import { initModule, assembleLst } from '$lib/assembler.svelte';

    const code = `
        ORG $1000
ETI     DC.W    7
START:
        LEA  ETI,A0
        MOVE.W  #1,A0
        END START
`;

    onMount(async () => {
        initModule();
        setTimeout(() => {assembleLst(code);}, 1000);

        setTimeout(() => {assembleLst(code);}, 2000);
    });
    
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
  
  <div class="ev">
    <div class="navbar">
    </div>
    
    <div class="cont">
      <div class="files" style="width: {sidebarWidth}px">
      </div>
      
      <div 
        class="resizer" 
        on:mousedown={startResizing}
      />
      
      <div class="panes">
        <Organizer />
      </div>
    </div>
  </div>
  
  <style>
    .ev {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #E4E5E6;
    }
  
    .navbar {
      background: #E4E5E6;
      height: 50px;
      display: flex;
    }
  
    .cont {
      display: flex;
      align-items: center;
      flex: 1;
      padding:5px;
    }
  
    .files {
      background: #f5f6f6;
      border-radius: 5px;
      height: 100%;
    }
  
    .resizer {
      width: 4px;
      height: 99%;
      cursor: col-resize;
    }
  
    .resizer:hover {
      background: #999;
    }
  
    .resizer:active {
      background: #666;
    }
  
    .panes {
      background: #f5f6f6;
      height: 100%;
      border-radius: 5px;
      flex: 1;
    }
  </style>