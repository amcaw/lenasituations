<script lang="ts">
	import type { Video, Season, Marker } from './aout/types';
	import type { Buckets } from './aout/metrics';
	import { bucketVar } from './aout/metrics';
	import {
		S,
		C,
		R_HUB,
		R_MIN,
		R_MAX,
		EPISODES,
		STEP,
		SEAM,
		angleOf,
		arcPath,
		rings,
		episodeAt,
		xy
	} from './aout/polar';

	let {
		videos,
		seasons,
		markers,
		buckets,
		proportional = true,
		reverse = false,
		hovered = $bindable(null),
		focusSeason = null,
		onpick,
		onreset
	}: {
		videos: Video[];
		seasons: Season[];
		markers: Marker[];
		buckets: Buckets;
		proportional?: boolean;
		reverse?: boolean;
		hovered: { season: number; episode: number } | null;
		focusSeason?: number | null;
		onpick?: (v: Video) => void;
		onreset?: () => void;
	} = $props();

	const byKey = $derived(new Map(videos.map((v) => [`${v.season}:${v.episode}`, v])));
	const ringList = $derived(
		rings(
			seasons.map((s) => s.durationMean),
			proportional
		)
	);

	type State = 'measured' | 'gone' | 'none' | 'future';

	const stateOf = (v: Video | null, season: number): State =>
		v ? (v.available ? 'measured' : 'gone') : season === 10 ? 'future' : 'none';

	const cells = $derived.by(() =>
		ringList.flatMap((ring) =>
			Array.from({ length: EPISODES }, (_, i) => {
				const episode = i + 1;
				const v = byKey.get(`${ring.season}:${episode}`) ?? null;
				const a = angleOf(episode);
				const state = stateOf(v, ring.season);
				return {
					key: `${ring.season}:${episode}`,
					season: ring.season,
					episode,
					state,
					fill:
						state === 'measured' && v && buckets.index(v) != null
							? bucketVar(
									reverse ? buckets.n - 1 - buckets.index(v)! : buckets.index(v)!,
									buckets.n
								)
							: state === 'gone'
								? 'url(#gone)'
								: state === 'none'
									? 'var(--state-empty)'
									: 'none',
					d: arcPath(ring.r0, ring.r1, a, a + STEP)
				};
			})
		)
	);

	/* Au-delà du 31 : les bonus publiés en septembre. Ils se posent dans la
	   couture, hors du mois, à leur anneau. */
	const bonus = $derived(
		videos
			.filter((v) => v.episode > EPISODES)
			.map((v) => {
				const ring = ringList[v.season - 1];
				const a = angleOf(EPISODES) + STEP + SEAM * 0.25;
				return { v, d: arcPath(ring.r0, ring.r1, a, a + STEP * 0.5) };
			})
	);

	const episodeMarkers = $derived(markers.filter((m) => m.episode != null));

	const loopRay = $derived.by(() => {
		const a = angleOf(1) + STEP / 2;
		const [x1, y1] = xy(a, ringList[0].rMid);
		const [x2, y2] = xy(a, ringList[ringList.length - 1].rMid);
		return { x1, y1, x2, y2 };
	});

	const DAY_LABELS = [1, 5, 10, 15, 20, 25, 31];

	let svgEl = $state<SVGSVGElement>();

	function locate(e: { clientX: number; clientY: number }) {
		if (!svgEl) return null;
		const box = svgEl.getBoundingClientRect();
		const px = ((e.clientX - box.left) / box.width) * S - C;
		const py = ((e.clientY - box.top) / box.height) * S - C;
		const r = Math.hypot(px, py);
		if (r < R_MIN - 4 || r > R_MAX + 6) return null;
		const episode = episodeAt((Math.atan2(py, px) * 180) / Math.PI);
		if (episode == null) return null;
		const ring = ringList.find((g) => r >= g.r0 - 2 && r <= g.r1 + 2);
		return ring ? { season: ring.season, episode } : null;
	}

	const pick = (hit: { season: number; episode: number } | null) => {
		if (!hit) {
			onreset?.();
			return;
		}
		const v = byKey.get(`${hit.season}:${hit.episode}`);
		if (v?.available) onpick?.(v);
		else onreset?.();
	};

	const onMove = (e: MouseEvent) => (hovered = locate(e));
	const onTouch = (e: TouchEvent) => {
		const t = e.touches[0];
		if (t) hovered = locate(t);
	};
	const onClick = (e: MouseEvent) => pick(locate(e));
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(hovered);
		}
	};

	const isDim = (season: number) => focusSeason != null && season !== focusSeason;
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
<div
	class="stage"
	role="application"
	tabindex="0"
	aria-label="Dix ans de vlogs d'août : chaque anneau est une saison, chaque secteur un épisode du mois."
	onkeydown={onKeydown}
	onmousemove={onMove}
	onmouseleave={() => (hovered = null)}
	ontouchstart={onTouch}
	ontouchmove={onTouch}
	onclick={onClick}
