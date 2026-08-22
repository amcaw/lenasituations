import { base } from '$app/paths';
import type { Video, Season, Marker, SubPoint } from '$lib/aout/types';

export const prerender = true;

export async function load({ fetch }) {
	const [videos, seasons, markers, subs] = await Promise.all([
		fetch(`${base}/data/videos.json`).then((r) => r.json() as Promise<Video[]>),
		fetch(`${base}/data/seasons.json`).then((r) => r.json() as Promise<Season[]>),
		fetch(`${base}/data/markers.json`).then((r) => r.json() as Promise<Marker[]>),
		fetch(`${base}/data/subs.json`).then((r) => r.json() as Promise<SubPoint[]>)
	]);
	return { videos, seasons, markers, subs };
}
