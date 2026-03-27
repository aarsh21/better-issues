import { requireUser } from '$lib/server/auth';

export const load = async () => {
	const currentUser = await requireUser();

	return { currentUser };
};
