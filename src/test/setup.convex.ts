import './setup.shared';

process.env.BETTER_AUTH_SECRET ??= 'test-secret';
process.env.PROFILE_IMAGE_SIGNING_SECRET ??= process.env.BETTER_AUTH_SECRET;
