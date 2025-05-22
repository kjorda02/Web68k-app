<script>
    var { grow = $bindable()} = $props();

</script>

<div id="mem" style:flex-grow={grow}></div>

<style>
    #mem {
        flex:1 0 0;
        background: #f5f6f6; /* #faf8f5; */
        border-radius: 5px;
    }
</style>