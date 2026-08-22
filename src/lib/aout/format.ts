const NB = ' ';

export const fmtInt = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/ /g, NB);

export const fmtViews = (n: number | null | undefined) => {
	if (n == null) return 'n. c.';
	if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace('.', ',')}${NB}M`;
	if (n >= 1e3) return `${Math.round(n / 1e3)}${NB}k`;
	return fmtInt(n);
};

export const fmtDur = (s: number | null | undefined) => {
	if (s == null) return 'n. c.';
	const m = Math.floor(s / 60);
	return `${m}${NB}min${s % 60 ? ` ${String(s % 60).padStart(2, '0')}` : ''}`;
};

export const fmtHours = (s: number) => `${Math.round(s / 3600)}${NB}h`;

export const fmtPct = (x: number | null | undefined, d = 1) =>
	x == null ? 'n. c.' : `${(x * 100).toFixed(d).replace('.', ',')}${NB}%`;

export const fmtHour = (h: number) =>
	`${String(Math.floor(h)).padStart(2, '0')}h${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const fmtDate = (iso: string | null) => {
	if (!iso) return 'date inconnue';
	const d = new Date(iso);
	return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDayMonth = (iso: string | null) => {
	if (!iso) return 'date inconnue';
	const d = new Date(iso);
	return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fmtYear = (iso: string | null) => (iso ? String(new Date(iso).getFullYear()) : '');

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
