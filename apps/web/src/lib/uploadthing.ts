"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { FileRoute } from "uploadthing/types";

type UploadRouter = {
  avatar: FileRoute<{
    errorShape: {
      message?: string;
    };
    input: undefined;
    output: {
      imageUrl: string;
    };
  }>;
  issueAttachment: FileRoute<{
    errorShape: {
      message?: string;
    };
    input: {
      issueId?: string;
      organizationId: string;
    };
    output: {
      attachmentId: string;
    };
  }>;
};

export const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: "/api/uploadthing",
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});
