<script>
	import { getSceneContext } from '$lib/components/providers/scene';

	const ctx = getSceneContext();

	const rows = $derived([
		['cam_x',     Math.floor(ctx.camPos.x)],
		['cam_y',     Math.floor(ctx.camPos.y)],
		['cam_z',     Math.floor(ctx.camPos.z)],
		['frame',     ctx.renderInfo.frame],
		['calls',     ctx.renderInfo.calls],
		['triangles', ctx.renderInfo.triangles],
		['points',    ctx.renderInfo.points],
		['lines',     ctx.renderInfo.lines],
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
