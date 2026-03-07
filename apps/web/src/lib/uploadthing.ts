"use client";

import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing } = generateReactHelpers<any>({
  url: "/api/uploadthing",
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});
