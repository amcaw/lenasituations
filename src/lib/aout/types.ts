export type Video = {
	id: string;
	season: number;
	episode: number;
	publishedAt: string | null;
	publishedHour: number | null;
	day: number | null;
	overflow: boolean;
	ageDays: number | null;
	title: string;
	duration: number | null;
	views: number | null;
	likes: number | null;
	comments: number | null;
	capsRatio: number | null;
	sponsored: boolean;
	heat: number[] | null;
	available: boolean;
	measured: boolean;
	approx: boolean;
	status: 'ok' | 'restricted' | 'private' | 'removed' | 'unavailable';
	estimatedDate: boolean;
};

export type Season = {
	season: number;
	year: number;
	n: number;
	nMeasured: number;
	nUnavailable: number;
	nRestricted: number;
	nApprox: number;
	viewsTotal: number;
	viewsMean: number;
	viewsMedian: number;
	viewsMax: number;
	durationTotal: number;
	durationMean: number;
	likeRate: number | null;
	commentRate: number | null;
	commentsMean: number | null;
	publishHourMedian: number;
	capsRatioMean: number;
	sponsored: number;
	overflow: number;
	firstAt: string | null;
	lastAt: string | null;
	partial: boolean;
	curve: number[] | null;
	label: string;
	note: string;
};

export type Marker = {
	season: number;
	episode: number | null;
	icon: string;
	label: string;
};

export type SubPoint = {
	date: string;
	subs: number;
};
