<script>
  import { fly, fade } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { X, ChartLine } from '@lucide/svelte';
  import { getSelectedPoint } from '$lib/components/providers/scene';
  import { animateValue } from '$lib/utils/countUp.js';

  /** @type {{ starData: import('$lib/utils/dataSources.js').StarData }} */
  let { starData } = $props();

  const selectedPoint = getSelectedPoint();
  let dismissed = $state(false);

  let vals = $state({
    speed: '--', planets: '--', group: '--',
    rotA: '--', rotB: '--', rotC: '--'
  });

  /** @type {Array<() => void>} */
  let cancelAnims = [];

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

  /**
   * @param {string} display
   * @returns {number|null}
   */
  function parseDisplay(display) {
    if (display === '--') return null;
    const n = parseFloat(display);
    return isNaN(n) ? null : n;
  }

  $effect(() => {
    const sp = $selectedPoint;
    if (!sp) return;
    const { starIndex } = sp;

    cancelAnims.forEach((c) => c());
    cancelAnims = [];

    /** @type {Array<{ key: keyof typeof vals, raw: number|null, dec: number }>} */
    const targets = [
      { key: 'speed',   raw: safeGet(starData.speeds, starIndex),          dec: 2 },
      { key: 'planets', raw: safeGet(starData.planetCounts, starIndex),    dec: 0 },
      { key: 'group',   raw: safeGet(starData.groups, starIndex),          dec: 0 },
      { key: 'rotA',    raw: safeGet(starData.diffRotationCAs, starIndex), dec: 2 },
      { key: 'rotB',    raw: safeGet(starData.diffRotationCBs, starIndex), dec: 2 },
      { key: 'rotC',    raw: safeGet(starData.diffRotationCCs, starIndex), dec: 2 },
    ];

    for (const { key, raw, dec } of targets) {
      if (raw == null) { vals[key] = '--'; continue; }
      const from = parseDisplay(vals[key]);
      if (from == null) { vals[key] = raw.toFixed(dec); continue; }
      cancelAnims.push(animateValue(from, raw, dec, 400, (v) => { vals[key] = v; }));
    }

    return () => { cancelAnims.forEach((c) => c()); };
  });
</script>

{#if $selectedPoint}
  {#if !dismissed}
    <div
      class="fixed top-4 left-4 z-50 w-[260px] rounded-[10px] border border-white/10 bg-[rgba(15,15,22,0.85)] px-4 py-3.5 backdrop-blur-xl"
      transition:fly={{ x: -320, duration: 300, easing: cubicInOut }}
    >
      <!-- Header -->
      <div class="mb-3 flex items-center justify-between">
        <span class="font-mono text-[10px] uppercase tracking-widest text-gray-500">
          Star #{$selectedPoint.starIndex}
        </span>
        <button
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.07] text-gray-500 transition-colors hover:bg-white/[0.14] hover:text-white"
          onclick={() => (dismissed = true)}
          aria-label="Dismiss"
        >
          <X size={10} />
        </button>
      </div>

      <!-- Hero row: Speed, Planets, Group -->
      <div class="mb-3 grid grid-cols-3 gap-2 border-b border-white/[0.08] pb-3">
        {#each [
          { label: 'Speed',   value: vals.speed   },
          { label: 'Planets', value: vals.planets  },
          { label: 'Group',   value: vals.group    },
        ] as stat (stat.label)}
          <div>
            <div class="font-mono text-[26px] font-bold leading-none text-white">{stat.value}</div>
            <div class="mt-1 text-[8px] uppercase tracking-widest text-gray-600">{stat.label}</div>
          </div>
        {/each}
      </div>

      <!-- Detail row: Rot A, B, C -->
      <div class="grid grid-cols-3 gap-2">
        {#each [
          { label: 'Rot A', value: vals.rotA },
          { label: 'Rot B', value: vals.rotB },
          { label: 'Rot C', value: vals.rotC },
        ] as stat (stat.label)}
          <div>
            <div class="font-mono text-[15px] font-semibold leading-none text-[#bbb]">{stat.value}</div>
            <div class="mt-1 text-[8px] uppercase tracking-widest text-[#555]">{stat.label}</div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <button
      class="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,15,22,0.85)] text-gray-400 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
      onclick={() => (dismissed = false)}
      aria-label="Open star dashboard"
      transition:fade={{ duration: 200 }}
    >
      <ChartLine size={16} />
    </button>
  {/if}
{/if}
