<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import * as ContextMenu from '$lib/components/ui/context-menu';
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import DetailsIcon from '@lucide/svelte/icons/ellipsis-vertical';
    import { EditorState } from "@codemirror/state"
    import Editor from './Editor.svelte';
    import { fromDate } from '@internationalized/date';

    const DEFAULT_FILE = `*-----------------------------------------------------------
* Title      :
* Written by :
* Date       :
* Description:
*-----------------------------------------------------------
    ORG $1000

START:                  ; first instruction of program
    
* Put program code here
    
    END START        ; last line of source
`;

    type FileTree = {
        children?: {
            [key: string]: FileTree;
        },
        content?: any;
        path: string;
    }

    let { width, editor } : { width:number, editor:Editor} = $props();

    if (Object.keys(localStorage).length === 0) {
        localStorage.setItem('/MAIN.X68', DEFAULT_FILE);
    }

    const items = Object.keys(localStorage);
    let tree = $state<FileTree>(generateTree("/"));
    let initialized = false;

    // Initialize once when editor becomes available
    $effect(() => {
        if (editor && !initialized) {
            initEditor();
            initialized = true;
        }
    });

    function generateTree(start: string) : FileTree {
        const tree : FileTree = {
            path: start,
            children: {}
        };

        for (let item of items) {
            const file = item.match(`^${start}([^/]*)$`);
            const dir = item.match(`^${start}([^/]+)/`);

            if (file) {
                tree.children[file[1]] = {
                    path: file[0],
                    content: null
                };
            }
            else if (dir) {
                tree.children[dir[1]] = generateTree(dir[0]);
            }
        }
        return tree;
    }

    // --- HANDLE FILE SWITCHING AND SAVE/RESTORE -----------------------------------
    let currentProject = $state<string>('Default project');
    let currentFile = $state<FileTree>(null);

    function initEditor() {
        editor.setSaveCallBack(save);
        switchFile(getDefaultFile(tree));
    }

    function save(state: EditorState) {
        if (!currentFile) return;
        currentFile.content = state;
        localStorage.setItem(currentFile.path, state.doc.toString());
    }

    // Finds a file to be selected at the start (needs to be recursive,
    // could be there are no files on root level)
    function getDefaultFile(root: FileTree) {
        const file = Object.values(root.children).find(child => !child.children);
        if (!file) {
            const dir = Object.values(root.children).find(child => child.children);
            return dir ? getDefaultFile(dir) : null;
        }
        return file;
    }

    function switchFile(targetFile:FileTree) {
        editor.setCurrentFilePath(targetFile.path);
        if (targetFile.content) {
            // File has been opened previously, restore editor state
            editor.switchState(targetFile.content);
        }
        else {
            // Need to load file from storage and create new editor state
            const file = localStorage.getItem(targetFile.path);
            const newState = editor.restoreState(file);
            targetFile.content = newState;
        }
        currentFile = targetFile;
    }

    export function getCurrentPath() {
        return currentFile.path;
    }

    function findFileByPath(root: FileTree, path: string): FileTree | null {
        for (const item of Object.values(root.children ?? {})) {
            if (!item.children && item.path === path) return item;
            if (item.children) {
                const found = findFileByPath(item, path);
                if (found) return found;
            }
        }
        return null;
    }

    export function switchToPath(path: string) {
        const file = findFileByPath(tree, path);
        if (file) switchFile(file);
    }

    // --- HANDLE RIGHT CLICK ACTIONS ---------------------------------------------
    let selectedName:string = $state(null);
    let selected:FileTree = null;

    let create = $state(false);
    let createName:string = $state(null);
    function handleCreate() {
        const path = selected.path+createName;
        selected.children[createName] = {
            path: path,
            content: null
        }
        localStorage.setItem(path, DEFAULT_FILE)

        create = false;
    }

    let rename = $state(false);
    let newName:string = $state(null);
    function handleRename() {
        if (!selected.children[selectedName].children) { // File renaming
            selected.children[newName] = selected.children[selectedName];
            delete selected.children[selectedName];

            const oldPath = selected.children[newName].path;
            const newPath = selected.path+newName;
            const content = localStorage.getItem(oldPath)
            localStorage.removeItem(oldPath)
            localStorage.setItem(newPath, content);
            selected.children[newName].path = newPath;
        }
        else {
            console.error('Directory renaming not implemented yet!')
        }
        
        rename = false;
    }

    let deleteItem = $state(false);
    function handleDelete(selected) {
        console.log('Delete item:', selected);
        // Implement delete logic
    }

    
    function handleDownload(selected) {
        console.log('Download item:', selected);
        // Implement download logic
    }
