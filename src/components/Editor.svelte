<script lang="ts">
    import CodeMirror from "svelte-codemirror-editor";
    import { duotoneLight, duotoneLightInit, duotoneDark } from '@uiw/codemirror-theme-duotone';
    import { EditorView, keymap } from '@codemirror/view';
    import { EditorState, Compartment, StateEffect } from "@codemirror/state"
    import {indentWithTab, indentMore, indentLess} from "@codemirror/commands"
    import Stack from "./Stack.svelte";
    import { disableScrollHandling } from "$app/navigation";

    let value = "";
    let view: EditorView;
    var editable = true;
    const tabSize = 4;

    const tab = keymap.of([{
        key: "Tab",
        run: (view) => {
            // Get the current cursor position
            const cursor = view.state.selection.main;
            const line = view.state.doc.lineAt(cursor.head);
            if (cursor.head !== cursor.anchor) {
                return indentMore(view);
            }

            const len = cursor.head - line.from;
            const spaces = " ".repeat(tabSize-(len%tabSize));

            // Create a transaction to insert spaces at the cursor position
            const transaction = view.state.update({
            changes: {
                from: cursor.head, 
                to: cursor.head, 
                insert: spaces 
            },
            selection: {anchor: cursor.head + spaces.length, head: cursor.head + spaces.length}
            });
            // Apply the transaction
            view.dispatch(transaction);
            
            return true;
        },

        shift: (view) => {
            return indentLess(view);
        }
    }]);


    function scrollToLine(lineNumber: number) {
        if (!view) return;
        
        // Convert 1-based line number to 0-based if needed
        const line = lineNumber - 1;
        
        // Get the position of the start of the line
        const lineStart = view.state.doc.line(lineNumber).from;
        
        // Create a selection at the start of the line
        const selection = {anchor: lineStart, head: lineStart};
        
        // Scroll the line into view
        view.dispatch({
            selection,
            scrollIntoView: true
        });
    }

    setTimeout(() => scrollToLine(70), 12000);

</script>

<div id="editor">

    <CodeMirror bind:value lang={null} {tabSize} lineWrapping={true} {editable}
    useTab={false} extensions={[tab]}
    on:ready={(e) => view = e.detail}
        
    theme={duotoneLightInit({
        settings: {
            caret: '#c6c6c6',
            fontFamily: 'monospace',
        }
      })
    }/>

</div>


<style>
    #editor {
        flex: 1 1 0;
        display:flex;
        align-items: stretch;
        border-radius: 5px;
        overflow: hidden;
    }

    :global(.codemirror-wrapper) {
        flex-grow: 1;
    }

    :global(.cm-editor) {
        height: 100%;
    }

    :global(.cm-gutters) {
        border-right-color: #dddddd !important;
    }

</style>