>
	<svg bind:this={svgEl} viewBox="0 0 {S} {S}" role="presentation">
		<defs>
			<pattern id="gone" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
				<line x1="0" y1="0" x2="0" y2="4" stroke="var(--state-gone)" stroke-width="1.6" />
			</pattern>
		</defs>

		{#each cells as c (c.key)}
			<path
				d={c.d}
				class="cell {c.state}"
				class:on={hovered?.season === c.season && hovered?.episode === c.episode}
				class:dim={isDim(c.season)}
				fill={c.fill}
			/>
		{/each}

		{#each bonus as b (b.v.id)}
			<path d={b.d} class="cell bonus" class:dim={isDim(b.v.season)}>
				<title>{b.v.title}, publié en septembre</title>
			</path>
		{/each}

		{#if hovered}
			{@const a = angleOf(hovered.episode)}
			<path d={arcPath(R_MIN - 5, R_MAX + 7, a, a + STEP, 0)} class="spoke" />
		{/if}

		<line x1={loopRay.x1} y1={loopRay.y1} x2={loopRay.x2} y2={loopRay.y2} class="loop-ray" />

		{#each episodeMarkers as m (m.season + ':' + m.episode + m.icon)}
			{@const ring = ringList[m.season - 1]}
			{@const p = xy(angleOf(m.episode ?? 1) + STEP / 2, ring.rMid)}
			<circle cx={p[0]} cy={p[1]} r={m.icon === 'arena' ? 6 : 4.5} class="marker {m.icon}">
				<title>{m.label}</title>
			</circle>
		{/each}

		{#each Array.from({ length: EPISODES }, (_, i) => i + 1) as ep (ep)}
			{@const p = xy(angleOf(ep) + STEP / 2, R_MAX + 20)}
			<text
				x={p[0]}
				y={p[1]}
				class="day"
				class:major={DAY_LABELS.includes(ep)}
				class:on={hovered?.episode === ep}>{ep}</text
			>
		{/each}

		{#each ringList as ring (ring.season)}
			<text
				x={C}
				y={C - ring.rMid}
				class="year"
				class:on={focusSeason === ring.season || hovered?.season === ring.season}
				class:live={ring.season === 10}>{seasons[ring.season - 1].year}</text
			>
		{/each}

		<circle cx={C} cy={C} r={R_HUB + 6} class="hub-ring" />
	</svg>
</div>

<style>
	.stage {
		display: block;
		outline: none;
	}
	.stage:focus-visible {
		outline: 4px solid var(--focus-ring);
		outline-offset: 4px;
		border-radius: 50%;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
		cursor: crosshair;
	}
	.cell {
		stroke: var(--surface-page);
		stroke-width: 0.5;
		/* fondu enchaîné au changement de donnée affichée */
		transition:
			fill 0.45s var(--easing),
			opacity var(--duration) var(--easing);
	}
	.cell.on {
		stroke: var(--text-primary);
		stroke-width: 1.6;
	}
	.cell.dim {
		opacity: 0.12;
	}
	.cell.none {
		stroke-width: 0;
	}
	.cell.gone {
		stroke: var(--state-gone);
		stroke-width: 0.8;
	}
	.cell.future {
		stroke: var(--live);
		stroke-width: 0.9;
		stroke-dasharray: 2 3;
		opacity: 0.55;
	}
	.cell.bonus {
		fill: var(--accent-2);
		opacity: 0.55;
		stroke-width: 0;
	}
	.spoke {
		fill: var(--text-primary);
		opacity: 0.07;
		pointer-events: none;
	}
	.loop-ray {
		stroke: var(--accent-2);
		stroke-width: 1.4;
		stroke-dasharray: 3 4;
		opacity: 0.85;
		pointer-events: none;
	}
	.marker {
		fill: var(--accent-2);
		stroke: var(--surface-page);
		stroke-width: 1.5;
	}
	.marker.arena {
		fill: var(--live);
	}
	.day {
		fill: var(--text-muted);
		font-size: 10px;
		font-variation-settings: 'wght' 650;
		text-anchor: middle;
		dominant-baseline: middle;
		opacity: 0;
		pointer-events: none;
	}
	.day.major {
		opacity: 1;
		font-size: 12px;
	}
	.day.on {
		opacity: 1;
		fill: var(--text-primary);
		font-size: 13px;
	}
	.year {
		fill: var(--text-muted);
		font-size: 10px;
		font-variation-settings: 'wght' 750;
		text-anchor: middle;
		dominant-baseline: middle;
		letter-spacing: 0.02em;
		pointer-events: none;
	}
	.year.on {
		fill: var(--text-primary);
	}
	.year.live {
		fill: var(--live);
	}
	.hub-ring {
		fill: none;
		stroke: var(--grid-line);
		stroke-width: 1;
	}
</style>
