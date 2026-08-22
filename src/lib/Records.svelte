<script lang="ts">
	import type { Video } from './aout/types';
	import { fmtViews, fmtDur, fmtDate, thumb } from './aout/format';

	let {
		videos,
		onpick,
		limit = 10
	}: { videos: Video[]; onpick?: (v: Video) => void; limit?: number } = $props();

	const top = $derived(
		[...videos].filter((v) => v.views).sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, limit)
	);
</script>

<ol class="records">
	{#each top as v, i (v.id)}
		<li>
			<button onclick={() => onpick?.(v)}>
				<span class="rank tnum">{i + 1}</span>
				<img src={thumb(v.id)} alt="" loading="lazy" />
				<span class="txt">
					<strong>{v.title}</strong>
					<span class="meta tnum"
						>{fmtViews(v.views)} vues · {fmtDur(v.duration)} · {fmtDate(v.publishedAt)}</span
					>
				</span>
			</button>
		</li>
	{/each}
</ol>

<style>
	.records {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}
	/* Sans ces min-width, le titre en nowrap impose sa largeur à toute la
	   colonne et la page déborde horizontalement sous 720 px. */
	li {
		min-width: 0;
	}
	button {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-width: 0;
		text-align: left;
		border: 0;
		background: var(--surface-sunken);
		border-radius: var(--radius-sm);
		padding: 8px 12px 8px 8px;
		cursor: pointer;
		color: inherit;
		transition: background var(--duration) var(--easing), transform var(--duration) var(--easing);
	}
	button:hover {
		background: var(--accent-soft);
	}
	button:active {
		transform: translateY(2px);
	}
	.rank {
		font-size: var(--text-16);
		font-variation-settings: 'wght' 750;
		color: var(--text-muted);
		width: 16px;
		flex: none;
	}
	img {
		width: 68px;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: var(--radius-sm);
		flex: none;
	}
	.txt {
		min-width: 0;
	}
	strong {
		display: block;
		font-size: var(--text-14);
		font-variation-settings: 'wght' 650;
		line-height: var(--leading-snug);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		font-size: var(--text-12);
		color: var(--text-muted);
	}
	@media (max-width: 720px) {
		.records {
			grid-template-columns: 1fr;
		}
	}
</style>
