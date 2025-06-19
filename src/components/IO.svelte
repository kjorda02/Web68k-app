<script lang="ts">
    var { grow = $bindable()} = $props();

</script>

<div id="io" style:flex-grow={grow}>
    <div id="display">
        {#each {length: 8}, i}
            <div class="digit">
                <div class="hsegment s1"></div>
                <div class="vsegment s2"></div>
                <div class="vsegment s3"></div>
                <div class="hsegment s4"></div>
                <div class="vsegment s5"></div>
                <div class="vsegment s6"></div>
                <div class="hsegment s7"></div>
                <div class="dotsegment s8"></div>
            </div>
        {/each}
    </div>
</div>

<style>
    #io {
        flex:1 0 0;
        padding:2rem;
        background: #f5f6f6; /* #faf8f5; */
        border-radius: 5px;
        background: #d4d0c8;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: auto;
    }

    #display {
        display: flex;
        gap: 5px;
        padding: 0.5rem;
        background: black;
    }

    .digit {
        width: 35px;
        height: 53px;
        position: relative;
    }

    .vsegment {
        position: absolute;
        background: red;
        width: 3px;
        height: 20px;
    }

    .hsegment {
        position: absolute;
        background: red;
        height: 3px;
        width: 20px;
    }

    .dotsegment {
        position: absolute;
        background: red;
        height: 3px;
        width: 3px;
    }

    .s1 {
        top: 0px;
        left: 4px;
    }

    .s2 {
        top: 4px;
        left: 25px;
    }

    .s3 {
        bottom: 4px;
        left: 25px;
    }

    .s4 {
        bottom: 0px;
        left: 4px;
    }

    .s5 {
        bottom: 4px;
        left: 0px;
    }

    .s6 {
        top: 4px;
        left: 0px;
    }

    .s7 {
        top: 25px;
        left: 4px;
    }

    .s8 {
        right: 0px;
        bottom: 0px;
    }
</style>