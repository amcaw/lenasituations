<script lang="ts">
	import type { SubPoint } from './aout/types';
	import { fmtViews, fmtDate, fmtInt } from './aout/format';

	let { subs, focus = null }: { subs: SubPoint[]; focus?: number | null } = $props();

	const W = 900;
	const H = 360;
	const P = { t: 34, r: 16, b: 28, l: 48 };

	const pts = $derived(
		subs
			.map((p) => ({ t: new Date(p.date).getTime(), v: p.subs, date: p.date }))
			.sort((a, b) => a.t - b.t)
	);
	const t0 = $derived(pts[0].t);
	const t1 = $derived(pts[pts.length - 1].t);
	const vmax = $derived(Math.ceil(pts[pts.length - 1].v / 5e5) * 5e5);

	const x = (t: number) => P.l + ((t - t0) / (t1 - t0)) * (W - P.l - P.r);
	const y = (v: number) => H - P.b - (v / vmax) * (H - P.t - P.b);

	const line = $derived(pts.map((p, i) => `${i ? 'L' : 'M'} ${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' '));
	const area = $derived(
		`${line} L ${x(t1).toFixed(1)} ${H - P.b} L ${x(t0).toFixed(1)} ${H - P.b} Z`
	);

	const YEARS = $derived.by(() => {
		const out: number[] = [];
		for (let yy = new Date(t0).getFullYear(); yy <= new Date(t1).getFullYear(); yy++) out.push(yy);
		return out;
	});

	/* Une bande par saison : du 2 août au 1er septembre, plus le gain mesuré
	   sur la période quand les archives le permettent. */
	const bands = $derived.by(() =>
		YEARS.map((yy) => {
			const a = Date.UTC(yy, 7, 2);
			const b = Date.UTC(yy, 8, 1);
			if (b < t0 || a > t1) return null;
			const near = (t: number) => {
				const best = pts.reduce((m, p) => (Math.abs(p.t - t) < Math.abs(m.t - t) ? p : m));
				return Math.abs(best.t - t) <= 25 * 864e5 ? best : null;
			};
			const pa = near(a);
			const pb = near(b);
			const gain = pa && pb && pb.t > pa.t ? Math.round(((pb.v - pa.v) / (pb.t - pa.t)) * 864e5 * 30) : null;
			return {
				year: yy,
				season: yy - 2016,
				x0: x(Math.max(a, t0)),
				x1: x(Math.min(b, t1)),
				gain
			};
		}).filter((b): b is NonNullable<typeof b> => b !== null)
	);

	const TICKS = $derived([1e6, 2e6, 3e6].filter((v) => v <= vmax));

	let svgEl = $state<SVGSVGElement>();
	let hover = $state<{ p: (typeof pts)[number] } | null>(null);

	function onMove(e: MouseEvent) {
		if (!svgEl) return;
		const box = svgEl.getBoundingClientRect();
		const px = ((e.clientX - box.left) / box.width) * W;
		const t = t0 + ((px - P.l) / (W - P.l - P.r)) * (t1 - t0);
		hover = { p: pts.reduce((m, p) => (Math.abs(p.t - t) < Math.abs(m.t - t) ? p : m)) };
	}
</script>

<div class="chart">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		bind:this={svgEl}
		viewBox="0 0 {W} {H}"
		role="img"
		aria-label="Abonnés de la chaîne de 2018 à 2026, mois d'août surlignés"
		onmousemove={onMove}
		onmouseleave={() => (hover = null)}
	>
		{#each bands as b (b.year)}
			<rect
				x={b.x0}
				y={P.t}
				width={Math.max(1, b.x1 - b.x0)}
				height={H - P.b - P.t}
				class="band"
				class:on={focus === b.season}
			/>
		{/each}

		{#each TICKS as v}
			<line x1={P.l} y1={y(v)} x2={W - P.r} y2={y(v)} class="grid" />
			<text x={P.l - 8} y={y(v)} class="ylbl">{v / 1e6} M</text>
		{/each}
		<line x1={P.l} y1={H - P.b} x2={W - P.r} y2={H - P.b} class="axis" />

		{#each YEARS as yy}
			{@const tx = x(Math.max(Date.UTC(yy, 6, 1), t0))}
			<text x={tx} y={H - P.b + 16} class="xlbl">{yy}</text>
		{/each}

		<path d={area} class="area" />
		<path d={line} class="line" />

		{#each bands as b (b.year)}
			{#if b.gain}
				<text x={(b.x0 + b.x1) / 2} y={P.t - 12} class="gain" class:on={focus === b.season}>
					+{fmtInt(Math.round(b.gain / 1000))}k
				</text>
			{/if}
		{/each}

		{#each pts as p (p.date)}
			<circle cx={x(p.t)} cy={y(p.v)} r="1.8" class="dot" />
		{/each}

		{#if hover}
			<line x1={x(hover.p.t)} y1={P.t} x2={x(hover.p.t)} y2={H - P.b} class="cursor" />
			<circle cx={x(hover.p.t)} cy={y(hover.p.v)} r="4.5" class="dot on" />
		{/if}
	</svg>

	{#if hover}
		<div
			class="tip"
			style="left:{(x(hover.p.t) / W) * 100}%; top:{(y(hover.p.v) / H) * 100}%"
			role="tooltip"
		>
			<strong class="tnum">{fmtViews(hover.p.v)} abonnés</strong>
			<span>{fmtDate(hover.p.date)}</span>
		</div>
	{/if}
</div>

<style>
	.chart {
		position: relative;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.band {
		fill: var(--accent);
		opacity: 0.14;
	}
	.band.on {
		opacity: 0.3;
	}
	.grid {
		stroke: var(--grid-line);
		stroke-width: 0.8;
		stroke-dasharray: 2 3;
	}
	.axis {
		stroke: var(--grid-line-strong);
		stroke-width: 1;
	}
	.area {
		fill: var(--accent);
		opacity: 0.1;
	}
	.line {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.dot {
		fill: var(--accent);
		opacity: 0.55;
	}
	.dot.on {
		fill: var(--text-primary);
		opacity: 1;
	}
	.cursor {
		stroke: var(--grid-line-strong);
		stroke-width: 1;
	}
	.ylbl,
	.xlbl,
	.gain {
		font-size: 12px;
		font-variation-settings: 'wght' 650;
		fill: var(--text-muted);
	}
	.ylbl {
		text-anchor: end;
		dominant-baseline: middle;
	}
	.xlbl {
		text-anchor: middle;
	}
	.gain {
		text-anchor: middle;
		fill: var(--accent);
		font-variation-settings: 'wght' 750;
	}
	.gain.on {
		fill: var(--accent-2);
	}
	.tip {
		position: absolute;
		transform: translate(-50%, -140%);
		padding: 7px 10px;
		border-radius: var(--radius-md);
		background: var(--surface-card);
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.35);
		pointer-events: none;
		white-space: nowrap;
		text-align: center;
	}
	.tip strong {
		display: block;
		font-size: var(--text-14);
		font-variation-settings: 'wght' 750;
	}
	.tip span {
		font-size: var(--text-12);
		color: var(--text-muted);
	}
</style>
