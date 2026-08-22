<script lang="ts">
	import type { Season } from './aout/types';
	import { fmtViews } from './aout/format';

	let {
		seasons,
		pinned = $bindable(null),
		hover = $bindable(null),
		value = (s: Season) => s.viewsMean,
		fmt = fmtViews
	}: {
		seasons: Season[];
		pinned: number | null;
		hover: number | null;
		value?: (s: Season) => number;
		fmt?: (n: number) => string;
	} = $props();

	const max = $derived(Math.max(...seasons.map(value)));
</script>

<div class="rail" onmouseleave={() => (hover = null)} role="presentation">
	{#each seasons as s (s.season)}
		<button
			class:on={pinned === s.season}
			class:hovering={hover === s.season}
			class:live={s.partial}
			aria-pressed={pinned === s.season}
			onclick={() => (pinned = pinned === s.season ? null : s.season)}
			onmouseenter={() => (hover = s.season)}
		>
			<span class="tip tnum">{fmt(value(s))}</span>
			<span class="bar" style="height:{(value(s) / max) * 100}%"></span>
			<span class="yr">{s.year}</span>
		</button>
	{/each}
</div>

<style>
	.rail {
		display: flex;
		gap: 4px;
		align-items: flex-end;
		height: 92px;
	}
	button {
		position: relative;
		flex: 1;
		height: 100%;
		border: 0;
		background: none;
		padding: 16px 0 18px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.bar {
		display: block;
		width: 100%;
		background: var(--surface-hover);
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		transition: background var(--duration) var(--easing);
	}
	button.hovering .bar,
	button.on .bar {
		background: var(--accent);
	}
	button.live .bar {
		background: var(--live-soft);
		box-shadow: inset 0 0 0 1px var(--live);
	}
	button.live.hovering .bar,
	button.live.on .bar {
		background: var(--live);
	}
	.yr {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		font-size: var(--text-10);
		font-variation-settings: 'wght' 650;
		color: var(--text-muted);
	}
	button.on .yr,
	button.hovering .yr {
		color: var(--text-primary);
	}
	.tip {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		font-size: var(--text-10);
		color: var(--text-primary);
		opacity: 0;
		white-space: nowrap;
		transition: opacity var(--duration) var(--easing);
	}
	button.hovering .tip,
	button.on .tip {
		opacity: 1;
	}
</style>
