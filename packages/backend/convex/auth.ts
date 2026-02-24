import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { authComponent, createAuth } from "./betterAuth/auth";
import { requireOrgMembership } from "./lib/permissions";

export { authComponent, createAuth };

const PROFILE_IMAGE_REFERENCE_PREFIX = "storage:";
const PROFILE_IMAGE_REFERENCE_VERSION = "v1";
const AVATAR_UPLOAD_TOKEN_VERSION = "v1";

const textEncoder = new TextEncoder();

const getSigningSecret = (): string | null => {
  const secret = process.env.PROFILE_IMAGE_SIGNING_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (typeof secret !== "string") {
    return null;
  }

  const normalized = secret.trim();
  if (normalized.length === 0) {
    return null;
  }

  return normalized;
};

const signatureBytesToHex = (signature: ArrayBuffer): string => {
  return Array.from(new Uint8Array(signature))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const constantTimeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
};

const signPayload = async (signingSecret: string, payload: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(signingSecret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return signatureBytesToHex(signature);
};

const createStorageSignature = async (
  signingSecret: string,
  userId: string,
  organizationId: string,
  storageId: Id<"_storage">,
): Promise<string> => {
  return await signPayload(signingSecret, `${userId}:${organizationId}:${storageId}`);
};

const createAvatarUploadSignature = async (
  signingSecret: string,
  userId: string,
  organizationId: string,
  issuedAt: number,
): Promise<string> => {
  return await signPayload(signingSecret, `avatar-upload:${userId}:${organizationId}:${issuedAt}`);
};

const parseStorageReference = (
  image: string,
): {
  storageId: Id<"_storage">;
  organizationId: string;
  signature: string;
} | null => {
  if (!image.startsWith(PROFILE_IMAGE_REFERENCE_PREFIX)) {
    return null;
  }

  const value = image.slice(PROFILE_IMAGE_REFERENCE_PREFIX.length);
  const [version, storageId, organizationId, signature, ...rest] = value.split(":");
  if (
    version !== PROFILE_IMAGE_REFERENCE_VERSION ||
    typeof storageId !== "string" ||
    storageId.length === 0 ||
    typeof organizationId !== "string" ||
    organizationId.length === 0 ||
    typeof signature !== "string" ||
    signature.length === 0 ||
    rest.length > 0
  ) {
    return null;
  }

  return {
    storageId: storageId as Id<"_storage">,
    organizationId,
    signature,
  };
};

export const isStorageImageReference = (image: unknown): image is string => {
  return typeof image === "string" && image.startsWith(PROFILE_IMAGE_REFERENCE_PREFIX);
};

export const createProfileImageReference = async ({
  userId,
  organizationId,
  storageId,
}: {
  userId: string;
  organizationId: string;
  storageId: Id<"_storage">;
}): Promise<string> => {
  const signingSecret = getSigningSecret();
  if (!signingSecret) {
    throw new Error("Profile image signing secret is not configured");
  }

  const signature = await createStorageSignature(signingSecret, userId, organizationId, storageId);
  return `${PROFILE_IMAGE_REFERENCE_PREFIX}${PROFILE_IMAGE_REFERENCE_VERSION}:${storageId}:${organizationId}:${signature}`;
};

export const createAvatarUploadToken = async ({
  userId,
  organizationId,
  issuedAt,
}: {
  userId: string;
  organizationId: string;
  issuedAt: number;
}): Promise<string> => {
  const signingSecret = getSigningSecret();
  if (!signingSecret) {
    throw new Error("Profile image signing secret is not configured");
  }

  const signature = await createAvatarUploadSignature(
    signingSecret,
    userId,
    organizationId,
    issuedAt,
  );
  return `${AVATAR_UPLOAD_TOKEN_VERSION}:${issuedAt}:${signature}`;
};

export const resolveAvatarUploadToken = async ({
  token,
  userId,
  organizationId,
  maxAgeMs,
}: {
  token: string;
  userId: string;
  organizationId: string;
  maxAgeMs: number;
}): Promise<{ issuedAt: number } | null> => {
  const [version, issuedAtRaw, signature, ...rest] = token.split(":");
  if (
    version !== AVATAR_UPLOAD_TOKEN_VERSION ||
    typeof issuedAtRaw !== "string" ||
    issuedAtRaw.length === 0 ||
    typeof signature !== "string" ||
    signature.length === 0 ||
    rest.length > 0
  ) {
    return null;
  }

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || !Number.isInteger(issuedAt) || issuedAt < 0) {
    return null;
  }

  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > maxAgeMs) {
    return null;
  }

  const signingSecret = getSigningSecret();
  if (!signingSecret) {
    return null;
  }

  const expectedSignature = await createAvatarUploadSignature(
    signingSecret,
    userId,
    organizationId,
    issuedAt,
  );
  if (!constantTimeEqual(expectedSignature, signature)) {
    return null;
  }

  return {
    issuedAt,
  };
};

const resolveAuthorizedProfileImageReference = async ({
  image,
  userId,
}: {
  image: string;
  userId: string;
}): Promise<{
  storageId: Id<"_storage">;
  organizationId: string;
} | null> => {
  const parsed = parseStorageReference(image);
  if (!parsed) {
    return null;
  }

  const signingSecret = getSigningSecret();
  if (!signingSecret) {
    return null;
  }

  const expectedSignature = await createStorageSignature(
    signingSecret,
    userId,
    parsed.organizationId,
    parsed.storageId,
  );
  if (!constantTimeEqual(expectedSignature, parsed.signature)) {
    return null;
  }

  return {
    organizationId: parsed.organizationId,
    storageId: parsed.storageId,
  };
};

const authUserValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  image: v.optional(v.union(v.null(), v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
  username: v.optional(v.union(v.null(), v.string())),
  displayUsername: v.optional(v.union(v.null(), v.string())),
  userId: v.optional(v.union(v.null(), v.string())),
});

export const getCurrentUser = query({
  args: {},
  returns: v.union(authUserValidator, v.null()),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const image = user.image;
    if (!isStorageImageReference(image)) {
      return user;
    }

    const resolvedImage = await resolveAuthorizedProfileImageReference({
      image,
      userId: user._id,
    });
    if (!resolvedImage) {
      return {
        ...user,
        image: null,
      };
    }

    try {
      await requireOrgMembership(ctx, user._id, resolvedImage.organizationId);
      const imageUrl = await ctx.storage.getUrl(resolvedImage.storageId);
      return {
        ...user,
        image: imageUrl,
      };
    } catch {
      return {
        ...user,
        image: null,
      };
    }
  },
});
