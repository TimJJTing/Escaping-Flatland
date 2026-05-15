<script>
	// @ts-nocheck
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Root as Switch } from '$lib/components/ui/switch';
	import { Root as Label } from '$lib/components/ui/label';
	import { getDataOptions, getParticleOptions, getSceneOptions } from '$lib/components/providers/scene';
	import { DATA_SOURCES } from '$lib/utils';

	/** @type {{ visible?: boolean }} */
	let { visible = $bindable(false) } = $props();

	const dataOpts = getDataOptions();
	const particleOpts = getParticleOptions();
	const sceneOpts = getSceneOptions();
</script>

<Dialog.Root bind:open={visible}>
	<Dialog.Content class="w-150 h-80 bg-[#1a1a1f] border-[#333] text-white grid-rows-[auto_1fr]">
		<Dialog.Header >
			<Dialog.Title >Options</Dialog.Title>
		</Dialog.Header>

		<Tabs.Root value="general">
			<Tabs.List class="bg-[#2a2a2f]">
				<Tabs.Trigger value="general">General</Tabs.Trigger>
				<Tabs.Trigger value="visual">Visual</Tabs.Trigger>
				<Tabs.Trigger value="debug">Debug</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="general" class="pt-4 space-y-5">
				<div class="flex items-center justify-between">
					<Label for="labels-toggle" class="text-sm text-gray-300 cursor-default">
						Labels
						<span class="text-xs text-gray-500 block">Show point index labels on nearby stars</span>
					</Label>
					<Switch id="labels-toggle"  bind:checked={particleOpts.labelsEnabled} />
				</div>

				<div class="flex items-center justify-between">
					<Label for="viewhelper-toggle" class="text-sm text-gray-300 cursor-default">
						View Helper
						<span class="text-xs text-gray-500 block">Orientation gizmo in the corner</span>
					</Label>
					<Switch id="viewhelper-toggle"  bind:checked={sceneOpts.viewHelperEnabled} />
				</div>

				<div class="flex items-center justify-between">
					<Label for="rotate-toggle" class="text-sm text-gray-300 cursor-default">
						Auto Rotate
						<span class="text-xs text-gray-500 block">Slowly spin the camera around the scene</span>
					</Label>
					<Switch id="rotate-toggle"  bind:checked={sceneOpts.autoRotateEnabled} />
				</div>

				<div class="flex items-center justify-between">
					<Label class="text-sm text-gray-300 cursor-default">
						Data Source
						<span class="text-xs text-gray-500 block">Galaxy generation algorithm</span>
					</Label>
					<select
						class="bg-[#2a2a2f] border border-[#444] text-white text-sm px-2 py-1 rounded"
						bind:value={dataOpts.dataSourceId}
					>
						{#each DATA_SOURCES as src}
							<option value={src.id}>{src.label}</option>
						{/each}
					</select>
				</div>
			</Tabs.Content>

			<Tabs.Content value="visual" class="pt-4 space-y-5">
				<div class="flex items-center justify-between">
					<Label for="blooming-toggle" class="text-sm text-gray-300 cursor-default">
						Blooming
						<span class="text-xs text-gray-500 block">Selective bloom post-processing effect</span>
					</Label>
					<Switch id="blooming-toggle" bind:checked={sceneOpts.blooming} />
				</div>
			</Tabs.Content>

			<Tabs.Content value="debug" class="pt-4 space-y-5">
				<div class="flex items-center justify-between">
					<Label for="debug-toggle" class="text-sm text-gray-300 cursor-default">
						Debug Mode
						<span class="text-xs text-gray-500 block">Show stats panel (FPS, MS, MB) and camera position / renderer info overlay</span>
					</Label>
					<Switch id="debug-toggle" bind:checked={sceneOpts.debugModeEnabled} />
				</div>

				<div class="flex items-center justify-between">
					<Label for="octant-toggle" class="text-sm text-gray-300 cursor-default">
						Octant Helper
						<span class="text-xs text-gray-500 block">Show translucent octree bounding boxes</span>
					</Label>
					<Switch id="octant-toggle" bind:checked={particleOpts.octantHelperEnabled} />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
