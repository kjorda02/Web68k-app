<script lang="ts">
    var { horizontal, parent, totalGrow,
        basis = $bindable(),
        grow1 = $bindable(), 
        grow2 = $bindable(),
        //px1 = $bindable(),
        //px2 = $bindable()
    } = $props();
    
    const MINSIZE = 50; // In pixels

    var start:number;
    var startGrow1:number;
    var startGrow2:number;

    function startResizing(e) {
        start = horizontal ? e.clientX : e.clientY;
        startGrow1 = grow1;
        startGrow2 = grow2;
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        parent.classList.add('no-select');
    }
    
    function stopResizing() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        parent.classList.remove('no-select');
    }

    function resize(e) {
        const parentSize = horizontal ? getComputedStyle(parent).width : getComputedStyle(parent).height;
        const px = parseInt(parentSize, 10) - basis;
        const growperpx = totalGrow/px;

        var delta = horizontal ? e.clientX : e.clientY;
        delta -= start;

        var growdelta = delta * growperpx;
        growdelta = Math.max(growperpx*MINSIZE-startGrow1, Math.min(startGrow2 - (growperpx*MINSIZE), growdelta));

        // !!! Avoid awful, awful, subpixel rendering madness !!!

        grow1 = startGrow1 + growdelta;
        grow2 = startGrow2 - growdelta;

        // grow1 = nobodyLikesFractionalPixels(grow1, growperpx);
        // grow2 = nobodyLikesFractionalPixels(grow2, growperpx);
        
        console.log(grow2/growperpx);

        // console.log('grow1: '+grow1);
        // console.log('grow2: '+grow2);

        //console.log('growdelta: '+growdelta);

        //const newWidth = Math.max(100, Math.min(400, e.clientX));
    }

    function nobodyLikesFractionalPixels(grow: number, growperpx:number) {
        let px = grow/growperpx;
        return Math.round(px)*growperpx;
    }


</script>

<div>
    

</div>

<div class="{horizontal ? "resizerh" : "resizerv"}" onmousedown={startResizing}></div>

<style>
    :global(.no-select) {
        user-select: none;
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