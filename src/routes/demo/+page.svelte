<script lang="ts">
	import AoutCircle from '$lib/AoutCircle.svelte';
	import AoutHub from '$lib/AoutHub.svelte';
	import CircleLegend from '$lib/CircleLegend.svelte';
	import MetricSwitch from '$lib/MetricSwitch.svelte';
	import RangeSlider from '$lib/RangeSlider.svelte';
	import Legend from '$lib/Legend.svelte';
	import SeasonRail from '$lib/SeasonRail.svelte';
	import { makeBuckets, metricBy, type MetricKey } from '$lib/aout/metrics';
	import { fmtViews } from '$lib/aout/format';
	import type { Video } from '$lib/aout/types';

	let { data } = $props();

	let metricKey = $state<MetricKey>('views');
	let proportional = $state(true);
	let hovered = $state<{ season: number; episode: number } | null>(null);
	let pinnedSeason = $state<number | null>(null);
	let hoverSeason = $state<number | null>(null);
	let open = $state<Video | null>(null);

	const viewBounds = $derived.by(() => {
		const vs = data.videos.map((v) => v.views).filter((x): x is number => x != null);
		const step = 50_000;
		return {
			min: Math.floor(Math.min(...vs) / step) * step,
			max: Math.ceil(Math.max(...vs) / step) * step,
			step
		};
	});
	let viewLo = $state<number | null>(null);
	let viewHi = $state<number | null>(null);
	const lo = $derived(viewLo ?? viewBounds.min);
	const hi = $derived(viewHi ?? viewBounds.max);
	const filtering = $derived(metricKey === 'views' && (lo > viewBounds.min || hi < viewBounds.max));
	const inRange = $derived((v: Video) =>
		!filtering ? true : v.views != null && v.views >= lo && v.views <= hi
	);
	const shown = $derived(data.videos.filter(inRange));

	const metric = $derived(metricBy(metricKey));
	const buckets = $derived(makeBuckets(metric, data.videos));
	const byKey = $derived(new Map(data.videos.map((v) => [`${v.season}:${v.episode}`, v])));
	const hoverVideo = $derived(
		hovered ? (byKey.get(`${hovered.season}:${hovered.episode}`) ?? null) : null
	);
	const focusSeason = $derived(pinnedSeason ?? hoverSeason);

	function reset() {
		pinnedSeason = null;
		hoverSeason = null;
		open = null;
	}

	function step(d: { ep: number; season: number }) {
		if (!open) return;
		const season = Math.min(10, Math.max(1, open.season + d.season));
		const episode = open.episode + d.ep;
		const next =
			byKey.get(`${season}:${episode}`) ??
			byKey.get(`${season}:${open.episode}`) ??
			byKey.get(`${open.season}:${episode}`);
		if (next?.available) open = next;
	}
</script>

<div class="frame">
	<header>
		<p class="kicker">2017 à 2026 · une vidéo par jour</p>
		<h1>Léna Situations <span>dix ans de vlogs d'août</span></h1>
	</header>

	<div class="body">
		<aside>
			<p class="rx-titre">Colorer le cercle par</p>
			<MetricSwitch bind:active={metricKey} />
			<Legend {buckets} label={metric.label} />
			{#if metricKey === 'views'}
				<RangeSlider
					min={viewBounds.min}
					max={viewBounds.max}
					step={viewBounds.step}
					bind:lo={() => lo, (v) => (viewLo = v)}
					bind:hi={() => hi, (v) => (viewHi = v)}
					label="Filtrer par vues"
					fmt={fmtViews}
					count="{shown.length} / {data.videos.length} vlogs"
				/>
			{/if}
			<label class="toggle">
				<input type="checkbox" bind:checked={proportional} />
				épaisseur proportionnelle à la durée
			</label>
			<div class="rail">
				<p class="rx-titre">Vues moyennes par saison</p>
				<SeasonRail seasons={data.seasons} bind:pinned={pinnedSeason} bind:hover={hoverSeason} />
			</div>
		</aside>

		<section class="stage">
			<div class="wrap">
				<CircleLegend
					gone={data.videos.filter((v) => !v.measured).length}
					approx={data.videos.filter((v) => v.approx).length}
					missing={31 * 9 - data.videos.filter((v) => v.season < 10 && v.episode <= 31).length}
				/>
				{#if open}
					<button class="backdrop" aria-label="Fermer" onclick={() => (open = null)}></button>
				{/if}
				<AoutCircle
					videos={data.videos}
					seasons={data.seasons}
					markers={data.markers}
					{buckets}
					{proportional}
					{focusSeason}
					{inRange}
					bind:hovered
					onpick={(v) => (open = v)}
					onreset={reset}
				/>
				<div class="hub-slot" class:open={!!open}>
					<AoutHub
						seasons={data.seasons}
						{hoverVideo}
						{metric}
						total={shown.length}
						totalViews={shown.reduce((a, v) => a + (v.views ?? 0), 0)}
						totalSecs={shown.reduce((a, v) => a + (v.duration ?? 0), 0)}
						bind:open
						onclose={reset}
						onstep={step}
					/>
				</div>
			</div>
		</section>
	</div>

	<footer>
		<span class="url">amcaw.github.io/lenasituations</span>
	</footer>
</div>

<style>
	:global(body) {
		background: var(--surface-page);
		overflow: hidden;
	}
	.frame {
		width: 100vw;
		height: 100vh;
		padding: 3.2vmin 3.6vmin 2.6vmin;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 1.6vmin;
		background:
			radial-gradient(120% 80% at 62% 44%, rgba(255, 107, 74, 0.1), transparent 66%),
			var(--surface-page);
	}
	header {
		text-align: left;
	}
	.kicker {
		margin: 0;
		font-size: 1.5vmin;
		font-variation-settings: 'wght' 750;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
	}
	h1 {
		margin: 0.5vmin 0 0;
		font-size: 3.5vmin;
		font-variation-settings: 'wght' 860;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}
	h1 span {
		color: var(--accent);
	}

	.body {
		display: grid;
		grid-template-columns: 27.5% 1fr;
		gap: 2.4vmin;
		min-height: 0;
	}
	aside {
		display: flex;
		flex-direction: column;
		gap: 1.4vmin;
		font-size: 1.6vmin;
		min-width: 0;
	}
	.rail {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 0.8vmin;
	}
	.toggle {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		color: var(--text-secondary);
		line-height: 1.3;
	}
	.toggle input {
		accent-color: var(--accent);
		width: 16px;
		height: 16px;
		flex: none;
	}

	.stage {
		display: grid;
		place-items: center;
		min-width: 0;
		min-height: 0;
	}
	.wrap {
		position: relative;
		container-type: inline-size;
		width: min(100%, 100cqh);
		aspect-ratio: 1;
	}
	.hub-slot {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 35.2%;
		aspect-ratio: 1;
		border-radius: 50%;
		pointer-events: none;
		z-index: 3;
		transition: width 0.55s var(--easing);
	}
	.hub-slot.open {
		width: 64%;
		pointer-events: auto;
	}
	.backdrop {
		position: absolute;
		inset: -4%;
		z-index: 2;
		border: 0;
		border-radius: 50%;
		background: var(--surface-page);
		opacity: 0.75;
		cursor: zoom-out;
	}

	footer {
		min-height: 4.4vmin;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2vmin;
		font-size: 1.6vmin;
	}
	.url {
		margin-left: auto;
		font-size: 1.4vmin;
		letter-spacing: 0.06em;
		color: var(--text-secondary);
	}
</style>
