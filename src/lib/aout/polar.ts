export const S = 660;
export const C = S / 2;
export const R_HUB = 116;
export const R_MIN = R_HUB + 16;
export const R_MAX = 306;
export const EPISODES = 31;
export const SEAM = 21;
export const A0 = -90 + SEAM / 2;
export const SPAN = 360 - SEAM;
export const STEP = SPAN / EPISODES;

export const rad = (deg: number) => (deg * Math.PI) / 180;

export const angleOf = (episode: number) => A0 + (episode - 1) * STEP;

export const xy = (deg: number, r: number) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))] as const;

/** Annulus sector path. Angles in degrees, clockwise from A0. */
export function arcPath(r0: number, r1: number, a0: number, a1: number, pad = 0.55) {
	const b0 = a0 + pad;
	const b1 = a1 - pad;
	const large = b1 - b0 > 180 ? 1 : 0;
	const [x00, y00] = xy(b0, r0);
	const [x01, y01] = xy(b1, r0);
	const [x10, y10] = xy(b1, r1);
	const [x11, y11] = xy(b0, r1);
	return [
		`M ${x00.toFixed(2)} ${y00.toFixed(2)}`,
		`A ${r0} ${r0} 0 ${large} 1 ${x01.toFixed(2)} ${y01.toFixed(2)}`,
		`L ${x10.toFixed(2)} ${y10.toFixed(2)}`,
		`A ${r1} ${r1} 0 ${large} 0 ${x11.toFixed(2)} ${y11.toFixed(2)}`,
		'Z'
	].join(' ');
}

export type Ring = { season: number; r0: number; r1: number; rMid: number };

/**
 * Ten concentric rings between R_MIN and R_MAX. In `proportional` mode the
 * thickness of each ring encodes the season's mean video duration, so the
 * format's growth is baked into the geometry.
 */
export function rings(weights: number[], proportional: boolean, gap = 3): Ring[] {
	const n = weights.length;
	const usable = R_MAX - R_MIN - gap * (n - 1);
	const w = proportional ? weights : weights.map(() => 1);
	const total = w.reduce((a, b) => a + b, 0);
	const out: Ring[] = [];
	let r = R_MIN;
	for (let i = 0; i < n; i++) {
		const h = (w[i] / total) * usable;
		out.push({ season: i + 1, r0: r, r1: r + h, rMid: r + h / 2 });
		r += h + gap;
	}
	return out;
}

/** Nearest episode index for a pointer angle, or null outside the seam-free span. */
export function episodeAt(deg: number): number | null {
	let d = ((deg - A0) % 360 + 360) % 360;
	if (d > SPAN) return null;
	const i = Math.floor(d / STEP) + 1;
	return i >= 1 && i <= EPISODES ? i : null;
}
