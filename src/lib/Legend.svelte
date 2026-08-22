<script lang="ts">
	import type { Buckets } from './aout/metrics';
	import { bucketVar } from './aout/metrics';

	let { buckets, label }: { buckets: Buckets; label: string } = $props();

	const lo = $derived(buckets.n === 2 ? 'non' : buckets.edges.length ? buckets.fmt(buckets.edges[0]) : '');
	const hi = $derived(
		buckets.n === 2 ? 'oui' : buckets.edges.length ? buckets.fmt(buckets.edges[buckets.edges.length - 1]) : ''
	);
</script>

<div class="legend">
	<span class="lbl">{label}</span>
	<div class="ramp">
		{#each Array(buckets.n) as _, i}
			<span style="background:{bucketVar(i, buckets.n)}"></span>
		{/each}
	</div>
	<div class="ends tnum">
		<span>{lo}</span>
		<span>{hi}</span>
	</div>
</div>

<style>
	.legend {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.lbl {
		font-size: var(--text-12);
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.ramp {
		display: flex;
		gap: 2px;
		height: 12px;
	}
	.ramp span {
		flex: 1;
		border-radius: var(--radius-sm);
		box-shadow: inset 0 0 0 1px var(--grid-line);
	}
	.ends {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-12);
		color: var(--text-secondary);
	}
</style>
