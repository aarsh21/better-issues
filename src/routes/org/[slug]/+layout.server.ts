import type { LayoutServerLoad } from './$types';
import { requireUser } from '$lib/server/auth';

export const load: LayoutServerLoad = async () => {
	const currentUser = await requireUser();

	return { currentUser };
};
