<script lang="ts">
	import AoutCircle from '$lib/AoutCircle.svelte';
	import AoutHub from '$lib/AoutHub.svelte';
	import AoutClock from '$lib/AoutClock.svelte';
	import CircleLegend from '$lib/CircleLegend.svelte';
	import MetricSwitch from '$lib/MetricSwitch.svelte';
	import Legend from '$lib/Legend.svelte';
	import SeasonRail from '$lib/SeasonRail.svelte';
	import Records from '$lib/Records.svelte';
	import Takeaways from '$lib/Takeaways.svelte';
	import SubsChart from '$lib/SubsChart.svelte';
	import { makeBuckets, metricBy, type MetricKey } from '$lib/aout/metrics';
	import { fmtViews, fmtHours, fmtDur } from '$lib/aout/format';
	import type { Video } from '$lib/aout/types';

	let { data } = $props();

	let metricKey = $state<MetricKey>('views');
	let proportional = $state(true);
	let hovered = $state<{ season: number; episode: number } | null>(null);
	let pinnedSeason = $state<number | null>(null);
	let hoverSeason = $state<number | null>(null);
	let open = $state<Video | null>(null);

	const metric = $derived(metricBy(metricKey));
	const buckets = $derived(makeBuckets(metric, data.videos));
	const byKey = $derived(new Map(data.videos.map((v) => [`${v.season}:${v.episode}`, v])));
	const hoverVideo = $derived(hovered ? (byKey.get(`${hovered.season}:${hovered.episode}`) ?? null) : null);

	const focusSeason = $derived(pinnedSeason ?? hoverSeason);

	const durations = $derived(data.seasons.map((s) => s.durationMean));
	const shortest = $derived(data.seasons.find((s) => s.durationMean === Math.min(...durations))!);
	const longest = $derived(data.seasons.find((s) => s.durationMean === Math.max(...durations))!);

	const totals = $derived({
		episodes: data.videos.length,
		views: data.seasons.reduce((a, s) => a + s.viewsTotal, 0),
		secs: data.seasons.reduce((a, s) => a + s.durationTotal, 0),
		restricted: data.videos.filter((v) => v.status === 'restricted').length,
		gone: data.videos.filter((v) => v.status === 'private' || v.status === 'removed').length
	});

	/* Jours sans épisode : uniquement sur les saisons terminées, la saison en
	   cours n'a pas de trous mais un futur. */
	const missingDays = $derived(
		data.seasons
			.filter((s) => !s.partial)
			.reduce(
				(a, s) =>
					a +
					Math.max(
						0,
						31 - data.videos.filter((v) => v.season === s.season && v.episode <= 31).length
					),
				0
			)
	);

	function reset() {
		pinnedSeason = null;
		hoverSeason = null;
		open = null;
	}

	let openBefore: Video | null = null;

	function trackClick() {
		openBefore = open;
	}

	function closeOnOutside(e: MouseEvent) {
		if (!open || open !== openBefore) return;
		if ((e.target as Element | null)?.closest('.hub-slot')) return;
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

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			reset();
			return;
		}
		if (!open) return;
		const map: Record<string, { ep: number; season: number }> = {
			ArrowLeft: { ep: -1, season: 0 },
			ArrowRight: { ep: 1, season: 0 },
			ArrowUp: { ep: 0, season: -1 },
			ArrowDown: { ep: 0, season: 1 }
		};
		const d = map[e.key];
		if (d) {
			e.preventDefault();
			step(d);
		}
	}
</script>

