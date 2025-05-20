<script>
    import { onMount } from 'svelte';
    import { assemble } from '$lib/assembler.svelte';

    var code = `
    ORG $1000
    INCLUDE "folder/test.X68"
ETI     DS.W    7
START:
    LEA  ETI,A0
    MOVE.W  #1,(A0)
    END START
`;


    onMount(async () => {
        localStorage.setItem('/source.X68', code);

    code = `EDITINIT
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