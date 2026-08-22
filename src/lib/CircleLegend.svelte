<script lang="ts">
	import StatesLegend from './StatesLegend.svelte';

	let { gone, missing }: { gone: number; missing: number } = $props();
</script>

<details class="legend">
	<summary>légende</summary>
	<div class="body">
		<StatesLegend {gone} {missing} />
		<p>
			L'épaisseur des anneaux dit la durée moyenne des vlogs de la saison. Le trait orange qui
			traverse les dix anneaux relie le premier épisode de 2017 au premier épisode de 2026.
		</p>
	</div>
</details>

<style>
	.legend {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 4;
		max-width: 260px;
	}
	summary {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		list-style: none;
		cursor: pointer;
		border: 2px solid var(--grid-line-strong);
		border-radius: var(--radius-full);
		padding: 4px 14px;
		font-size: var(--text-12);
		font-variation-settings: 'wght' 650;
		color: var(--text-secondary);
		background: var(--surface-page);
		transition: border-color var(--duration) var(--easing), color var(--duration) var(--easing);
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary::after {
		content: '+';
		font-size: var(--text-14);
		line-height: 1;
	}
	.legend[open] summary::after {
		content: '−';
	}
	summary:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}
	.body {
		margin-top: 8px;
		padding: 14px 16px;
		border-radius: var(--radius-md);
		background: var(--surface-card);
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.25);
	}
	.body p {
		margin: 12px 0 0;
		font-size: var(--text-12);
		line-height: var(--leading-normal);
		color: var(--text-muted);
	}
	@media (max-width: 560px) {
		.legend {
			position: static;
			max-width: none;
		}
	}
</style>
