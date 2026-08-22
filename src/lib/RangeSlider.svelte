<script lang="ts">
	let {
		min,
		max,
		lo = $bindable(min),
		hi = $bindable(max),
		step = 1,
		fmt = (x: number) => String(x),
		label,
		count
	}: {
		min: number;
		max: number;
		lo: number;
		hi: number;
		step?: number;
		fmt?: (x: number) => string;
		label: string;
		count?: string;
	} = $props();

	const pct = (x: number) => ((x - min) / (max - min)) * 100;
	const active = $derived(lo > min || hi < max);

	function onLo(e: Event) {
		lo = Math.min(+(e.currentTarget as HTMLInputElement).value, hi - step);
	}

	function onHi(e: Event) {
		hi = Math.max(+(e.currentTarget as HTMLInputElement).value, lo + step);
	}

	function reset() {
		lo = min;
		hi = max;
	}
</script>

<div class="wrap">
	<div class="head">
		<span class="lbl">{label}</span>
		{#if active}
			<button class="clear" onclick={reset}>tout</button>
		{:else if count}
			<span class="count tnum">{count}</span>
		{/if}
	</div>

	<div class="track">
		<span class="rail"></span>
		<span class="fill" style="left:{pct(lo)}%;right:{100 - pct(hi)}%"></span>
		<input
			type="range"
			{min}
			{max}
			{step}
			value={lo}
			aria-label="{label} : minimum"
			oninput={onLo}
		/>
		<input
			type="range"
			{min}
			{max}
			{step}
			value={hi}
			aria-label="{label} : maximum"
			oninput={onHi}
		/>
	</div>

	<div class="ends tnum">
		<span class:on={lo > min}>{fmt(lo)}</span>
		{#if active && count}<span class="count tnum">{count}</span>{/if}
		<span class:on={hi < max}>{fmt(hi)}</span>
	</div>
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--state-empty);
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.lbl {
		font-size: var(--text-12);
		font-variation-settings: 'wght' 750;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}
	.count {
		font-size: var(--text-12);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
	.clear {
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		font-size: var(--text-12);
		color: var(--accent);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.clear:focus-visible {
		outline: 4px solid var(--accent-soft);
		outline-offset: 2px;
	}

	.track {
		position: relative;
		height: 20px;
	}
	.rail,
	.fill {
		position: absolute;
		top: 50%;
		height: 4px;
		border-radius: var(--radius-full);
		transform: translateY(-50%);
		pointer-events: none;
	}
	.rail {
		left: 0;
		right: 0;
		background: var(--state-empty);
	}
	.fill {
		background: var(--accent);
	}

	input {
		position: absolute;
		inset: 0;
		width: 100%;
		margin: 0;
		appearance: none;
		background: none;
		pointer-events: none;
	}
	input:focus-visible {
		outline: 4px solid var(--accent-soft);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}
	input::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--surface-card);
		border: 3px solid var(--accent);
		cursor: grab;
		pointer-events: auto;
		transition: transform 0.15s var(--easing);
	}
	input::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--surface-card);
		border: 3px solid var(--accent);
		cursor: grab;
		pointer-events: auto;
		box-sizing: border-box;
	}
	input::-webkit-slider-thumb:active {
		cursor: grabbing;
		transform: scale(1.15);
	}

	.ends {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		font-size: var(--text-12);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
	.ends .on {
		color: var(--text-primary);
		font-variation-settings: 'wght' 750;
	}
</style>
