<script>
	import { fly, fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { X, ChartLine } from '@lucide/svelte';
	import NumberFlow from '@number-flow/svelte';
	import { getSelectedPoint } from '$lib/components/providers/scene';

	/** @type {{ starData: import('$lib/utils/dataSources.js').StarData }} */
	let { starData } = $props();

	const sel = getSelectedPoint();
	let dismissed = $state(true);

	let vals = $state({
		speed: /** @type {number|null} */ (null),
		planets: /** @type {number|null} */ (null),
		group: /** @type {number|null} */ (null),
		rotA: /** @type {number|null} */ (null),
		rotB: /** @type {number|null} */ (null),
		rotC: /** @type {number|null} */ (null)
	});

	/**
	 * @param {number[]|undefined} arr
	 * @param {number} i
	 * @returns {number|null}
	 */
	function safeGet(arr, i) {
		if (!arr || i == null) return null;
		const v = arr[i];
		return v == null || !isFinite(v) ? null : v;
	}

	$effect(() => {
		const sp = sel.selectedPoint;
		if (!sp) {
			vals.speed = vals.planets = vals.group = vals.rotA = vals.rotB = vals.rotC = null;
			return;
		}
		const { starIndex } = sp;
		vals.speed = safeGet(starData.speeds, starIndex);
		vals.planets = safeGet(starData.planetCounts, starIndex);
		vals.group = safeGet(starData.groups, starIndex);
		vals.rotA = safeGet(starData.diffRotationCAs, starIndex);
		vals.rotB = safeGet(starData.diffRotationCBs, starIndex);
		vals.rotC = safeGet(starData.diffRotationCCs, starIndex);
	});
</script>

{#if !dismissed}
	<div
		class="fixed top-4 left-4 z-50 w-[260px] rounded-[10px] border border-white/10 bg-[rgba(15,15,22,0.85)] px-4 py-3.5 backdrop-blur-xl"
		transition:fly={{ x: -320, duration: 300, easing: cubicInOut }}
	>
		<!-- Header -->
		<div class="mb-3 flex items-center justify-between">
			<span class="font-mono text-[10px] uppercase tracking-widest text-gray-500">
				{sel.selectedPoint != null ? `Star #${sel.selectedPoint.starIndex}` : 'No star selected'}
			</span>
			<button
				class="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/40 transition-colors hover:bg-white/15 hover:text-white"
				onclick={() => (dismissed = true)}
				aria-label="Dismiss"
			>
				<X size={10} />
			</button>
		</div>

		<!-- Hero row: Speed, Planets, Group -->
		<div class="mb-3 grid grid-cols-3 gap-2 border-b border-white/[0.08] pb-3">
			{#each [{ label: 'Speed', value: vals.speed, dec: 2 }, { label: 'Planets', value: vals.planets, dec: 0 }, { label: 'Group', value: vals.group, dec: 0 }] as stat (stat.label)}
				<div>
					<div class="font-mono text-[26px] font-bold leading-none text-white">
						{#if stat.value === null}
							<span>--</span>
						{:else}
							<NumberFlow
								value={stat.value}
								format={{ minimumFractionDigits: stat.dec, maximumFractionDigits: stat.dec }}
							/>
						{/if}
					</div>
					<div class="mt-1 text-[8px] uppercase tracking-widest text-gray-600">{stat.label}</div>
				</div>
			{/each}
		</div>

		<!-- Detail row: Rot A, B, C -->
		<div class="grid grid-cols-3 gap-2">
			{#each [{ label: 'Rot A', value: vals.rotA, dec: 2 }, { label: 'Rot B', value: vals.rotB, dec: 2 }, { label: 'Rot C', value: vals.rotC, dec: 2 }] as stat (stat.label)}
				<div>
					<div class="font-mono text-[15px] font-semibold leading-none text-[#bbb]">
						{#if stat.value === null}
							<span>--</span>
						{:else}
							<NumberFlow
								value={stat.value}
								format={{ minimumFractionDigits: stat.dec, maximumFractionDigits: stat.dec }}
							/>
						{/if}
					</div>
					<div class="mt-1 text-[8px] uppercase tracking-widest text-[#555]">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<button
		class="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,15,22,0.85)] text-white/60 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
		onclick={() => (dismissed = false)}
		aria-label="Open star dashboard"
		transition:fade={{ duration: 200 }}
	>
		<ChartLine size={16} />
	</button>
{/if}
