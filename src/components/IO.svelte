<script lang="ts">
    var { grow = $bindable()} = $props();

</script>

<div id="io" style:flex-grow={grow}></div>

<style>
    #io {
        flex:1 0 0;
        background: #f5f6f6; /* #faf8f5; */
        border-radius: 5px;
        background: #d4d0c8;
    }
</style>