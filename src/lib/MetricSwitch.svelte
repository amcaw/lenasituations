<script lang="ts">
	import { METRICS, type MetricKey } from './aout/metrics';

	let { active = $bindable('views' as MetricKey) }: { active: MetricKey } = $props();
</script>

<div class="switch" role="tablist" aria-label="Choisir la donnée affichée">
	{#each METRICS as m (m.key)}
		<button
			class="rx-pill"
			role="tab"
			aria-selected={active === m.key}
			onclick={() => (active = m.key)}
			title={m.blurb}>{m.short}</button
		>
	{/each}
</div>

<style>
	.switch {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
</style>
