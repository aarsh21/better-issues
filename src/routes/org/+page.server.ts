import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	const currentUser = await requireUser();

	return { currentUser };
};
