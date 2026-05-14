<script>
	import { getCamPos, getRenderInfo } from '$lib/components/providers/scene';

	const camPos = getCamPos();
	const renderInfo = getRenderInfo();

	const rows = $derived([
		['cam_x',     Math.floor($camPos.x)],
		['cam_y',     Math.floor($camPos.y)],
		['cam_z',     Math.floor($camPos.z)],
		['frame',     $renderInfo.frame],
		['calls',     $renderInfo.calls],
		['triangles', $renderInfo.triangles],
		['points',    $renderInfo.points],
		['lines',     $renderInfo.lines],
	]);
</script>

<div class="fixed right-0 top-12 z-100 w-40 bg-black/50 p-1">
	{#each rows as [label, value]}
		<div class="flex justify-between px-0.5 font-mono text-[11px] text-white hover:bg-white/15">
			<span>{label}</span>
			<span>{value}</span>
		</div>
	{/each}
</div>