</script>

{#snippet renderTree(root: FileTree)}
    {#each Object.entries(root.children) as [name, item]}
        {#if !item.children }
            <TreeView.File {name} onclick={() => switchFile(item)} selected={currentFile === item}>
                {#snippet options()}
                    <ContextMenu.Item onclick={() => {selected = root; selectedName = name; rename = true} }>Rename</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDelete(item)}>Delete</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDownload(item)}>Download</ContextMenu.Item>
                {/snippet}
            </TreeView.File>
        {:else}
            <TreeView.Folder {name}>
                {@render renderTree(item)}

                {#snippet options()}
                    <ContextMenu.Item onclick={() => {selected = item; selectedName = name; create = true;} }>New File</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => {selected = item; selectedName = name; create = true}}>New Folder</ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onclick={() => rename = true}>Rename folder</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDelete(item)}>Delete recursively</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDownload(item)}>Download as Zip</ContextMenu.Item>
                {/snippet}
            </TreeView.Folder>
        {/if}
    {/each}
{/snippet}

<div class="files" style="width: {width}px">
    
    <div class="flex mb-2 gap-2">
        <Select.Root type="single" bind:value={currentProject}>
            <Select.Trigger class="grow" size="sm">
                {currentProject}
            </Select.Trigger>
            <Select.Content>
                <Select.Item value="DEFAULT">Light</Select.Item>
                <Select.Item value="dark">Dark</Select.Item>
                <Select.Item value="system">System</Select.Item>
            </Select.Content>
        </Select.Root>

        <Popover.Root>
            <Popover.Trigger>
                <button class="button px-4">
                    <DetailsIcon class="size-4" onclick={() => ''}/>
                </button>
            </Popover.Trigger>
            <Popover.Content>
                grdgdsg
            </Popover.Content>
          </Popover.Root>
    </div>
    

    <!-- <div class="flex justify-between">
        <button>New file</button>
        <button>New folder</button>
        <button>Options</button>
    </div> -->
    {#if tree}
    <TreeView.Root>
        {@render renderTree(tree)}
    </TreeView.Root>
    {/if}
</div>

<Dialog.Root bind:open={rename}>
    <Dialog.Content>
        <Dialog.Header>
        <Dialog.Title>Rename {selectedName}</Dialog.Title>
        </Dialog.Header>
        <Input bind:value={newName} defaultValue={selectedName} />
        <Dialog.Footer>
            <Button variant="outline" onclick={() => rename = false}>Cancel</Button>
            <Button type="submit" onclick={() => handleRename()}>Rename</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={create}>
    <Dialog.Content>
        <Dialog.Header>
        <Dialog.Title>New File in {selectedName}</Dialog.Title>
        </Dialog.Header>
        <Input bind:value={createName} />
        <Dialog.Footer>
            <Button variant="outline" onclick={() => create = false}>Cancel</Button>
            <Button type="submit" onclick={() => handleCreate()}>Create file</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style>
    .files {
        flex-shrink: 0;  /* IMPORTANTE!!! */
        background: #f1efeb; /* #e7ffee; */
        border-radius: 5px;
        height: 100%;
        padding: 1rem;
    }

    .files :global(button) {
        cursor: pointer;
    }

    button {
        border: 1px solid var(--border);
        border-radius: 5px;
        padding: 2px 5px 2px 5px;
        font-weight: 500;
        background: rgba(97, 69, 37, 0.08);
    }

    button:hover {
        color: white;
        background: var(--border);
    }
</style>