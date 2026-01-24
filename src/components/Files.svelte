<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import * as ContextMenu from '$lib/components/ui/context-menu';
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Details from '@lucide/svelte/icons/ellipsis-vertical';
    type FileTree = {
        children?: {
            [key: string]: FileTree;
        },
        content?: any;
        path: string;
    }

    let { width } = $props();

    let selectedName:string = $state(null);
    let selected:FileTree = null;
    let openFile = $state(null);
    const items = Object.keys(localStorage);
    const tree = $state(generateTree("/"));

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
                    content: {}
                };
            }
            else if (dir) {
                tree.children[dir[1]] = generateTree(dir[0]);
            }
        }
        return tree;
    }

    console.log(tree)

    let create = $state(false);
    let createName:string = $state(null);
    function handleCreate() {
        const path = selected.path+createName;
        selected.children[createName] = {
            path: path,
            content: {}
        }
        localStorage.setItem(path, 'empty file')

        create = false;
        console.log(selected)
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
            <TreeView.File {name} onclick={() => openFile=item} selected={openFile === item}>
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
    <TreeView.Root>
        {@render renderTree(tree)}
    </TreeView.Root>
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
        background: #f5f6f6; /* #faf8f5; */
        border-radius: 5px;
        height: 100%;
        padding: 1rem;
    }

    .files :global(button) {
        cursor: pointer;
    }
</style>