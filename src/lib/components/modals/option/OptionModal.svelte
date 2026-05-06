<script>
	// @ts-nocheck
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Root as Switch } from '$lib/components/ui/switch';
	import { Root as Label } from '$lib/components/ui/label';
	import { getOptions } from '$lib/components/providers/scene';

	/** @type {{ visible?: boolean }} */
	let { visible = $bindable(false) } = $props();

	let options = getOptions();
</script>

<Dialog.Root bind:open={visible}>
	<Dialog.Content class="w-[420px] bg-[#1a1a1f] border-[#333] text-white">
		<Dialog.Header class="">
			<Dialog.Title class="">Options</Dialog.Title>
		</Dialog.Header>

		<Tabs.Root value="general" class="">
			<Tabs.List class="bg-[#2a2a2f]">
				<Tabs.Trigger value="general" class="">General</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="general" class="pt-4 space-y-5">
				<div class="flex items-center justify-between">
					<Label for="labels-toggle" class="text-sm text-gray-300 cursor-default">
						Labels
						<span class="text-xs text-gray-500 block">Show point index labels on nearby stars</span>
					</Label>
					<Switch id="labels-toggle" class="" bind:checked={$options.labelsEnabled} />
				</div>

				<div class="flex items-center justify-between">
					<Label for="viewhelper-toggle" class="text-sm text-gray-300 cursor-default">
						View Helper
						<span class="text-xs text-gray-500 block">Orientation gizmo in the corner</span>
					</Label>
					<Switch id="viewhelper-toggle" class="" bind:checked={$options.viewHelperEnabled} />
				</div>

				<div class="flex items-center justify-between">
					<Label for="rotate-toggle" class="text-sm text-gray-300 cursor-default">
						Auto Rotate
						<span class="text-xs text-gray-500 block">Slowly spin the camera around the scene</span>
					</Label>
					<Switch id="rotate-toggle" class="" bind:checked={$options.autoRotateEnabled} />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
