export const DEFAULT_AUTHENTICATED_PATH = '/org';
export const SIGN_IN_PATH = '/sign-in';

export const getSafeReturnTo = (value: string | null | undefined) => {
	if (!value) {
		return undefined;
	}

	if (!value.startsWith('/') || value.startsWith('//')) {
		return undefined;
	}

	return value;
};
