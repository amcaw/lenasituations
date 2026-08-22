<script lang="ts">
	import type { Video, Season, SubPoint } from './aout/types';
	import { fmtDur, fmtViews, fmtPct, fmtHours, fmtInt } from './aout/format';

	let {
		videos,
		seasons,
		subs
	}: { videos: Video[]; seasons: Season[]; subs: SubPoint[] } = $props();


	const august = $derived.by(() => {
		const pts = subs.map((p) => ({ d: new Date(p.date).getTime(), v: p.subs }));
		const near = (t: number, maxDays: number) => {
			const b = pts.reduce((a, p) => (Math.abs(p.d - t) < Math.abs(a.d - t) ? p : a));
			return Math.abs(b.d - t) <= maxDays * 864e5 ? b : null;
		};
		const day = 864e5;
		const gains: { year: number; gain: number; ratio: number | null }[] = [];
		for (let y = 2018; y <= 2026; y++) {
			const a = near(Date.UTC(y, 7, 1), 25);
			const b = near(Date.UTC(y, 8, 3), 25);
			if (!a || !b || b.d <= a.d) continue;
			const perMonth = ((b.v - a.v) / (b.d - a.d)) * day * 30;
			const others: number[] = [];
			for (let m = 0; m < 12; m++) {
				if (m === 7) continue;
				const x = near(Date.UTC(y, m, 1), 20);
				const z = near(Date.UTC(y, m, 28), 20);
				if (x && z && z.d - x.d >= 15 * day) others.push(((z.v - x.v) / (z.d - x.d)) * day * 30);
			}
			const med = others.length ? others.sort((p, q) => p - q)[Math.floor(others.length / 2)] : null;
			gains.push({ year: y, gain: perMonth, ratio: med && med > 0 ? perMonth / med : null });
		}
		const done = gains.filter((g) => g.year < 2026);
		const ratios = done.map((g) => g.ratio).filter((r): r is number => r != null);
		return {
			lo: Math.min(...done.map((g) => g.gain)),
			hi: Math.max(...done.map((g) => g.gain)),
			minRatio: Math.min(...ratios),
			maxRatio: Math.max(...ratios),
			n: done.length
		};
	});

	const closed = $derived(seasons.filter((s) => !s.partial));
	const best = <T,>(arr: T[], key: (x: T) => number) =>
		arr.reduce((a, b) => (key(b) > key(a) ? b : a));

	const shortest = $derived(closed.reduce((a, b) => (b.durationMean < a.durationMean ? b : a)));
	const longest = $derived(best(closed, (s) => s.durationMean));
	const peakViews = $derived(best(closed, (s) => s.viewsMean));
	const peakLikes = $derived(best(closed, (s) => s.likeRate ?? 0));
	const last = $derived(seasons[seasons.length - 1]);

	/* Les titres anciens traînent un suffixe de chaîne (« || Léna Situations ») :
	   on le retire pour citer le titre en clair. */
	const opener = (season: number) =>
		(videos.find((v) => v.season === season && v.episode === 1)?.title ?? '')
			.replace(/\s*(\|\||-|–)\s*L[ée]na Situations\s*$/i, '')
			.trim();

	/* Érosion au fil du mois : vues du premier et du dernier épisode, rapportées
	   à la moyenne de leur propre saison. Les saisons closes seulement, pour que
	   l'âge des vidéos ne fausse pas la comparaison. */
	const arc = $derived.by(() => {
		const ratios = closed.map((s) => {
			const e = videos
				.filter((v) => v.season === s.season && v.measured && v.views)
				.sort((a, b) => a.episode - b.episode);
			const mean = e.reduce((a, v) => a + (v.views ?? 0), 0) / e.length;
			return { first: (e[0].views ?? 0) / mean, last: (e[e.length - 1].views ?? 0) / mean };
		});
		const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
		return { first: avg(ratios.map((r) => r.first)), last: avg(ratios.map((r) => r.last)) };
	});

	const spread = $derived({
		early: best(closed, (s) => s.viewsMax / s.viewsMedian),
		late: closed[closed.length - 1]
	});

	const missed = $derived(
		closed.map((s) => ({
			year: s.year,
			n: 31 - videos.filter((v) => v.season === s.season && v.episode <= 31).length
		}))
	);
	const perfect = $derived(missed.filter((m) => m.n === 0));
	const worst = $derived(best(missed, (m) => m.n));

	const longestEp = $derived(
		videos.filter((v) => v.duration).sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))[0]
	);
	const totalHours = $derived(seasons.reduce((a, s) => a + s.durationTotal, 0));
	const totalViews = $derived(seasons.reduce((a, s) => a + s.viewsTotal, 0));
