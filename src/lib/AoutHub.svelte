<script lang="ts">
	import { untrack } from 'svelte';
	import type { Video, Season } from './aout/types';
	import type { Metric } from './aout/metrics';
	import { fmtViews, fmtHours, fmtDayMonth, fmtYear, thumb } from './aout/format';

	let {
		seasons,
		hoverVideo,
		open = $bindable(null),
		metric,
		total,
		onclose,
		onstep
	}: {
		seasons: Season[];
		hoverVideo: Video | null;
		open: Video | null;
		metric: Metric;
		total: number;
		onclose?: () => void;
		onstep?: (d: { ep: number; season: number }) => void;
	} = $props();

	const BLADES = 6;
	const DURATION = 900;

	/* Le diaphragme est dessiné en SVG et posé PAR-DESSUS l'image : six lames
	   opaques qui pivotent et s'effacent vers le pourtour. On ne découpe rien,
	   un clip-path ne rogne pas une iframe de façon fiable hors Chromium.
	   L'animation est pilotée à la main plutôt que par un tween de bibliothèque :
	   une seule valeur, aucune surprise selon la version. */
	let t = $state(0);
	let shown = $state<Video | null>(null);
	let frame = 0;

	const cubicInOut = (p: number) =>
		p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

	function animate(to: number) {
		cancelAnimationFrame(frame);
		const from = t;
		const start = performance.now();
		const tick = (now: number) => {
			const p = Math.min(1, (now - start) / DURATION);
			t = from + (to - from) * cubicInOut(p);
			if (p < 1) frame = requestAnimationFrame(tick);
			else if (to === 0) shown = null;
		};
		frame = requestAnimationFrame(tick);
	}

	/* `untrack` est indispensable : `animate` lit `t`, et sans lui l'effet se
	   réabonnerait à chaque image, relancerait l'animation depuis le début et
	   le diaphragme resterait figé. */
	$effect(() => {
		const v = open;
		untrack(() => {
			if (v) {
				shown = v;
				animate(1);
			} else if (shown) {
				animate(0);
			}
		});
	});

	$effect(() => () => cancelAnimationFrame(frame));

	/* Une lame : secteur de 70 degrés, rayon largement supérieur au disque pour
	   que six lames le couvrent entièrement à l'ouverture zéro. */
	const BLADE_PATH = (() => {
		const r = 96;
		const half = (36 * Math.PI) / 180;
		const x1 = 50 + r * Math.cos(-half);
		const y1 = 50 + r * Math.sin(-half);
		const x2 = 50 + r * Math.cos(half);
		const y2 = 50 + r * Math.sin(half);
		return `M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
	})();

	const blades = $derived.by(() => {
		/* Le trou laissé au centre a pour rayon la course des lames : il faut
		   58 unités pour dégager un disque de rayon 50, pas davantage, sinon
		   les lames quittent le cadre avant la fin de l'animation. */
		const push = t * 58;
		const spin = (1 - t) * 50;
		return Array.from({ length: BLADES }, (_, i) => ({
			i,
			transform: `rotate(${(i * 360) / BLADES + spin} 50 50) translate(${push.toFixed(2)} 0)`
		}));
	});

	const playerReady = $derived(t > 0.985);

	const totals = $derived({
		vlogs: total,
		views: seasons.reduce((a, s) => a + s.viewsTotal, 0),
		hours: seasons.reduce((a, s) => a + s.durationTotal, 0)
	});

	const value = $derived.by(() => {
		if (!hoverVideo) return null;
		if (!hoverVideo.available) return 'aucune donnée';
		const x = metric.get(hoverVideo);
		return x == null ? 'non mesuré' : metric.fmt(x);
	});
</script>

<div class="hub" class:open={!!shown}>
	{#if shown}
		<div class="lens">
			<p class="head">
				<span class="ep">saison {shown.season}, épisode {shown.episode}</span>
				<strong class="vtitle">{shown.title}</strong>
			</p>
			<div class="player">
				<img class="poster" src={thumb(shown.id)} alt="" />
				{#if playerReady}
					<iframe
						src="https://www.youtube-nocookie.com/embed/{shown.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&iv_load_policy=3"
						title={shown.title}
						allow="autoplay; encrypted-media; picture-in-picture"
						allowfullscreen
					></iframe>
				{/if}
			</div>
			{#if open}
				<div class="controls">
					<button class="rx-pill icon" onclick={() => onstep?.({ ep: 0, season: -1 })} aria-label="Même épisode, année précédente">↑</button>
					<button class="rx-pill icon" onclick={() => onstep?.({ ep: -1, season: 0 })} aria-label="Épisode précédent">‹</button>
					<button class="rx-pill icon" onclick={() => onclose?.()} aria-label="Fermer la vidéo">✕</button>
					<button class="rx-pill icon" onclick={() => onstep?.({ ep: 1, season: 0 })} aria-label="Épisode suivant">›</button>
					<button class="rx-pill icon" onclick={() => onstep?.({ ep: 0, season: 1 })} aria-label="Même épisode, année suivante">↓</button>
				</div>
				<a class="yt" href="https://youtu.be/{shown.id}" target="_blank" rel="noopener">voir sur YouTube</a>
			{/if}
		</div>

		{#if t < 0.999}
			<svg class="iris" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
				{#each blades as b (b.i)}
					<path d={BLADE_PATH} transform={b.transform} class="blade" class:odd={b.i % 2 === 1} />
				{/each}
			</svg>
		{/if}
	{:else if hoverVideo}
		<div class="content">
			{#if hoverVideo.available}
				<img class="thumb" src={thumb(hoverVideo.id)} alt="" />
			{:else}
				<span class="gone" aria-hidden="true"></span>
			{/if}
			<span class="meta">
				saison {hoverVideo.season}, ép. {hoverVideo.episode}
				{#if hoverVideo.publishedAt}
					· {fmtDayMonth(hoverVideo.publishedAt)}
					{fmtYear(hoverVideo.publishedAt)}
				{/if}
			</span>
			{#if hoverVideo.available}
				<strong class="val">{value}</strong>
				<span class="metric">{metric.label}</span>
				<p class="title">{hoverVideo.title}</p>
				<span class="hint">cliquer pour regarder</span>
			{:else}
				<strong class="val gone-val">vidéo indisponible</strong>
				<p class="title">passée en privé ou supprimée par la chaîne</p>
			{/if}
		</div>
	{:else}
		<div class="content">
			<strong class="big tnum">{totals.vlogs}</strong>
			<span class="sub">vlogs d'août</span>
			<span class="row tnum">{fmtViews(totals.views)} vues</span>
			<span class="row tnum">{fmtHours(totals.hours)} de vidéo</span>
			<span class="row tnum">10 étés</span>
		</div>
	{/if}
</div>

<style>
	.hub {
		container-type: inline-size;
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 50%;
		overflow: hidden;
		background: var(--surface-card);
		display: grid;
		place-items: center;
		isolation: isolate;
	}
	.hub.open {
		background: #000;
	}
	/* Le disque est rond : le contenu tient dans un carré inscrit, en pile
	   verticale, pour qu'aucun texte ne se fasse rogner par le bord. */
	.lens {
		position: absolute;
		inset: 0;
		background: #000;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2.5cqw;
		padding: 0 13%;
		text-align: center;
	}
	.head {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
	}
	.ep {
		font-size: clamp(8px, 2.4cqw, 11px);
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.55);
	}
	.vtitle {
		font-size: clamp(10px, 3.4cqw, 17px);
		font-variation-settings: 'wght' 750;
		line-height: var(--leading-snug);
		color: #fff;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.player {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #000;
		flex: none;
		border-radius: var(--radius-md);
		overflow: hidden;
		/* force un contexte de composition : sinon l'iframe ignore le rayon */
		transform: translateZ(0);
	}
	.player iframe,
	.player .poster {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
	.player .poster {
		object-fit: cover;
		z-index: 0;
	}
	.player iframe {
		z-index: 1;
		animation: reveal 0.3s var(--easing);
	}
	@keyframes reveal {
		from {
			opacity: 0;
		}
	}
	.yt {
		font-size: clamp(8px, 2.4cqw, 11px);
		color: var(--accent-2);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.iris {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		pointer-events: none;
	}
	.blade {
		fill: var(--blade-lo);
		stroke: var(--blade-hi);
		stroke-width: 0.8;
	}
	.blade.odd {
		fill: var(--blade-hi);
	}

	.content {
		position: relative;
		z-index: 3;
		width: 76%;
		text-align: center;
	}
	.big {
		display: block;
		font-size: clamp(24px, 17cqw, 60px);
		font-variation-settings: 'wght' 860;
		line-height: var(--leading-tight);
		letter-spacing: -0.02em;
		color: var(--accent);
	}
	.sub {
		display: block;
		font-size: clamp(9px, 3.4cqw, 13px);
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-top: 4px;
	}
	.row {
		display: block;
		font-size: clamp(9px, 3.4cqw, 13px);
		color: var(--text-secondary);
	}
	.row:first-of-type {
		margin-top: 8px;
	}

	.thumb,
	.gone {
		width: 60%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: var(--radius-sm);
		display: block;
		margin: 0 auto 8px;
	}
	.gone {
		background: repeating-linear-gradient(
			45deg,
			var(--state-empty),
			var(--state-empty) 4px,
			transparent 4px,
			transparent 8px
		);
		border: 1px solid var(--grid-line);
	}
	.meta {
		display: block;
		min-height: 1.4em;
		font-size: clamp(8px, 2.9cqw, 11px);
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.gone-val {
		font-size: clamp(11px, 5cqw, 18px) !important;
		color: var(--text-muted);
	}
	.val {
		display: block;
		font-size: clamp(15px, 9cqw, 32px);
		font-variation-settings: 'wght' 860;
		letter-spacing: -0.01em;
		line-height: var(--leading-tight);
		margin-top: 3px;
	}
	.metric {
		display: block;
		font-size: clamp(8px, 3cqw, 11px);
		color: var(--text-muted);
	}
	/* Hauteur réservée : deux lignes de titre, quelle que soit la vidéo, pour que
	   la fiche ne saute pas au centre du cercle. */
	.title {
		min-height: 2.75em;
		margin: 7px 0 0;
		font-size: clamp(9px, 3.3cqw, 13px);
		line-height: var(--leading-snug);
		color: var(--text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.hint {
		display: block;
		margin-top: 6px;
		font-size: clamp(8px, 2.9cqw, 11px);
		font-variation-settings: 'wght' 650;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.controls {
		display: flex;
		gap: 5px;
		opacity: 0.7;
		transition: opacity var(--duration) var(--easing);
	}
	.hub:hover .controls {
		opacity: 1;
	}
	.controls .icon {
		width: clamp(22px, 6.4cqw, 30px);
		height: clamp(22px, 6.4cqw, 30px);
		padding: 0;
		justify-content: center;
		border-radius: 50%;
		border-color: rgba(255, 255, 255, 0.35);
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: var(--text-14);
	}
	.controls .icon:hover {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-contrast);
	}
</style>
