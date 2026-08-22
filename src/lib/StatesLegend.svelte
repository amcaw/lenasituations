<script lang="ts">
	let {
		gone,
		approx,
		missing
	}: { gone: number; approx: number; missing: number } = $props();
</script>

<ul class="states">
	<li><span class="sw measured"></span> épisode mesuré ({approx} arrondis)</li>
	<li><span class="sw gone"></span> sans chiffres publics ({gone})</li>
	<li><span class="sw none"></span> aucun épisode ce jour ({missing})</li>
	<li><span class="sw future"></span> reste à publier</li>
	<li><span class="sw bonus"></span> bonus publié en septembre</li>
</ul>

<style>
	.states {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
		font-size: var(--text-12);
		color: var(--text-secondary);
	}
	li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.sw {
		width: 13px;
		height: 13px;
		border-radius: 2px;
		flex: none;
	}
	.measured {
		background: var(--sun-3);
	}
	.gone {
		background: repeating-linear-gradient(
			45deg,
			var(--state-gone),
			var(--state-gone) 1.5px,
			transparent 1.5px,
			transparent 4px
		);
		border: 1px solid var(--state-gone);
	}
	.none {
		background: var(--state-empty);
	}
	.future {
		border: 1px dashed var(--live);
	}
	.bonus {
		background: var(--accent-2);
		opacity: 0.55;
	}
</style>
