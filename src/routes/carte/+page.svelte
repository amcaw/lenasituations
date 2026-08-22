<script lang="ts">
	import SubsChart from '$lib/SubsChart.svelte';
	import AoutClock from '$lib/AoutClock.svelte';
	import Records from '$lib/Records.svelte';
	import Takeaways from '$lib/Takeaways.svelte';
	import { fmtViews } from '$lib/aout/format';

	let { data } = $props();

	const n =
		typeof window === 'undefined' ? 1 : Number(new URLSearchParams(location.search).get('n') || 1);

	const august = $derived.by(() => {
		const gains: number[] = [];
		for (let y = 2018; y <= 2025; y++) {
			const near = (t: number) =>
				data.subs
					.map((p) => ({ d: new Date(p.date).getTime(), v: p.subs }))
					.reduce((a, p) => (Math.abs(p.d - t) < Math.abs(a.d - t) ? p : a));
			const a = near(Date.UTC(y, 7, 1));
			const b = near(Date.UTC(y, 8, 3));
			if (b.d > a.d) gains.push(((b.v - a.v) / (b.d - a.d)) * 864e5 * 30);
		}
		return Math.round(gains.reduce((x, y) => x + y, 0) / gains.length / 1000) * 1000;
	});

	const best = $derived(
		[...data.videos].filter((v) => v.views).sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0]
	);

	const CARDS = $derived([
		{
			kicker: 'Ce que le rituel fabrique',
			title: "Un mois d'août vaut une année d'abonnés",
			lede: `Reconstruit depuis 159 copies archivées de la page de la chaîne. Chaque bande orange est une saison de vlogs : en moyenne <b>+${Math.round(august / 1000)} 000 abonnés</b> sur le mois, plusieurs fois le rythme du reste de l'année.`,
			foot: 'Source : Internet Archive, janvier 2018 - août 2026'
		},
		{
			kicker: 'Une heure devenue institution',
			title: 'Le rendez-vous de 20h50',
			lede: 'Chaque point est un vlog, placé à son heure de publication. Les orbites vont de 2017 au centre à 2026 au bord. <b>20h00 en 2017, 22h22 en 2020</b>, puis une médiane stable à quelques minutes près depuis 2021.',
			foot: 'Médiane des publications depuis 2021'
		},
		{
			kicker: 'Le sommet de dix ans',
			title: 'Les dix vlogs les plus vus',
			lede: `Le record tient depuis 2019 : <b>${best?.title}</b>, ${fmtViews(best?.views ?? 0)} de vues. Une vidéo de 2017 a eu neuf ans pour les accumuler, celle d'hier un jour.`,
			foot: 'Vues cumulées au 22 août 2026'
		},
		{
			kicker: 'Ce que dix ans racontent',
			title: 'Dix enseignements',
			lede: '',
			foot: '268 épisodes analysés, de 2017 à 2026'
		}
	]);

	const card = $derived(CARDS[Math.min(4, Math.max(1, n)) - 1]);
</script>

<div class="carte" class:dense={n === 4}>
	<header>
		<p class="kicker">{card.kicker}</p>
		<h1>{card.title}</h1>
		{#if card.lede}<p class="lede">{@html card.lede}</p>{/if}
	</header>

	<div class="stage">
		{#if n === 1}
			<div class="wide"><SubsChart subs={data.subs} /></div>
		{:else if n === 2}
			<div class="clock"><AoutClock videos={data.videos} seasons={data.seasons} /></div>
		{:else if n === 3}
			<Records videos={data.videos} limit={10} />
		{:else}
			<Takeaways videos={data.videos} seasons={data.seasons} subs={data.subs} />
		{/if}
	</div>

	<footer>
		<span class="brand">Léna Situations · dix ans de vlogs d'août</span>
		<span class="src">{card.foot}</span>
		<span class="url">amcaw.github.io/lenasituations</span>
	</footer>
</div>

<style>
	:global(body) {
		background: var(--surface-page);
		overflow: hidden;
	}
	.carte {
		width: 100vw;
		height: 100vh;
		padding: 6vw 5.5vw 4.5vw;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 3.4vw;
		background:
			radial-gradient(120% 70% at 50% 30%, rgba(255, 107, 74, 0.15), transparent 68%),
			var(--surface-page);
	}
	.kicker {
		margin: 0;
		font-size: 1.9vw;
		font-variation-settings: 'wght' 750;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
	}
	h1 {
		margin: 1.4vw 0 0;
		font-size: 6.4vw;
		line-height: 1.02;
		font-variation-settings: 'wght' 860;
		letter-spacing: -0.035em;
	}
	.lede {
		margin: 2.2vw 0 0;
		font-size: 2.5vw;
		line-height: 1.45;
		color: var(--text-secondary);
	}
	.lede :global(b) {
		color: var(--text-primary);
		font-variation-settings: 'wght' 750;
	}

	.stage {
		display: grid;
		align-content: center;
		min-height: 0;
	}
	.wide {
		width: 112%;
		margin: 0 -6%;
	}
	.clock {
		width: min(100%, 52vh);
		margin: 0 auto;
	}
	.stage :global(.records) {
		grid-template-columns: 1fr;
		gap: 0.7vw;
	}
	.stage :global(.records button) {
		gap: 1.6vw;
		padding: 0.7vw 1.4vw 0.7vw 0.8vw;
		border-radius: 1vw;
	}
	.stage :global(.records img) {
		width: 7vw;
	}
	.stage :global(.records .rank) {
		font-size: 2.6vw;
		width: 3.4vw;
	}
	.stage :global(.records strong) {
		font-size: 2.2vw;
	}
	.stage :global(.records .meta) {
		font-size: 1.7vw;
	}
	.stage :global(.takeaways) {
		gap: 2.2vw 3.2vw;
	}
	.stage :global(.takeaways li) {
		font-size: 1.75vw;
		padding-left: 4.4vw;
		line-height: 1.42;
	}
	.stage :global(.takeaways li::before) {
		width: 3.5vw;
		height: 3.5vw;
		font-size: 1.65vw;
		top: 0;
	}
	.dense h1 {
		font-size: 5.2vw;
	}

	footer {
		display: flex;
		flex-direction: column;
		gap: 0.6vw;
		font-size: 1.7vw;
		color: var(--text-secondary);
		border-top: 1px solid var(--state-empty);
		padding-top: 2.2vw;
	}
	.brand {
		color: var(--text-primary);
		font-variation-settings: 'wght' 750;
	}
	.url {
		color: var(--accent);
		letter-spacing: 0.06em;
	}
</style>
