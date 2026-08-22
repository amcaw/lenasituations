<script lang="ts">
	import AoutCircle from '$lib/AoutCircle.svelte';
	import { makeBuckets, metricBy } from '$lib/aout/metrics';
	import { fmtViews, fmtHours, fmtDur } from '$lib/aout/format';
	import { bucketVar } from '$lib/aout/metrics';

	let { data } = $props();

	const metric = metricBy('views');
	const buckets = $derived(makeBuckets(metric, data.videos));
	let hovered = $state(null);

	/* ?inv pour la variante à échelle inversée. */
	const reverse = typeof window !== 'undefined' && new URLSearchParams(location.search).has('inv');
	const ramp = $derived(reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5]);

	const totals = $derived({
		episodes: data.videos.length,
		views: data.seasons.reduce((a, s) => a + s.viewsTotal, 0),
		secs: data.seasons.reduce((a, s) => a + s.durationTotal, 0)
	});
	const durs = $derived(data.seasons.map((s) => s.durationMean));
</script>

<div class="poster">
	<header>
		<p class="kicker">2017 à 2026 · dix étés · une vidéo par jour</p>
		<h1>Léna Situations</h1>
		<p class="sub">dix ans de vlogs d'août</p>
	</header>

	<div class="stage">
		<AoutCircle
			videos={data.videos}
			seasons={data.seasons}
			markers={data.markers}
			{buckets}
			proportional={true}
			{reverse}
			bind:hovered
		/>
		<div class="hub">
			<strong class="tnum">{totals.episodes}</strong>
			<span>vlogs d'août</span>
		</div>
	</div>

	<div class="legend">
		<span class="lbl">moins vu</span>
		<div class="ramp">
			{#each ramp as i}<span style="background:{bucketVar(i, 6)}"></span>{/each}
		</div>
		<span class="lbl">plus vu</span>
	</div>

	<div class="figures">
		<div><strong class="tnum">{fmtViews(totals.views)}</strong><span>vues cumulées</span></div>
		<div><strong class="tnum">{fmtHours(totals.secs)}</strong><span>de vlog</span></div>
		<div>
			<strong class="tnum">{fmtDur(Math.min(...durs))} à {fmtDur(Math.max(...durs))}</strong>
			<span>par épisode</span>
		</div>
		<div><strong class="tnum">20h50</strong><span>l'heure fixe</span></div>
	</div>

	<footer>
		<span>Chaque anneau une saison, chaque secteur un jour du mois.</span>
		<span class="src">Données YouTube au 22 août 2026 · © Ambroise Carton 2026</span>
	</footer>
</div>

<style>
	:global(body) {
		background: var(--surface-page);
	}
	.poster {
		width: 100vw;
		height: 100vh;
		padding: 5vmin 5vmin 4vmin;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2.4vmin;
		background:
			radial-gradient(120% 80% at 50% 34%, rgba(255, 107, 74, 0.16), transparent 68%),
			var(--surface-page);
		overflow: hidden;
	}

	header {
		text-align: center;
	}
	.kicker {
		margin: 0;
		font-size: 1.9vmin;
		font-variation-settings: 'wght' 750;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--accent);
	}
	h1 {
		margin: 1.2vmin 0 0;
		font-size: 8.6vmin;
		font-variation-settings: 'wght' 860;
		line-height: 0.94;
		letter-spacing: -0.035em;
	}
	.sub {
		margin: 0.6vmin 0 0;
		font-size: 4.4vmin;
		font-variation-settings: 'wght' 860;
		letter-spacing: -0.02em;
		color: var(--accent);
	}

	/* Le cercle est carré : il faut le borner à la fois par la largeur et par la
	   hauteur disponibles, sinon il déborde sur les formats très allongés. */
	.stage {
		position: relative;
		width: min(100%, 92vmin, 58vh);
		aspect-ratio: 1;
		margin: auto 0;
		display: grid;
		place-items: center;
		container-type: inline-size;
	}
	.stage :global(.stage) {
		width: 100%;
	}
	.hub {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}
	.hub strong {
		display: block;
		font-size: 11cqw;
		font-variation-settings: 'wght' 860;
		line-height: 1;
		letter-spacing: -0.04em;
		color: var(--accent);
	}
	.hub span {
		display: block;
		margin-top: 0.6cqw;
		font-size: 2.4cqw;
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 1.4vmin;
	}
	.legend .lbl {
		font-size: 1.7vmin;
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.ramp {
		display: flex;
		gap: 0.4vmin;
	}
	.ramp span {
		width: 5vmin;
		height: 1.4vmin;
		border-radius: 2px;
	}

	.figures {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: stretch;
		gap: 1.4vmin;
		width: 100%;
	}
	.figures div {
		flex: 0 1 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 1.4vmin;
		padding: 1.8vmin 1.8vmin;
		text-align: center;
	}
	.figures strong {
		display: block;
		font-size: 2.9vmin;
		font-variation-settings: 'wght' 860;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}
	.figures div span {
		font-size: 1.6vmin;
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	footer {
		display: flex;
		justify-content: space-between;
		width: 100%;
		font-size: 1.7vmin;
		color: var(--text-muted);
	}
	footer .src {
		color: rgba(246, 239, 233, 0.32);
	}
</style>
