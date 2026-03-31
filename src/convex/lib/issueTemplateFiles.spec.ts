import { describe, expect, it } from "vitest";

import { collectTemplateStorageIds } from "./issueTemplateFiles";

describe("collectTemplateStorageIds", () => {
  const templateSchemaJson = JSON.stringify({
    fields: [
      {
        key: "attachments",
        label: "Attachments",
        type: "file",
        required: false,
        multiple: true,
      },
      {
        key: "recording",
        label: "Recording",
        type: "file",
        required: false,
        multiple: false,
      },
      {
        key: "summary",
        label: "Summary",
        type: "text",
        required: true,
      },
    ],
  });

  it("collects unique storage ids from single and multi-file fields", () => {
    const storageIds = collectTemplateStorageIds(
      templateSchemaJson,
      JSON.stringify({
        attachments: [
          {
            storageId: "storage_a",
            fileName: "a.png",
            fileType: "image/png",
            fileSize: 12,
          },
          {
            storageId: "storage_b",
            fileName: "b.png",
            fileType: "image/png",
            fileSize: 14,
          },
        ],
        recording: {
          storageId: "storage_a",
          fileName: "trace.mp4",
          fileType: "video/mp4",
          fileSize: 120,
        },
      }),
    );

    expect(Array.from(storageIds)).toEqual(["storage_a", "storage_b"]);
  });

  it("ignores non-object template data", () => {
    expect(collectTemplateStorageIds(templateSchemaJson, JSON.stringify(["not", "an", "object"]))).toEqual(
      new Set(),
    );
  });

  it("ignores invalid file values instead of throwing", () => {
    const storageIds = collectTemplateStorageIds(
      templateSchemaJson,
      JSON.stringify({
        attachments: [
          {
            storageId: "storage_a",
            fileName: "a.png",
            fileType: "image/png",
            fileSize: 12,
          },
          {
            storageId: "",
            fileName: "broken.png",
            fileType: "image/png",
            fileSize: 0,
          },
        ],
        recording: ["not-a-file"],
      }),
    );

    expect(Array.from(storageIds)).toEqual(["storage_a"]);
  });

  it("ignores multi-file fields stored as non-arrays", () => {
    expect(
      collectTemplateStorageIds(
        templateSchemaJson,
        JSON.stringify({
          attachments: {
            storageId: "storage_a",
            fileName: "a.png",
            fileType: "image/png",
            fileSize: 12,
          },
        }),
      ),
    ).toEqual(new Set());
  });

  it("returns an empty set when schema or data is invalid", () => {
    expect(collectTemplateStorageIds(undefined, "{}")).toEqual(new Set());
    expect(collectTemplateStorageIds(templateSchemaJson, "not-json")).toEqual(new Set());
    expect(collectTemplateStorageIds("{", "{}")).toEqual(new Set());
  });
});