<svelte:window onkeydown={onKey} onclickcapture={trackClick} onclick={closeOnOutside} />

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="page" onclick={(e) => e.target === e.currentTarget && reset()}>
	<header class="hero">
		<p class="kicker">2017 à 2026, dix étés, une vidéo par jour</p>
		<h1>Léna Situations<br /><span>dix ans de vlogs d'août</span></h1>
		<p class="lede">
			Dix saisons du rituel, épisode par épisode :
			<b class="tnum">{totals.episodes} épisodes</b>,
			<b class="tnum">{fmtViews(totals.views)} de vues cumulées</b>,
			<b class="tnum">{fmtHours(totals.secs)} de vlog</b>, des épisodes passés de
			<b class="tnum">{fmtDur(shortest.durationMean)} à {fmtDur(longest.durationMean)}</b>, publiés à
			<b class="tnum">20h50</b>.
		</p>
		<p class="lede">
			Chaque anneau est une année, chaque secteur un jour du mois.
			<strong>Cliquez une case pour regarder le vlog</strong> : le centre du cercle est l'objectif.
		</p>
	</header>

	<div class="main">
		<aside class="side">
			<section class="controls">
				<p class="rx-titre">Colorer le cercle par</p>
				<MetricSwitch bind:active={metricKey} />
				<Legend {buckets} label={metric.label} />
				<label class="toggle">
					<input type="checkbox" bind:checked={proportional} />
					épaisseur des anneaux proportionnelle à la durée
				</label>
			</section>

			<section class="block">
				<p class="rx-titre">Vues moyennes par saison</p>
				<SeasonRail seasons={data.seasons} bind:pinned={pinnedSeason} bind:hover={hoverSeason} />
				<p class="hint">
					Cliquez une année pour l'isoler dans le cercle, cliquez à nouveau ou appuyez sur Échap
					pour tout réafficher.
				</p>
			</section>

			<section class="block">
				<p class="rx-titre">Durée moyenne des épisodes par saison</p>
				<SeasonRail
					seasons={data.seasons}
					bind:pinned={pinnedSeason}
					bind:hover={hoverSeason}
					value={(s) => s.durationMean}
					fmt={fmtDur}
				/>
				<p class="hint">
					Le format a plus que doublé : {fmtDur(shortest.durationMean)} en {shortest.year},
					{fmtDur(longest.durationMean)} en {longest.year}. C'est cette progression que l'épaisseur
					des anneaux rend visible.
				</p>
			</section>
		</aside>

		<section class="viz">
			<div class="wrap">
				<CircleLegend gone={totals.gone} restricted={totals.restricted} missing={missingDays} />
				{#if open}
					<button class="backdrop" aria-label="Fermer la vidéo" onclick={() => (open = null)}></button>
				{/if}
				<AoutCircle
					videos={data.videos}
					seasons={data.seasons}
					markers={data.markers}
					{buckets}
					{proportional}
					{focusSeason}
					bind:hovered
					onpick={(v) => (open = v)}
					onreset={reset}
				/>
				<div class="hub-slot" class:open={!!open}>
					<AoutHub
						seasons={data.seasons}
						{hoverVideo}
						{metric}
						total={totals.episodes}
						bind:open
						onclose={reset}
						onstep={step}
					/>
				</div>
			</div>

			{#if pinnedSeason != null}
				<div class="under">
					<button class="rx-pill reset" onclick={reset}>tout réafficher</button>
				</div>
			{/if}

			<div class="notes">
				<p class="metric-note"><b>{metric.label} :</b> {metric.blurb}</p>
				<p>
					<b>Le mois d'août dure jusqu'au 1<sup>er</sup> septembre.</b> Elle filme le jour J et publie
					le lendemain : la saison démarre le 2 août. Le cercle est donc numéroté par épisode et non
					par date. <b>Le pic, c'est 2020</b>, 1,94 million de vues par vlog, jamais rebattu depuis alors que la
					chaîne a continué de grossir. Et <b>le premier épisode boucle le dernier</b> : en 2017,
					<i>CECI EST MON NOUVEAU CHALLENGE</i> ; en 2026, <i>CECI EST MON DERNIER CHALLENGE</i>.
				</p>
				<p>
					Une vidéo de 2017 a eu neuf ans pour accumuler ses vues, celle d'hier un jour : les cases
					récentes sont mécaniquement pâles, et le classement par vues favorise les anciennes.
				</p>
				<p class="source">
					Source :
					<a href="https://www.youtube.com/@LenaSituations" target="_blank" rel="noopener">
						chaîne YouTube de Léna Situations
					</a>, extraction du 22 août 2026. {totals.episodes} épisodes recensés, dont
					{totals.restricted} soumis à connexion (toujours en ligne, mais compteurs inaccessibles) et
					{totals.gone} passés en privé ou supprimés.
				</p>
			</div>
		</section>
	</div>

	<section class="block">
		<p class="rx-titre">Dix enseignements sur dix ans de vlogs d'août</p>
		<Takeaways videos={data.videos} seasons={data.seasons} subs={data.subs} />
	</section>

	<section class="block">
		<p class="rx-titre">Les dix vlogs les plus vus des dix ans</p>
		<Records videos={data.videos} limit={10} onpick={(v) => (open = v)} />
	</section>

	<div class="bottom">
		<section class="block">
			<p class="rx-titre">Ce que chaque mois d'août fait aux abonnés</p>
			<p class="prose">
				YouTube ne publie pas l'historique de ses compteurs. Cette courbe est reconstruite à partir
				de <b>159 copies de la page de la chaîne conservées par l'Internet Archive</b> entre janvier
				2018 et août 2026 : chacune porte le nombre d'abonnés affiché le jour où elle a été
				enregistrée. Les bandes orange sont les dix saisons de vlogs, le chiffre au-dessus le gain
				d'abonnés ramené à trente jours.
			</p>
			<SubsChart subs={data.subs} focus={focusSeason} />
			<p class="hint">
				Source : Internet Archive (Wayback Machine), 159 copies de youtube.com/@lenasituations,
				janvier 2018 - août 2026.
			</p>
		</section>

		<section class="block">
			<p class="rx-titre">Le rendez-vous de 20h50</p>
			<p class="prose">
				Chaque point est un vlog, placé à son heure de publication ; survolez-en un pour le détail.
				Les orbites vont de 2017 au centre à 2026 au bord. Le chiffre au centre est la
				<b>médiane des publications depuis 2021</b>, une fois le rendez-vous installé.
			</p>
			<div class="clock">
				<AoutClock videos={data.videos} seasons={data.seasons} focus={focusSeason} />
			</div>
		</section>
	</div>
</div>

<style>
	.page {
		width: 100%;
		padding: 36px clamp(16px, 2.5vw, 44px) 60px;
		display: flex;
		flex-direction: column;
		gap: 26px;
	}

	.hero {
		text-align: center;
		max-width: 48em;
		margin: 0 auto;
	}
	.kicker {
		margin: 0;
		font-size: var(--text-12);
		font-variation-settings: 'wght' 750;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}
	h1 {
		margin: 10px 0 0;
		font-size: clamp(34px, 6vw, 64px);
		font-variation-settings: 'wght' 860;
		line-height: var(--leading-tight);
		letter-spacing: -0.03em;
	}
	h1 span {
		color: var(--accent);
	}
	.lede {
		margin: 14px auto 0;
		max-width: 40em;
		font-size: var(--text-18);
		line-height: var(--leading-normal);
		color: var(--text-secondary);
	}
	.lede b {
		color: var(--text-primary);
		font-variation-settings: 'wght' 750;
		white-space: nowrap;
	}
	.lede strong {
		color: var(--text-primary);
		font-variation-settings: 'wght' 750;
	}
	.lede + .lede {
		font-size: var(--text-16);
		margin-top: 10px;
	}

	/* Filtres à gauche, cercle à droite. */
	.main {
		display: grid;
		grid-template-columns: minmax(300px, 380px) minmax(440px, 1fr);
		gap: 20px;
		align-items: start;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.viz {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	/* Le cercle ne doit jamais déborder de la hauteur d'écran : il est carré,
	   donc borner la largeur borne la hauteur. */
	.wrap {
		position: relative;
		container-type: inline-size;
		width: min(100%, 860px, 78vh);
		margin: 0 auto;
	}
	/* Le conteneur est carré : sans ces deux règles, ses quatre coins captent le
	   survol par-dessus les anneaux les plus fins, aux diagonales. */
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
		animation: fade 0.4s var(--easing);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	.under {
		display: flex;
		justify-content: center;
	}
	.notes {
		max-width: 66em;
	}
	.notes p {
		margin: 0;
		font-size: var(--text-12);
		line-height: var(--leading-normal);
		color: var(--text-muted);
	}
	.notes p + p {
		margin-top: 8px;
	}
	.notes b {
		color: var(--text-secondary);
		font-variation-settings: 'wght' 750;
	}
	.notes i {
		font-style: normal;
		color: var(--accent-2);
	}
	/* La description de la métrique vit ici plutôt que dans la carte des
	   filtres : la carte garde une hauteur fixe et le texte reste sous l'œil. */
	.notes .metric-note {
		min-height: calc(2 * 1.5 * var(--text-12));
		color: var(--text-secondary);
	}
	.notes .source a {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.notes .source {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid var(--grid-line);
	}

	.controls,
	.block {
		background: var(--surface-card);
		border-radius: var(--radius-md);
		padding: 20px 22px;
	}
	.controls > :global(.legend) {
		margin-top: 14px;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 14px;
		font-size: var(--text-14);
		color: var(--text-secondary);
		cursor: pointer;
	}
	.toggle input {
		accent-color: var(--accent);
		width: 16px;
		height: 16px;
	}
	/* Les deux cartes du bas partagent la hauteur de la plus haute. */
	.bottom {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: 20px;
		align-items: stretch;
	}
	.bottom > :global(section) {
		display: flex;
		flex-direction: column;
	}
	.clock {
		flex: 1;
		display: grid;
		place-items: center;
		width: 100%;
		max-width: 380px;
		margin: 8px auto 0;
	}
	.prose b {
		color: var(--text-primary);
		font-variation-settings: 'wght' 650;
	}
	.prose {
		margin: 0 0 14px;
		font-size: var(--text-14);
		line-height: var(--leading-normal);
		color: var(--text-secondary);
	}
	.hint {
		margin: 12px 0 0;
		font-size: var(--text-12);
		line-height: var(--leading-normal);
		color: var(--text-muted);
	}

	@media (max-width: 980px) {
		.main {
			grid-template-columns: 1fr;
		}
		.bottom {
			grid-template-columns: 1fr;
		}
	}
</style>
