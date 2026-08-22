<script lang="ts">
	import type { Video, Season } from './aout/types';
	import { fmtHour, fmtDate, fmtViews, thumb } from './aout/format';

	let {
		videos,
		seasons,
		focus = null
	}: { videos: Video[]; seasons: Season[]; focus?: number | null } = $props();

	const S = 260;
	const C = S / 2;
	const R0 = 34;
	const R1 = 110;

	const rOf = (season: number) => R0 + ((season - 1) / 9) * (R1 - R0);
	const aOf = (h: number) => (h / 24) * 360 - 90;
	const pt = (h: number, r: number) => {
		const a = (aOf(h) * Math.PI) / 180;
		return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
	};

	const dots = $derived(
		videos
			.filter((v) => v.publishedHour != null && v.available)
			.map((v) => ({ v, p: pt(v.publishedHour!, rOf(v.season)) }))
	);
	const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

	let hover = $state<{ v: Video; x: number; y: number } | null>(null);
</script>

<div class="clockwrap">
	<svg viewBox="0 0 {S} {S}" role="img" aria-label="Heure de publication de chaque vlog, par saison">
		{#each HOURS as h}
			{@const a = pt(h, R1 + 6)}
			{@const b = pt(h, R0 - 4)}
			<line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class="tick" />
			{@const t = pt(h, R1 + 18)}
			<text x={t[0]} y={t[1]} class="hlbl">{h}h</text>
		{/each}
		{#each seasons as s (s.season)}
			<circle cx={C} cy={C} r={rOf(s.season)} class="orbit" class:on={focus === s.season} />
		{/each}
		{#each dots as d (d.v.id)}
			<circle
				cx={d.p[0]}
				cy={d.p[1]}
				r={hover?.v.id === d.v.id ? 5 : focus === d.v.season ? 3.4 : 2.2}
				class="dot"
				class:on={focus === d.v.season || hover?.v.id === d.v.id}
				class:dim={focus != null && focus !== d.v.season}
				role="presentation"
				onmouseenter={() => (hover = { v: d.v, x: (d.p[0] / S) * 100, y: (d.p[1] / S) * 100 })}
				onmouseleave={() => (hover = null)}
			/>
		{/each}
		<text x={C} y={C - 9} class="mid sub">heure médiane</text>
		<text x={C} y={C + 9} class="mid">20h50</text>
	</svg>

	{#if hover}
		<div
			class="vtip"
			style="left:{hover.x}%; top:{hover.y}%; --flip:{hover.y > 55 ? -1 : 1}"
			role="tooltip"
		>
			<img src={thumb(hover.v.id)} alt="" />
			<div>
				<strong>{hover.v.title}</strong>
				<span class="tnum">
					{fmtHour(hover.v.publishedHour!)} · {fmtDate(hover.v.publishedAt)} · {fmtViews(
						hover.v.views
					)} vues
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.clockwrap {
		position: relative;
	}
	svg {
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.tick {
		stroke: var(--grid-line);
		stroke-width: 1;
	}
	.hlbl {
		fill: var(--text-muted);
		font-size: 11px;
		font-variation-settings: 'wght' 650;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	.orbit {
		fill: none;
		stroke: var(--surface-sunken);
		stroke-width: 1;
	}
	.orbit.on {
		stroke: var(--grid-line-strong);
	}
	.dot {
		fill: var(--accent);
		opacity: 0.75;
		cursor: pointer;
	}
	.dot.dim {
		opacity: 0.16;
	}
	.dot.on {
		fill: var(--accent-2);
		opacity: 1;
	}
	.mid {
		fill: var(--text-primary);
		font-size: 17px;
		font-variation-settings: 'wght' 860;
		text-anchor: middle;
	}
	.mid.sub {
		fill: var(--text-muted);
		font-size: 10px;
		font-variation-settings: 'wght' 650;
	}

	.vtip {
		position: absolute;
		z-index: 5;
		transform: translate(-50%, calc(var(--flip) * -1 * 100% - var(--flip) * 14px));
		display: flex;
		align-items: center;
		gap: 9px;
		width: max-content;
		max-width: 320px;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-card);
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.35);
		pointer-events: none;
	}
	.vtip img {
		width: 56px;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: var(--radius-sm);
		flex: none;
	}
	.vtip strong {
		display: block;
		font-size: var(--text-12);
		font-variation-settings: 'wght' 650;
		line-height: var(--leading-snug);
		color: var(--text-primary);
	}
	.vtip span {
		font-size: var(--text-10);
		color: var(--text-muted);
	}
</style>
