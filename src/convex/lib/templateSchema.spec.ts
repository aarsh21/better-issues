import { describe, expect, it } from "vitest";

import { parseTemplateSchema, validateTemplateData } from "./templateSchema";

describe("parseTemplateSchema", () => {
  it("parses a valid template schema", () => {
    const schema = parseTemplateSchema(
      JSON.stringify({
        fields: [
          {
            key: "summary",
            label: "Summary",
            type: "text",
            required: true,
          },
        ],
      }),
    );

    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0]).toMatchObject({
      key: "summary",
      label: "Summary",
      type: "text",
      required: true,
    });
  });

  it("rejects duplicate field keys", () => {
    expect(() =>
      parseTemplateSchema(
        JSON.stringify({
          fields: [
            { key: "summary", label: "Summary", type: "text", required: true },
            { key: "summary", label: "Repeated", type: "text", required: false },
          ],
        }),
      ),
    ).toThrow("Field keys must be unique");
  });

  it("rejects invalid field keys", () => {
    expect(() =>
      parseTemplateSchema(
        JSON.stringify({
          fields: [{ key: "Summary", label: "Summary", type: "text", required: true }],
        }),
      ),
    ).toThrow("Key must be camelCase");
  });

  it("rejects empty field lists", () => {
    expect(() => parseTemplateSchema(JSON.stringify({ fields: [] }))).toThrow(
      "Template must have at least one field",
    );
  });

  it("rejects select fields without options", () => {
    expect(() =>
      parseTemplateSchema(
        JSON.stringify({
          fields: [
            {
              key: "severity",
              label: "Severity",
              type: "select",
              required: true,
            },
          ],
        }),
      ),
    ).toThrow("Select fields must have at least one option");
  });
});

describe("validateTemplateData", () => {
  const schema = parseTemplateSchema(
    JSON.stringify({
      fields: [
        { key: "summary", label: "Summary", type: "text", required: true },
        { key: "estimate", label: "Estimate", type: "number", required: false },
        { key: "verified", label: "Verified", type: "checkbox", required: false },
        {
          key: "severity",
          label: "Severity",
          type: "select",
          required: true,
          options: ["low", "high"],
        },
        { key: "reference", label: "Reference", type: "url", required: false },
        {
          key: "screenshots",
          label: "Screenshots",
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
      ],
    }),
  );

  it("accepts valid data", () => {
    expect(
      validateTemplateData(schema, {
        summary: "Broken sidebar",
        estimate: 3,
        verified: true,
        severity: "high",
        reference: "https://example.com/issue",
        screenshots: [
          {
            storageId: "storage_1",
            fileName: "capture.png",
            fileType: "image/png",
            fileSize: 42,
          },
        ],
        recording: {
          storageId: "storage_2",
          fileName: "trace.mp4",
          fileType: "video/mp4",
          fileSize: 120,
        },
      }).valid,
    ).toBe(true);
  });

  it("accepts optional empty values and numeric strings", () => {
    expect(
      validateTemplateData(schema, {
        summary: "Broken sidebar",
        estimate: "8",
        severity: "low",
        verified: undefined,
        reference: "",
        screenshots: [],
      }),
    ).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("requires arrays for multi-file fields", () => {
    expect(
      validateTemplateData(schema, {
        summary: "Broken sidebar",
        severity: "high",
        screenshots: {
          storageId: "storage_1",
          fileName: "capture.png",
          fileType: "image/png",
          fileSize: 42,
        },
      }),
    ).toEqual({
      valid: false,
      errors: ["Screenshots must include one or more files"],
    });
  });

  it("treats empty arrays as missing for required fields", () => {
    const requiredFileSchema = parseTemplateSchema(
      JSON.stringify({
        fields: [
          {
            key: "attachments",
            label: "Attachments",
            type: "file",
            required: true,
            multiple: true,
          },
        ],
      }),
    );

    expect(validateTemplateData(requiredFileSchema, { attachments: [] })).toEqual({
      valid: false,
      errors: ["Attachments is required"],
    });
  });

  it("reports required, enum, url, boolean, and file validation failures", () => {
    const result = validateTemplateData(schema, {
      estimate: "not-a-number",
      verified: "yes",
      severity: "urgent",
      reference: "notaurl",
      screenshots: [{ storageId: "" }],
      recording: "bad-file",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "Summary is required",
      "Estimate must be a number",
      "Verified must be a boolean",
      "Severity must be one of: low, high",
      "Reference must be a valid URL",
      "Screenshots must include valid file uploads",
      "Recording must include a valid file",
    ]);
  });
});
