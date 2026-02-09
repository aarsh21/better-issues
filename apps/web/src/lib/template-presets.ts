import type { TemplateSchema } from "@/convex";

export type TemplatePreset = {
  name: string;
  description: string;
  schema: TemplateSchema;
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    name: "Bug Report",
    description: "Capture reproduction steps, expected behavior, and severity.",
    schema: {
      fields: [
        {
          key: "stepsToReproduce",
          label: "Steps to Reproduce",
          type: "textarea",
          required: true,
          placeholder: "1. Go to...",
        },
        {
          key: "expectedBehavior",
          label: "Expected Behavior",
          type: "textarea",
          required: true,
          placeholder: "What should happen instead?",
        },
        {
          key: "actualBehavior",
          label: "Actual Behavior",
          type: "textarea",
          required: true,
          placeholder: "What happened?",
        },
        {
          key: "environment",
          label: "Environment",
          type: "text",
          required: false,
          placeholder: "Browser, OS, build, etc.",
        },
        {
          key: "severity",
          label: "Severity",
          type: "select",
          required: true,
          options: ["critical", "major", "minor", "cosmetic"],
          placeholder: "Select severity",
        },
        {
          key: "screenshots",
          label: "Screenshots",
          type: "file",
          required: false,
          multiple: true,
          accept: "image/*",
        },
      ],
    },
  },
  {
    name: "Feature Request",
    description: "Describe the problem, solution, and expected impact.",
    schema: {
      fields: [
        {
          key: "problem",
          label: "Problem",
          type: "textarea",
          required: true,
          placeholder: "What problem are we solving?",
        },
        {
          key: "proposedSolution",
          label: "Proposed Solution",
          type: "textarea",
          required: false,
          placeholder: "Describe the ideal solution.",
        },
        {
          key: "impact",
          label: "Impact",
          type: "select",
          required: true,
          options: ["low", "medium", "high"],
          placeholder: "Select impact",
        },
        {
          key: "referenceLinks",
          label: "Reference Links",
          type: "url",
          required: false,
          placeholder: "https://",
        },
        {
          key: "mockups",
          label: "Mockups",
          type: "file",
          required: false,
          multiple: true,
          accept: "image/*",
        },
      ],
    },
  },
  {
    name: "Incident Report",
    description: "Track impact, timeline, and follow-up actions.",
    schema: {
      fields: [
        {
          key: "summary",
          label: "Summary",
          type: "textarea",
          required: true,
          placeholder: "What happened?",
        },
        {
          key: "impact",
          label: "Impact",
          type: "select",
          required: true,
          options: ["low", "medium", "high", "critical"],
          placeholder: "Select impact",
        },
        {
          key: "timeline",
          label: "Timeline",
          type: "textarea",
          required: false,
          placeholder: "Key events and timestamps.",
        },
        {
          key: "rootCause",
          label: "Root Cause",
          type: "textarea",
          required: false,
          placeholder: "What caused the incident?",
        },
        {
          key: "followUps",
          label: "Follow-ups",
          type: "textarea",
          required: false,
          placeholder: "Tasks to prevent recurrence.",
        },
        {
          key: "attachments",
          label: "Attachments",
          type: "file",
          required: false,
          multiple: true,
          accept: ".log,text/plain,application/pdf",
        },
      ],
    },
  },
];
