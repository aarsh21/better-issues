/// <reference types="vite/client" />

import { convexTest } from 'convex-test';

import betterAuthSchema from '../convex/betterAuth/schema';
import schema from '../convex/schema';

const rootModules = import.meta.glob([
	'../convex/**/*.{ts,js}',
	'!../convex/**/*.spec.ts',
	'!../convex/**/*.test.ts'
]);

const betterAuthModules = import.meta.glob(['../convex/betterAuth/**/*.{ts,js}']);

export const createConvexTest = () => {
	const t = convexTest({
		schema,
		modules: rootModules
	});

	t.registerComponent('betterAuth', betterAuthSchema, betterAuthModules);

	return t;
};
