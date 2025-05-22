<script>
    let { width } = $props();


</script>

<div class="files" style="width: {width}px"></div>

<style>
    .files {
        flex-shrink: 0;  /* IMPORTANTE!!! */
        background: #f5f6f6; /* #faf8f5; */
        border-radius: 5px;
        height: 100%;
    }

</style>