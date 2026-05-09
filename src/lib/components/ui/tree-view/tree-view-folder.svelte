<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import { cn } from '$lib/utils.js';
	import type { TreeViewFolderProps } from './types';
	import DetailsIcon from '@lucide/svelte/icons/ellipsis-vertical';

	let {
		name,
		open = $bindable(true),
		icon,
		children,
		options
	}: TreeViewFolderProps = $props();

	let contextMenuOpen = $state(false);
	let anchor = $state<HTMLElement>();
	let contentAnchor = $state<HTMLElement|undefined>();

	function detailsButton() {
		if (!contextMenuOpen) {
			contentAnchor = anchor;
		}
		contextMenuOpen = !contextMenuOpen;
	}
</script>

<Collapsible.Root bind:open >
	<ContextMenu.Root bind:open={contextMenuOpen}>
		<ContextMenu.Trigger onauxclick={() => contentAnchor = undefined}>
			<div class="item" bind:this={anchor}>
				<Collapsible.Trigger class="w-full">
					<button class="flex place-items-center gap-1">
						{#if icon}
							{@render icon({ name, open })}
						{:else if open}
							<FolderOpenIcon class="size-4" />
						{:else}
							<FolderIcon class="size-4" />
						{/if}
						<span>{name}</span>
					</button>
				</Collapsible.Trigger>

				<button class="details" onmousedown={detailsButton}>
					<DetailsIcon class="size-4" />
				</button>
			</div>
		</ContextMenu.Trigger>
		{#if options}
            <ContextMenu.Content customAnchor={contentAnchor}>
                {@render options()}
            </ContextMenu.Content>
        {/if}
	</ContextMenu.Root>
	<Collapsible.Content class="ms-2 border-l">
		<div class="relative flex place-items-start">
			<div class="bg-border mx-2 h-full w-px"></div>
			<div class="flex flex-col w-full">
				{@render children?.()}
			</div>
		</div>
	</Collapsible.Content>
</Collapsible.Root>

<style>
	.item {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        width: 100%;
        border-radius: 5px;
        overflow: hidden;
    }

    .item:hover {
        background-color: rgba(97, 69, 37, 0.1);
    }

	.details {
        display: none;
        justify-content: center;
        align-items: center;
        width: 20px;
    }

    .item:hover .details {
        display: flex;
    }

	.details:hover {
        background-color: rgba(97, 69, 37, 0.2);
    }
</style>