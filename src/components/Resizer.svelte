<script lang="ts">
    var { horizontal, parent, totalGrow,
        basis = $bindable(),
        grow1 = $bindable(), 
        grow2 = $bindable(),
        //px1 = $bindable(),
        //px2 = $bindable()
    } = $props();
    
    const MINSIZE = 50; // In pixels

    var start;
    var startGrow1;
    var startGrow2;

    function startResizing(e) {
        start = horizontal ? e.clientX : e.clientY;
        startGrow1 = grow1;
        startGrow2 = grow2;
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    
    function stopResizing() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    }

    function resize(e) {
        const parentSize = horizontal ? getComputedStyle(parent).width : getComputedStyle(parent).height;
        const px = parseInt(parentSize, 10) - basis;
        const growperpx = totalGrow/px;

        var delta = horizontal ? e.clientX : e.clientY;
        delta -= start;

        var growdelta = delta * growperpx;
        growdelta = Math.max(growperpx*MINSIZE-startGrow1, Math.min(startGrow2 - (growperpx*MINSIZE), growdelta));

        grow1 = startGrow1 + growdelta;
        grow2 = startGrow2 - growdelta;

        console.log('grow1: '+grow1);
        console.log('grow2: '+grow2);

        //console.log('growdelta: '+growdelta);

        //const newWidth = Math.max(100, Math.min(400, e.clientX));
    }


</script>

<div>
    

</div>

<div class="{horizontal ? "resizerh" : "resizerv"}" onmousedown={startResizing}></div>

<style>
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