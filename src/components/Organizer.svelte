<script lang="ts">
  import Emulator from './Emulator.svelte';
  import NewTab from './NewTab.svelte';
  import { onMount } from 'svelte';
 
  onMount(() => {
    // You can perform additional setup here if needed
  });
  
</script>

<div id="row">
  <div id="editor"></div>

  <div class="resizerh"></div>

  <div id="rightcol">
    <div id="emulator"></div>
    <div class="resizerv"></div>
    <div id="io"></div>
  </div>
</div>


<style>

  div {
    border-radius: 5px;
    background: #f5f6f6;
  }

  #row {
    height: 100%;
    display:flex;
  }

  #editor {
    width: 50%;
    background: purple;
  }

  #emulator {
    height: 65%;
    background: coral;
  }

  #io {
    flex:1;
    background: cyan;
  }

  #rightcol {
    flex:1;
    display: flex;
    flex-direction: column;
    background: yellow;
  }

  .resizerh {
    width: 4px;
    height: 99%;
  }

  .resizerv {
    height: 4px;
    width: 99%;
  }

  .resizerh, .resizerv {
    cursor: col-resize;
  }
  
  .resizerh:hover, .resizerv:hover {
    background: #999;
  }

  .resizerh:active, .resizerv:active {
    background: #666;
  }
  
</style>