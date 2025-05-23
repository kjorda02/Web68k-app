<script lang="ts">
    import CodeMirror from "svelte-codemirror-editor";
    import { duotoneLight, duotoneLightInit, duotoneDark } from '@uiw/codemirror-theme-duotone';
    import { basicSetup } from 'codemirror';
    import { EditorView, keymap, gutter, GutterMarker, lineNumbers } from '@codemirror/view';
    import { EditorState, Compartment, StateEffect, EditorSelection } from "@codemirror/state"
    import {indentWithTab, indentMore, indentLess} from "@codemirror/commands"
    import Stack from "./Stack.svelte";
    import { disableScrollHandling } from "$app/navigation";
    import { lineAddrs } from '$lib/assembler.svelte';

    var { grow = $bindable()} = $props();

    // --- SETUP -----------------------------------------------------------------
    var value = $state("");
    var view:EditorView;
    var editable:boolean = $state(true);
    var pointer:string = $state("auto");
    const tabSize:number = 4;
    var saved:Boolean = true;
    var stoppedWriting:Boolean = true;

    if (!localStorage.getItem('/MAIN.X68')) {
        var code = `*-----------------------------------------------------------
* Title      :
* Written by :
* Date       :
* Description:
*-----------------------------------------------------------
    ORG $1000
    INCLUDE "folder/test.X68"
ETI     DS.W    7
START:                  ; first instruction of program
    
* Put program code here
    
    LEA  ETI,A0
    MOVE.W  #1,(A0)

    END START        ; last line of source
`;
        localStorage.setItem('/MAIN.X68', code);
    }

    value = localStorage.getItem('/MAIN.X68');


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
            view.dispatch({
                changes: {
                    from: cursor.head, 
                    to: cursor.head, 
                    insert: spaces 
                },
                selection: {anchor: cursor.head + spaces.length, head: cursor.head + spaces.length}
            });
            
            return true;
        },

        shift: (view) => {
            return indentLess(view);
        }
    }]);


    // --- SAVING -----------------------------------------------------------------
    const updateListener = EditorView.updateListener.of(update => {
        if (update.docChanged) {
            saved = false;
            stoppedWriting = false;
        }
    });

    setInterval(() => {
        if (!saved && stoppedWriting) {
            localStorage.setItem('/MAIN.X68', value);
            saved = true;
        }
        
        stoppedWriting = true;
    }, 1000);


    // --- EXPORTS -----------------------------------------------------------------
    var savedState:EditorState;
    var scroll;

    
    export function debugMode() {
        editable = false;
        pointer="none";
        
        if (!saved) { // Make sure assembler has latest changes

            // value doesn't update fast enough apparently so we use doc
            localStorage.setItem('/MAIN.X68', view.state.doc.toString());
            saved = true;
        }

        savedState = view.state;
        scroll = view.scrollSnapshot();

    }

    export function scrollToLine(lineNumber: number) {

        // Get the position of the start of the line
        const lineStart = view.state.doc.line(lineNumber).from;
        
        var selection:EditorSelection = EditorSelection.single(lineStart);

        // Scroll the line into view
        // EditorView.scrollPastEnd
        view.dispatch({
            selection: selection,
            effects: EditorView.scrollIntoView(selection.ranges[0], { y: "center" })
        });
    }

    export function editMode() {
        addrGutters(false);
        editable = true;
        pointer="auto";
        view.setState(savedState);
        view.dispatch({
            effects: scroll
        });

        // TODO: Set focus
    }
    
    //setTimeout(() => {scrollToLine(50)}, 5000);

    //setTimeout(() => {editMode()}, 8000);

    class AddressMarker extends GutterMarker {
        address:number;

        constructor(addr:number) {
            super();
            this.address = addr;
        }
        toDOM() { return document.createTextNode(this.address.toString(16).toUpperCase()) }
    }

    let gutterCompartment = new Compartment;

    const emptyLineGutter = [
        
        gutter({
            class: "cm-addr-gutter",
            lineMarker(view, line) {;
                const lineNumber = view.state.doc.lineAt(line.from).number;
                if (lineAddrs['/MAIN.X68'][lineNumber]) {
                    return new AddressMarker(lineAddrs['/MAIN.X68'][lineNumber]);
                }
                else {
                    return null;
                }
            },
            initialSpacer: () => new AddressMarker(1)
        }),
        EditorView.baseTheme({
            ".cm-addr-gutter .cm-gutterElement": {
                paddingLeft: "1em",
                color: "#9db6fc", // #82a3ff
                textAlign: "right"
            }
        })
    ];

    const lineNumbersThemeing = [
        EditorView.baseTheme({
            ".cm-lineNumbers .cm-gutterElement": {
                paddingLeft: "1em",
                paddingRight: "0px",
                textAlign: "right"
            }
        })
    ];
    
    

    export function addrGutters(enable: boolean) {
        view.dispatch({
            effects: gutterCompartment.reconfigure(enable ? emptyLineGutter : [])
        });

        if (enable) {
            console.log(lineAddrs);
            console.log(lineAddrs['/MAIN.X68'][9]);
        }
    }

</script>


<div id="editor" style:flex-grow={grow} style:--pointer={pointer}>

    
    <CodeMirror bind:value lang={null} {tabSize} lineWrapping={true} {editable}
    basic={false} useTab={false} extensions={[gutterCompartment.of([]), lineNumbersThemeing, tab, updateListener, basicSetup ]} 
    on:ready={(e) => { view = e.detail; } }
        
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

    :global(.cm-content) {
        pointer-events: var(--pointer);
        user-select: var(--pointer); /* IMPORTANTE PARA FIREFOX */
    }

    :global(.cm-editor) {
        height: 100%;
    }

    :global(.cm-gutters) {
        border-right-color: #dddddd !important;
    }

</style>