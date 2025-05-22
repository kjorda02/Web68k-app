<script>
    var { grow = $bindable()} = $props();

</script>

<div id="emulator" style:flex-grow={grow}></div>

<style>
    #emulator {
        flex:1 0 0;
        background: #f5f6f6; /* #f5f6f6 */
        border-radius: 5px;
    }

</style>