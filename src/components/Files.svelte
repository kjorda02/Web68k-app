<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import * as ContextMenu from '$lib/components/ui/context-menu';
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
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

    let newFileDialogOpen = $state(false);
    function handleNewFile(selected) {
        console.log('Create new file in:', selected);
        // Implement file creation logic
    }

    function handleNewFolder(selected) {
        console.log('Create new folder in:', selected);
        // Implement folder creation logic
    }

    let renameDialogOpen = $state(false);
    let newName:string = $state(null);
    function handleRename() {
        selected.children[newName] = selected.children[selectedName];
        delete selected.children[selectedName];

        const oldPath = selected.children[newName].path;
        const newPath = selected.path+newName;
        const content = localStorage.getItem(oldPath)
        localStorage.removeItem(oldPath)
        localStorage.setItem(newPath, content);
        selected.children[newName].path = newPath;
        
        renameDialogOpen = false;
        console.log('Rename item:', selected);
    }

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
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <TreeView.File {name} />
                </ContextMenu.Trigger>
                <ContextMenu.Content>
                    <ContextMenu.Item onclick={() => {selected = root; selectedName = name; renameDialogOpen = true} }>Rename</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDelete(item)}>Delete</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDownload(item)}>Download</ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
        {:else}
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <TreeView.Folder {name}>
                        {@render renderTree(item)}
                    </TreeView.Folder>
                </ContextMenu.Trigger>
                <ContextMenu.Content>
                    <ContextMenu.Item onclick={() => handleNewFile(item)}>New File</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleNewFolder(item)}>New Folder</ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onclick={() => renameDialogOpen = true}>Rename folder</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDelete(item)}>Delete recursively</ContextMenu.Item>
                    <ContextMenu.Item onclick={() => handleDownload(item)}>Download as Zip</ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
        {/if}
    {/each}
{/snippet}

<div class="files" style="width: {width}px">
    <TreeView.Root>
        {@render renderTree(tree)}
    </TreeView.Root>
</div>

<Dialog.Root bind:open={renameDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
        <Dialog.Title>Rename {selectedName}</Dialog.Title>
        </Dialog.Header>
        <Input id="name-1" name="name" bind:value={newName} defaultValue={selectedName} />
        <Dialog.Footer>
            <Button variant="outline" onclick={() => renameDialogOpen = false}>Cancel</Button>
            <Button type="submit" onclick={() => handleRename()}>Rename</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={renameDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
        <Dialog.Title>New File in {selectedName}</Dialog.Title>
        </Dialog.Header>
        <Input id="name-1" name="name" bind:value={newName} defaultValue={selectedName} />
        <Dialog.Footer>
            <Button variant="outline" onclick={() => renameDialogOpen = false}>Cancel</Button>
            <Button type="submit" onclick={() => handleRename()}>Rename</Button>
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

    .files :global(button:hover) {
        background-color: rgba(0, 0, 0, 0.05);
    }
</style>