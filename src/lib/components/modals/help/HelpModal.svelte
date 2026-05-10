<script>
	// @ts-nocheck
	import * as Dialog from '$lib/components/ui/dialog';
	import { Link } from '@lucide/svelte';
	import { Kbd } from '$lib/components/ui/kbd';

	/** @type {{ visible?: boolean }} */
	let { visible = $bindable(false) } = $props();

	const controls = [
		{ label: 'Move camera', key: 'Drag' },
		{ label: 'Zoom', key: 'Scroll' },
		{ label: 'Options panel', key: 'O' },
		{ label: 'Focus star', key: 'Click' }
	];
	const links = [
		{ href: 'https://jtingjiang.com/works/escaping-flatland', title: 'Implementation detail' },
		{ href: 'https://github.com/TimJJTing/Escaping-Flatland', title: 'Source code' }
	];
</script>

<Dialog.Root bind:open={visible}>
	<Dialog.Content class="w-96 bg-[#1a1a1f] border-[#333] text-white">
		<Dialog.Header>
			<Dialog.Title>About</Dialog.Title>
		</Dialog.Header>

		<p class="text-sm text-gray-400 leading-relaxed">
			Escaping Flatland renders 1 million particles in real time inside a browser using Three.js and a sparse Octree.
			Click any star to focus on it and inspect its properties.
		</p>

		<div class="mt-2">
			<p class="text-xs uppercase tracking-widest text-gray-500 mb-3">How to use</p>
			<div class="space-y-2">
				{#each controls as { label, key }}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-300">{label}</span>
						<Kbd class="bg-[#2a2a2f] text-gray-300 border border-[#444]">{key}</Kbd>
					</div>
				{/each}
			</div>
		</div>
		<div class="mt-2">
			<p class="text-xs uppercase tracking-widest text-gray-500 mb-3">Links</p>
			<div class="space-y-2">
				<div class="flex flex-col">
					{#each links as { href, title }}
						<a
							{href}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
						>
							<Link size={16} />
							{title}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
