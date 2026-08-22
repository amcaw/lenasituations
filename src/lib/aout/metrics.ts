import { scaleQuantile } from 'd3-scale';
import type { Video } from './types';
import { fmtViews, fmtDur, fmtPct, fmtHour, fmtInt } from './format';

export type MetricKey =
	| 'views'
	| 'duration'
	| 'likeRate'
	| 'commentRate'
	| 'hour'
	| 'caps'
	| 'retention';

export type Metric = {
	key: MetricKey;
	label: string;
	short: string;
	blurb: string;
	get: (v: Video) => number | null;
	fmt: (x: number) => string;
	buckets: number;
};

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

export const METRICS: Metric[] = [
	{
		key: 'views',
		label: 'Vues',
		short: 'Vues',
		blurb: 'Vues cumulées depuis la publication.',
		get: (v) => v.views,
		fmt: fmtViews,
		buckets: 6
	},
	{
		key: 'duration',
		label: 'Durée',
		short: 'Durée',
		blurb: "La métrique la plus honnête : elle ne dépend pas de l'âge de la vidéo.",
		get: (v) => v.duration,
		fmt: (x) => fmtDur(x),
		buckets: 6
	},
	{
		key: 'likeRate',
		label: 'Likes / vues',
		short: 'Likes',
		blurb: "Le taux d'engagement, qui culmine en 2021, un an après le pic d'audience.",
		get: (v) => (v.likes && v.views ? v.likes / v.views : null),
		fmt: (x) => fmtPct(x, 1),
		buckets: 6
	},
	{
		key: 'commentRate',
		label: 'Commentaires / 1k vues',
		short: 'Comm.',
		blurb: "L'intensité de la communauté, indépendamment de sa taille.",
		get: (v) => (v.comments && v.views ? (v.comments / v.views) * 1000 : null),
		fmt: (x) => `${x.toFixed(1).replace('.', ',')} / 1k`,
		buckets: 6
	},
	{
		key: 'hour',
		label: 'Heure de publication',
		short: 'Heure',
		blurb: "Le rituel se verrouille à 20h50 à partir de 2021 ; avant, l'heure est erratique.",
		get: (v) => v.publishedHour,
		fmt: fmtHour,
		buckets: 6
	},
	{
		key: 'caps',
		label: 'MAJUSCULES',
		short: 'Ton',
		blurb:
			'Part de capitales dans le titre. Le ton bascule en 2022, puis revient en force pour la dernière saison.',
		get: (v) => v.capsRatio,
		fmt: (x) => fmtPct(x, 0),
		buckets: 6
	},
	{
		key: 'retention',
		label: 'Rétention moyenne',
		short: 'Rétention',
		blurb: "Moyenne de la courbe « passages les plus regardés » de YouTube.",
		get: (v) => (v.heat ? mean(v.heat) : null),
		fmt: (x) => fmtPct(x, 0),
		buckets: 6
	}
];

export const metricBy = (key: MetricKey) => METRICS.find((m) => m.key === key)!;

export type Buckets = {
	index: (v: Video) => number | null;
	edges: number[];
	fmt: (x: number) => string;
	n: number;
};

export function makeBuckets(metric: Metric, videos: Video[]): Buckets {
	const usable = videos.filter((v) => v.measured);
	const vals = usable.map(metric.get).filter((x): x is number => x != null);
	if (metric.buckets === 2) {
		return {
			index: (v) => {
				const x = metric.get(v);
				return x == null ? null : x > 0 ? 1 : 0;
			},
			edges: [],
			fmt: metric.fmt,
			n: 2
		};
	}
	const range = Array.from({ length: metric.buckets }, (_, i) => i);
	const scale = scaleQuantile<number>().domain(vals).range(range);
	return {
		index: (v) => {
			const x = metric.get(v);
			return x == null ? null : scale(x);
		},
		edges: scale.quantiles(),
		fmt: metric.fmt,
		n: metric.buckets
	};
}

export const bucketVar = (i: number, n: number) =>
	n === 2 ? (i ? 'var(--accent)' : 'var(--state-empty)') : `var(--sun-${i})`;
