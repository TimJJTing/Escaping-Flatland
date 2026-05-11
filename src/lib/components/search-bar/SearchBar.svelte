<script>
	import * as THREE from 'three';
	import { toast } from 'svelte-sonner';
	import { Search } from '@lucide/svelte';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Kbd } from '$lib/components/ui/kbd';
	import { getSelectedPoint } from '$lib/components/providers/scene';

	/** @type {{ starData: import('$lib/utils/dataSources.js').StarData }} */
	let { starData } = $props();

	let inputValue = $state('');

	const selectedPoint = getSelectedPoint();

	// Sync input when scene click updates selectedPoint.
	// Safe — search fires only via keydown+Enter on a focused input, never from a reactive effect on inputValue.
	$effect(() => {
		const sp = $selectedPoint;
		inputValue = sp ? String(sp.starIndex) : '';
	});

	const search = () => {
		const trimmed = inputValue.trim();

		if (!trimmed) {
			selectedPoint.set(null);
			return;
		}

		const parsed = Number(trimmed);
		const positions = starData.positions;
		const starCount = positions.length / 3;

		if (!Number.isInteger(parsed)) {
			toast(`Star #${trimmed} not found`);
			return;
		}

		if (parsed < 0 || parsed >= starCount) {
			toast(`Star #${parsed} not found`);
			return;
		}

		if (parsed === $selectedPoint?.starIndex) {
			toast(`Star #${parsed} already focused`);
			return;
		}

		const worldPosition = new THREE.Vector3(
			positions[parsed * 3],
			positions[parsed * 3 + 1],
			positions[parsed * 3 + 2]
		);
		selectedPoint.set({ starIndex: parsed, worldPosition });
	};

	/** @param {KeyboardEvent} e */
	const onKeyDown = (e) => {
		if (e.key !== 'Enter') return;
		search();
	};
</script>

<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50">
	<InputGroup.Root
		class="w-[220px] h-9 rounded-full bg-[rgba(15,15,22,0.85)] backdrop-blur-sm border border-white/10"
	>
		<InputGroup.Addon>
			<Search size={14} class="text-gray-100" />
		</InputGroup.Addon>
		<InputGroup.Input
			type="text"
			aria-label="Search star by index"
			class="text-white placeholder:text-gray-500 text-sm"
			placeholder="Search a star..."
			bind:value={inputValue}
			onkeydown={onKeyDown}
		/>
		<InputGroup.Addon align="inline-end">
			<Kbd onclick={search} class="cursor-pointer pointer-events-auto mr-1">Enter</Kbd>
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
