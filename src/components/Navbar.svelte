<script>
    import { onMount } from 'svelte';
    import { assemble } from '$lib/assembler.svelte';

    onMount(async () => {

    var code = `EDITINIT
    CLR.W   (SELVTX)    
    CLR.B   (EDITSTAT)     ; SELECT
    RTS`;

        localStorage.setItem('/folder/test.X68', code);

        setTimeout(() => {assemble(code);}, 1000);
        setTimeout(() => {assemble(code);}, 2000);
        // setTimeout(() => {assembleLst(code);}, 3000);
    });

</script>

<div class="navbar"></div>

<style>
    .navbar {
        background: #E4E5E6;
        height: 50px;
        display: flex;
    }

</style>