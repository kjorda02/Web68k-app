<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import * as ContextMenu from '$lib/components/ui/context-menu';
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { EditorState } from "@codemirror/state"
    import Editor from './Editor.svelte';
    import JSZip from 'jszip';

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

    const NEW_FILE = `*-----------------------------------------------------------
* Title      :
* Written by :
* Date       :
* Description:
*-----------------------------------------------------------

* Put program code here

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
        // Lazily create and cache the editor state the first time a file is opened
        targetFile.content ??= editor.createState(localStorage.getItem(targetFile.path));
        editor.switchState(targetFile.path, targetFile.content);
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
    let createIsFolder = $state(false);
    let createName:string = $state(null);
    function handleCreate() {
        if (createIsFolder) {
            const path = selected.path+createName+'/';
            selected.children[createName] = { path, children: {} };
        } else {
            const path = selected.path+createName;
            selected.children[createName] = { path, content: null };
            localStorage.setItem(path, NEW_FILE);
        }

        create = false;
        createName = null;
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

    function deleteFolder(folder: FileTree) {
        for (const child of Object.values(folder.children)) {
            if (!child.children) localStorage.removeItem(child.path);
            else deleteFolder(child);
        }
    }

    let deleteConfirm = $state(false);
    let deletePending: { parent: FileTree, name: string } | null = null;

    function handleDelete(parent: FileTree, name: string) {
        deletePending = { parent, name };
        deleteConfirm = true;
    }

    function confirmDelete() {
        const { parent, name } = deletePending!;
        const item = parent.children[name];
        if (!item.children) {
            localStorage.removeItem(item.path);
            if (currentFile === item) {
                const other = Object.values(parent.children).find(c => c !== item && !c.children)
                    ?? getDefaultFile(tree);
                if (other && other !== item) switchFile(other);
                else currentFile = null;
            }
        } else {
            deleteFolder(item);
        }
        delete parent.children[name];
        deleteConfirm = false;
        deletePending = null;
    }

    
    function handleDownload(item: FileTree) {
        if (!item.children) {
            const content = localStorage.getItem(item.path) ?? item.content?.doc.toString() ?? '';
            const filename = item.path.split('/').at(-1)!;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const zip = new JSZip();
            collectFiles(item, item.path, zip);
            const folderName = item.path.replace(/\/$/, '').split('/').at(-1) || 'archive';
            zip.generateAsync({ type: 'blob' }).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = folderName + '.zip';
                a.click();
                URL.revokeObjectURL(url);
            });
        }
    }

    function collectFiles(node: FileTree, rootPath: string, zip: JSZip) {
        for (const child of Object.values(node.children)) {
            if (!child.children) {
                const content = localStorage.getItem(child.path) ?? child.content?.doc.toString() ?? '';
                zip.file(child.path.slice(rootPath.length), content);
            } else {
                collectFiles(child, rootPath, zip);
            }
        }
    }

    function openFilePicker(folder = false) {
        const input = document.createElement('input');
        input.type = 'file';
        if (folder) input.setAttribute('webkitdirectory', '');
        else input.multiple = true;
        input.onchange = async () => {
            for (const file of Array.from(input.files ?? [])) {
                const parts = folder
                    ? (file as any).webkitRelativePath.split('/')  // keep top-level folder name
                    : [file.name];
                let node = selected;
                for (const part of parts.slice(0, -1)) {
                    if (!node.children[part]) {
                        node.children[part] = { path: node.path + part + '/', children: {} };
                    }
                    node = node.children[part];
                }
                const filename = parts.at(-1)!;
                const path = node.path + filename;
                node.children[filename] = { path, content: null };
                localStorage.setItem(path, await file.text());
            }
            create = false;
        };
        input.click();
    }
</script>

{#snippet renderTree(root: FileTree)}
    {#each Object.entries(root.children) as [name, item]}
        {#if !item.children }
            <TreeView.File {name} onclick={() => switchFile(item)} selected={currentFile === item}>
                {#snippet options()}
                    <ContextMenu.Item onclick={() => {selected = root; selectedName = name; rename = true} }>Rename</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDelete(root, name)}>Delete</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDownload(item)}>Download</ContextMenu.Item>
                {/snippet}
            </TreeView.File>
        {:else}
            <TreeView.Folder {name}>
                {@render renderTree(item)}

                {#snippet options()}
                    <ContextMenu.Item onclick={() => {selected = item; selectedName = name; createIsFolder = false; create = true;} }>New File</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => {selected = item; selectedName = name; createIsFolder = true; create = true}}>New Folder</ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onclick={() => rename = true}>Rename folder</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDelete(root, name)}>Delete recursively</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDownload(item)}>Download as Zip</ContextMenu.Item>
                {/snippet}
            </TreeView.Folder>
        {/if}
    {/each}
{/snippet}

<div class="files" style="width: {width}px">
    
    <div class="flex mb-2 gap-2">
        <button class="button grow" onclick={() => { selected = tree; selectedName = '/'; create = true; createIsFolder = false; }}>New file</button>
        <button class="button grow" onclick={() => { selected = tree; selectedName = '/'; create = true; createIsFolder = true; }}>New folder</button>
    </div>
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
        <Dialog.Title>{createIsFolder ? 'New Folder' : 'New File'} in {selectedName}</Dialog.Title>
        </Dialog.Header>
        <Input bind:value={createName} />
        <div class="upload-row">
            <span class="or-divider">or</span>
            <Button variant="outline" onclick={() => openFilePicker(createIsFolder)}>
                Upload {createIsFolder ? 'folder' : 'file'}
            </Button>
        </div>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => create = false}>Cancel</Button>
            <Button type="submit" onclick={() => handleCreate()}>{createIsFolder ? 'Create folder' : 'Create file'}</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteConfirm}>
    <Dialog.Content>
        <Dialog.Header>
        <Dialog.Title>Delete {deletePending?.name}?</Dialog.Title>
        <Dialog.Description>
            {deletePending?.parent.children[deletePending.name]?.children
                ? 'This will permanently delete the folder and all its contents.'
                : 'This will permanently delete the file.'}
        </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => deleteConfirm = false}>Cancel</Button>
            <Button variant="destructive" onclick={confirmDelete}>Delete</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style>
    .upload-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .or-divider {
        color: var(--muted-foreground, #888);
        font-size: 0.85em;
        white-space: nowrap;
    }

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