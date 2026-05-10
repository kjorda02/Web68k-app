<script lang="ts">
    import CodeMirror from "svelte-codemirror-editor";
    import { duotoneLight, duotoneLightInit, duotoneDark, duotoneDarkInit } from '@uiw/codemirror-theme-duotone';
    import { basicSetup } from 'codemirror';
    import { EditorView, keymap, gutter, GutterMarker, lineNumbers, Decoration, ViewUpdate } from '@codemirror/view';
    import { EditorState, Compartment, StateEffect, EditorSelection, StateField, Annotation, Facet, Prec } from "@codemirror/state";
    import { indentMore, indentLess } from "@codemirror/commands";
    import { lineAddrs } from '$lib/assembler.svelte';
    import { cpu } from '$lib/cpu.svelte';
    import { m68k, m68kHighlightStyle } from "$lib/language/language";
    import { syntaxHighlighting } from "@codemirror/language";

    var { grow = $bindable()} = $props();

    // --- SETUP -----------------------------------------------------------------
    var value = $state("");
    var view:EditorView;
    var editable:boolean = $state(true);
    var pointer:string = $state("auto");
    const tabSize:number = 4;

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

    // --- SAVING/RESTORING ---------------------------------------------------------
    var saved:Boolean = true;
    var stoppedWriting:Boolean = true;
    let save: (state: EditorState) => void;
    
    const updateListener = EditorView.updateListener.of(update => {
        if (update.docChanged) {
            saved = false;
            stoppedWriting = false;
        }
    });

    setInterval(() => {
        if (!saved && stoppedWriting) {
            //localStorage.setItem('/MAIN.X68', value);
            save(view.state);
            saved = true;
        }
        
        stoppedWriting = true;
    }, 1000);

    export function restoreState(file: string): EditorState {
        const newState = EditorState.create({
            doc: file,
            extensions: extensions
        });

        save(view.state);
        view.setState(newState);

        return newState;
    }

    export function switchState(state: EditorState) {
        save(view.state);
        view.setState(state);
    }

    export function setSaveCallBack(func) {
        save = func;
    }

    // --- EXPORTS -----------------------------------------------------------------
    let currentFilePath = $state<string>(null);

    export function setCurrentFilePath(path: string) {
        currentFilePath = path;
    }

    var savedState:EditorState;
    var scroll;

    
    export function debugMode() {
        editable = false;
        pointer="none";
        
        if (!saved) { // Make sure assembler has latest changes

            // value doesn't update fast enough apparently so we use doc
            //localStorage.setItem('/MAIN.X68', view.state.doc.toString());
            save(view.state);
            saved = true;
        }

        savedState = view.state;
        scroll = view.scrollSnapshot();

    }

    // TODO: Make it so nothing is selected after exiting program?
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
        
        let breakpoints = view.state.field(breakpointState); 
        view.setState(savedState); // Restore cursor position and selections

        view.dispatch({
            effects: [
                setAllBreakpointsEffect.of(breakpoints), // Keep new breakpoints
                scroll // Restore scroll position
            ]
        });

        // TODO: Set focus
    }
    
    //setTimeout(() => {scrollToLine(50)}, 5000);

    //setTimeout(() => {editMode()}, 8000);


    // --- ADDRESS GUTTERS -----------------------------------------------
    class AddressMarker extends GutterMarker {
        address:number;

        constructor(addr:number) {
            super();
            this.address = addr;
        }
        toDOM() { return document.createTextNode(this.address.toString(16).toUpperCase()) }
    }

    let gutterCompartment = new Compartment;

    const addressGutter = [
        
        gutter({
            class: "cm-addr-gutter",
            lineMarker(view, line) {
                const lineNumber = view.state.doc.lineAt(line.from).number;
                if (lineAddrs[currentFilePath]?.[lineNumber]) {
                    return new AddressMarker(lineAddrs[currentFilePath][lineNumber]);
                }
                return null;
            },
            initialSpacer: () => new AddressMarker(1)
        }),
        EditorView.baseTheme({
            ".cm-addr-gutter .cm-gutterElement": {
                paddingLeft: "1em",
                color: "#82a3ff", // #9db6fc
                textAlign: "right"
            }
        })
    ];

    export function addrGutters(enable: boolean) {
        view.dispatch({
            effects: gutterCompartment.reconfigure(enable ? addressGutter : [])
        });

        if (enable) {
            // console.log(lineAddrs);
            // console.log(lineAddrs['/MAIN.X68'][9]);
            setBpAddrs();
        }
    }

    // --- BREAKPOINTS -----------------------------------------------

    const breakpointEffect = StateEffect.define<{pos: number, on: boolean}>({
        map: (val, mapping) => ({pos: mapping.mapPos(val.pos), on: val.on})
    });

    const setAllBreakpointsEffect = StateEffect.define<Set<number>>();

    const breakpointDecoration = Decoration.line({
        attributes: { class: "cm-breakpoint-line" }
    });

    const breakpointState = StateField.define<Set<number>>({
        create() { return new Set() },
        update(set, transaction) {

            if (transaction.docChanged) { // Map existing positions to account for document changes
                let newSet = new Set<number>();

                for (let pos of set) {
                    newSet.add(transaction.changes.mapPos(pos));
                }
                return newSet;
            }
            
            // Process breakpoint toggling effects
            for (let e of transaction.effects) {
                if (e.is(setAllBreakpointsEffect)) {
                    return e.value; // Replace the entire set
                }
                if (e.is(breakpointEffect)) {
                    let newSet = new Set<number>(set); // copy (need to change ref to trigger provide)

                    if (e.value.on) {
                        newSet.add(e.value.pos)
                    } else {
                        newSet.delete(e.value.pos)
                    }

                    return newSet;
                }
            }

            return set;
        },
        // Runs whenever the set is updated
        provide: f => EditorView.decorations.from(f, breakpoints => {
            let decorations = []
            for (let pos of breakpoints) {
                decorations.push(breakpointDecoration.range(pos));
            }
            decorations.sort((a, b) => a.from - b.from);
            return Decoration.set(decorations);
        })
    });

    let lineNumberCompartment = new Compartment();

    // Toggles breakpoint in the editor's ui
    function toggleBreakpoint(view: EditorView, pos: number) {
        const breakpoints = view.state.field(breakpointState);
        const hasBreakpoint = breakpoints.has(pos);
        
        view.dispatch({
            effects:  [
                breakpointEffect.of({pos, on: !hasBreakpoint}), // Toggle breakpoint
                lineNumberCompartment.reconfigure(createLineNumbers()) // Re-draw line numbers
            ]
        });
    }

    function createLineNumbers() {
        return lineNumbers({
            formatNumber(lineNo, state) {
                if (lineNo > state.doc.lines) {return String(lineNo)} // initialSpacer call
                
                const line = state.doc.line(lineNo);
                let breakpoints = state.field(breakpointState); // Get up-to-date breakpoints

                if (breakpoints.has(line.from)) {
                    return "💔";
                }
                
                return String(lineNo);
            },
            domEventHandlers: {
                mousedown(view, line) {
                    if (!editable) { // If we have assembled the program and know the address of each line
                        let num = view.state.doc.lineAt(line.from).number;
                        if (lineAddrs[currentFilePath]?.[num]) { // Only add the breakpoint if that line has an address associated with it
                            toggleBreakpoint(view, line.from);
                            cpu.setBreakpoint(lineAddrs[currentFilePath][num]); // Toggles the breakpoint
                        }
                    }
                    else {
                        toggleBreakpoint(view, line.from); // Always use line's first position for breakpoint
                    }

                    return true;
                }
            }
        });
    }

    const myLineNumbers = [
        lineNumberCompartment.of(createLineNumbers()),

        EditorView.baseTheme({
            ".cm-lineNumbers .cm-gutterElement": {
                paddingLeft: "1em",
                paddingRight: "0px",
                textAlign: "right",
                cursor: "default"
            },
            ".cm-breakpoint-line": {
                backgroundColor: "rgba(255, 0, 0, 0.1)"
            }
        })
    ];

    // Adds initial breakpoints after assembling program. More can be added after assembling
    function setBpAddrs() {
        const breakpoints = view.state.field(breakpointState); // Get breakpoints from codemirror

        for (let pos of breakpoints) { // For each breakpoint
            let num = view.state.doc.lineAt(pos).number; // Get the line number

            if (lineAddrs[currentFilePath]?.[num]) {
                const addr = lineAddrs[currentFilePath][num]; // Get the address of line
                cpu.setBreakpoint(addr, true); // Add breakpoint to cpu
            }
            else {
                toggleBreakpoint(view, pos); // If no address associated, remove invalid breakpoint from ui
            }
        }
    }
    
    const extensions = [
        gutterCompartment.of([]), 
        breakpointState, 
        myLineNumbers, 
        tab, 
        updateListener, 
        basicSetup, 
        m68k(), 
        Prec.high(syntaxHighlighting(m68kHighlightStyle)),
        duotoneLightInit({
            settings: {
                caret: '#c6c6c6',
                fontFamily: 'monospace',
            }
        })
    ];
</script>


<div id="editor" style:flex-grow={grow} style:--pointer={pointer}>

    
    <CodeMirror bind:value lang={null} {tabSize} lineWrapping={true} {editable}
    basic={false} useTab={false} extensions={extensions} 
    on:ready={(e) => { view = e.detail; } }
    />
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