</script>

<ol class="takeaways">
	<li>
		<b>Le format a plus que doublé.</b>
		{fmtDur(shortest.durationMean)} par épisode en {shortest.year}, {fmtDur(longest.durationMean)} en
		{longest.year}. C'est l'évolution que l'épaisseur des anneaux rend visible d'un coup d'œil.
	</li>
	<li>
		<b>Le pic d'audience, c'est l'année {peakViews.year}</b>, avec {fmtViews(peakViews.viewsMean)} de vues par
		vlog. Un score jamais rebattu depuis, alors que la chaîne a continué de gagner des abonnés.
	</li>
	<li>
		<b>Le public le plus engagé n'est pas le plus large.</b> Le taux de likes culmine en
		{peakLikes.year} à {fmtPct(peakLikes.likeRate)}, un an après le pic de vues, puis redescend
		saison après saison.
	</li>
	<li>
		<b>L'audience s'érode au fil du mois d'août.</b> Le premier épisode d'une saison fait en moyenne
		{Math.round(arc.first * 100)} % des vues de sa saison, le dernier {Math.round(arc.last * 100)} %.
		Près du double.
	</li>
	<li>
		<b>Un mois d'août vaut une année d'abonnés.</b> Les chiffres d'abonnés reconstitués depuis les archives de la chaîne sur la Wayback Machine montre le rôle central des vlogs d'août dans la fidélisation du public de Léna Situations :
		le gain d'abonnés pendant la saison va de {fmtInt(Math.round(august.lo / 1000) * 1000)} à
		{fmtInt(Math.round(august.hi / 1000) * 1000)} selon les années, soit
		{august.minRatio.toFixed(0)} à {august.maxRatio.toFixed(0)} fois le rythme des autres mois.
	</li>
	<li>
		<b>Le défi d'un vlog par jour n'est vraiment tenu qu'à partir de 2022.</b>
		{perfect.length} saisons sans aucun jour manqué ({perfect.map((m) => m.year).join(', ')}), contre
		{worst.n} jours sautés pour la seule saison {worst.year}.
	</li>
	<li>
		<b>La publication du rendez-vous s'est progressivement verrouillée à 20h50.</b> 20h00 en 2017, 22h22 en 2020, puis une médiane
		stable à quelques minutes près depuis 2021.
	</li>
	<li>
		<b>Le carton isolé a disparu.</b> En {spread.early.year}, un vlog explosait à
		{fmtViews(spread.early.viewsMax)} de vues quand les autres tournaient autour de
		{fmtViews(spread.early.viewsMedian)}. En {spread.late.year}, le meilleur jour fait
		{fmtViews(spread.late.viewsMax)} et un jour ordinaire {fmtViews(spread.late.viewsMedian)}.
	</li>
	<li>
		<b>Le premier épisode boucle le dernier.</b> En {seasons[0].year}, la saison s'ouvre sur
		<i>{opener(1)}</i>. En {last.year}, sur <i>{opener(10)}</i>. Neuf ans d'écart, un mot changé :
		dans le cercle, les deux cases sont sur le même rayon, reliées par le trait orange.
	</li>
	<li>
		<b>Dix étés tiennent en {fmtHours(totalHours)}</b>, soit {(totalHours / 86400)
			.toFixed(1)
			.replace('.', ',')} jours de visionnage non-stop et {fmtViews(totalViews)} de vues. Le plus long
		épisode de la décennie, {fmtDur(longestEp?.duration)}, est dans la dernière saison. Preuve que, même après dix ans de vlogs, Léna Situations en donne toujours plus à ses fans.
	</li>
</ol>

<style>
	.takeaways {
		list-style: none;
		counter-reset: t;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px 40px;
	}
	li {
		counter-increment: t;
		position: relative;
		padding-left: 34px;
		font-size: var(--text-14);
		line-height: var(--leading-normal);
		color: var(--text-secondary);
	}
	li::before {
		content: counter(t);
		position: absolute;
		left: 0;
		top: 1px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: var(--text-12);
		font-variation-settings: 'wght' 750;
		display: grid;
		place-items: center;
		font-variant-numeric: tabular-nums;
	}
	b {
		color: var(--text-primary);
		font-variation-settings: 'wght' 750;
	}
	i {
		font-style: normal;
		color: var(--accent-2);
	}
	@media (max-width: 860px) {
		.takeaways {
			grid-template-columns: 1fr;
		}
	}
</style>
