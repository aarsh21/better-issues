import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

/** Client navigation to an app path, applying `resolve()` to the pathname only (preserves `?query`). */
export async function gotoResolvedPath(path: string) {
	const q = path.indexOf('?');
	const pathname = q === -1 ? path : path.slice(0, q);
	const search = q === -1 ? '' : path.slice(q);
	// `returnTo` is server-validated; route id is wider than the static `resolve` overloads.
	const href = `${resolve(pathname as '/')}${search}`;
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- `href` is built from `resolve(pathname)` plus optional search
	await goto(href);
}
