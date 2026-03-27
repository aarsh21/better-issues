import { getOptionalUser } from '$lib/server/auth';

export const load = async () => {
	const currentUser = await getOptionalUser();

	return { currentUser };
};
