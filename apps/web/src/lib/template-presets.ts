import type { TemplateSchema } from "@/lib/api-contracts";

export type TemplatePreset = {
  name: string;
  description: string;
  schema: TemplateSchema;
  recommended?: boolean;
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    name: "Bug Report",
    description: "Capture reproduction steps, expected behavior, and severity.",
    recommended: true,
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
    recommended: true,
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
    recommended: true,
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
  {
    name: "UX Bug",
    description: "Visual or interaction issues with clear expected behavior.",
    schema: {
      fields: [
        {
          key: "where",
          label: "Where did it happen?",
          type: "text",
          required: true,
          placeholder: "Page, flow, or component",
        },
        {
          key: "expected",
          label: "Expected Behavior",
          type: "textarea",
          required: true,
        },
        {
          key: "actual",
          label: "Actual Behavior",
          type: "textarea",
          required: true,
        },
        {
          key: "browser",
          label: "Browser",
          type: "text",
          required: false,
        },
        {
          key: "device",
          label: "Device",
          type: "select",
          required: false,
          options: ["desktop", "tablet", "mobile"],
        },
        {
          key: "screens",
          label: "Screenshots or recordings",
          type: "file",
          required: false,
          multiple: true,
          accept: "image/*,video/*",
        },
      ],
    },
  },
  {
    name: "Performance Regression",
    description: "Track slowdowns with metrics and environment details.",
    schema: {
      fields: [
        {
          key: "metric",
          label: "Metric Impacted",
          type: "select",
          required: true,
          options: ["LCP", "INP", "CLS", "TTFB", "Other"],
        },
        {
          key: "baseline",
          label: "Baseline",
          type: "text",
          required: false,
          placeholder: "e.g. 1.2s",
        },
        {
          key: "current",
          label: "Current",
          type: "text",
          required: true,
          placeholder: "e.g. 3.4s",
        },
        {
          key: "scope",
          label: "Affected Scope",
          type: "textarea",
          required: true,
          placeholder: "Pages, routes, or flows",
        },
        {
          key: "evidence",
          label: "Evidence",
          type: "file",
          required: false,
          multiple: true,
          accept: "image/*,application/pdf",
        },
      ],
    },
  },
  {
    name: "Security Issue",
    description: "Document impact, exposure, and mitigation steps.",
    schema: {
      fields: [
        {
          key: "severity",
          label: "Severity",
          type: "select",
          required: true,
          options: ["low", "medium", "high", "critical"],
        },
        {
          key: "impact",
          label: "Impact",
          type: "textarea",
          required: true,
        },
        {
          key: "exposure",
          label: "Exposure",
          type: "textarea",
          required: true,
          placeholder: "Who/what was exposed?",
        },
        {
          key: "mitigation",
          label: "Mitigation",
          type: "textarea",
          required: false,
        },
        {
          key: "evidence",
          label: "Evidence",
          type: "file",
          required: false,
          multiple: true,
          accept: ".log,text/plain,application/pdf",
        },
      ],
    },
  },
  {
    name: "Technical Debt",
    description: "Track architectural debt and the cost of waiting.",
    schema: {
      fields: [
        {
          key: "area",
          label: "Area",
          type: "text",
          required: true,
          placeholder: "Subsystem or module",
        },
        {
          key: "pain",
          label: "Current Pain",
          type: "textarea",
          required: true,
        },
        {
          key: "risk",
          label: "Risk of Waiting",
          type: "textarea",
          required: false,
        },
        {
          key: "effort",
          label: "Estimated Effort",
          type: "select",
          required: false,
          options: ["S", "M", "L", "XL"],
        },
      ],
    },
  },
  {
    name: "Release Checklist",
    description: "Ensure QA and sign-off are captured before shipping.",
    schema: {
      fields: [
        {
          key: "releaseVersion",
          label: "Release Version",
          type: "text",
          required: true,
          placeholder: "v1.2.3",
        },
        {
          key: "qaStatus",
          label: "QA Status",
          type: "select",
          required: true,
          options: ["not_started", "in_progress", "blocked", "passed"],
        },
        {
          key: "riskNotes",
          label: "Risk Notes",
          type: "textarea",
          required: false,
        },
        {
          key: "rolloutPlan",
          label: "Rollout Plan",
          type: "textarea",
          required: false,
        },
      ],
    },
  },
  {
    name: "Customer Bug Report",
    description: "Capture customer context and impact details.",
    schema: {
      fields: [
        {
          key: "customer",
          label: "Customer",
          type: "text",
          required: true,
        },
        {
          key: "plan",
          label: "Plan",
          type: "select",
          required: false,
          options: ["free", "pro", "enterprise"],
        },
        {
          key: "impact",
          label: "Impact",
          type: "textarea",
          required: true,
        },
        {
          key: "workaround",
          label: "Workaround",
          type: "textarea",
          required: false,
        },
        {
          key: "attachments",
          label: "Attachments",
          type: "file",
          required: false,
          multiple: true,
          accept: "image/*,application/pdf",
        },
      ],
    },
  },
  {
    name: "On-Call Incident",
    description: "Ops-ready template for escalations and handoffs.",
    schema: {
      fields: [
        {
          key: "severity",
          label: "Severity",
          type: "select",
          required: true,
          options: ["sev1", "sev2", "sev3"],
        },
        {
          key: "systems",
          label: "Systems Affected",
          type: "textarea",
          required: true,
        },
        {
          key: "status",
          label: "Current Status",
          type: "textarea",
          required: true,
        },
        {
          key: "nextSteps",
          label: "Next Steps",
          type: "textarea",
          required: false,
        },
      ],
    },
  },
  {
    name: "SLA Breach",
    description: "Track SLA breaches with evidence and follow-ups.",
    schema: {
      fields: [
        {
          key: "service",
          label: "Service",
          type: "text",
          required: true,
        },
        {
          key: "breachWindow",
          label: "Breach Window",
          type: "text",
          required: true,
          placeholder: "Start - End",
        },
        {
          key: "customerImpact",
          label: "Customer Impact",
          type: "textarea",
          required: true,
        },
        {
          key: "evidence",
          label: "Evidence",
          type: "file",
          required: false,
          multiple: true,
          accept: "application/pdf,image/*",
        },
      ],
    },
  },
  {
    name: "Root Cause Analysis",
    description: "Structured RCA with contributing factors and actions.",
    schema: {
      fields: [
        {
          key: "summary",
          label: "Summary",
          type: "textarea",
          required: true,
        },
        {
          key: "contributingFactors",
          label: "Contributing Factors",
          type: "textarea",
          required: true,
        },
        {
          key: "correctiveActions",
          label: "Corrective Actions",
          type: "textarea",
          required: true,
        },
        {
          key: "preventiveActions",
          label: "Preventive Actions",
          type: "textarea",
          required: false,
        },
        {
          key: "evidence",
          label: "Evidence",
          type: "file",
          required: false,
          multiple: true,
          accept: "application/pdf",
        },
      ],
    },
  },
];
