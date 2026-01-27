<script lang="ts">
	import FileIcon from '@lucide/svelte/icons/file';
	import { cn } from '$lib/utils.js';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import type { TreeViewFileProps } from './types';
	import DetailsIcon from '@lucide/svelte/icons/ellipsis-vertical';

	let { 
		name,
		icon,
		type = 'button',
		class: className,
		options,
		selected = false,
		...rest
	}: TreeViewFileProps = $props();

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


<ContextMenu.Root bind:open={contextMenuOpen}>
	<ContextMenu.Trigger onauxclick={() => contentAnchor = undefined}>
		<div class={['item', {open: selected}]} bind:this={anchor}>
			<button {type} class={cn('flex place-items-center gap-1 pl-[3px] w-full', className)} {...rest}>
				{#if icon}
					{@render icon({ name })}
				{:else}
					<FileIcon class="size-4" />
				{/if}
				<span>{name}</span>
			</button>


			<button class="details" onmousedown={detailsButton}>
				<DetailsIcon class="size-4" onclick={() => ''}/>
			</button>
		</div>
	</ContextMenu.Trigger>
	<ContextMenu.Content customAnchor={contentAnchor}>
		{@render options()}
	</ContextMenu.Content>
</ContextMenu.Root>

<style>
	.item {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        width: 100%;
        border-radius: 5px;
        overflow: hidden;
		border: 1px solid transparent;
    }

    .item:hover:not(.open) {
        background-color: rgba(54, 119, 86, 0.08);
		border: 1px solid var(--border);
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

	:not(.open) .details:hover {
        background-color: rgba(54, 119, 86, 0.2);
    }

	.open {
		background-color: var(--border);
		color: white;
	}

	.open .details:hover {
		background-color: rgb(74, 134, 105);
	}
</style>