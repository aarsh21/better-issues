import type { PageServerLoad } from './$types';
import { getOptionalUser } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	const currentUser = await getOptionalUser();

	return { currentUser };
};
