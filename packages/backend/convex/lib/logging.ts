/**
 * Logged Convex function builders.
 *
 * Drop-in replacements for `query`, `mutation`, and `action` that emit a
 * single structured wide event per invocation. Each event includes the
 * function name, type, sanitized args, timing, outcome, error details,
 * and identity context (`user_id`, `user_email`, `organization_id`).
 *
 * Identity is extracted best-effort from `ctx.auth.getUserIdentity()` and
 * will never cause the underlying handler to fail. Unauthenticated calls
 * are logged with `user_id: "anonymous"`.
 *
 * Usage:
 *   import { loggedQuery, loggedMutation } from "./lib/logging";
 *
 *   export const list = loggedQuery("issues.list")({
 *     args: { organizationId: v.string() },
 *     handler: async (ctx, args) => { ... },
 *   });
 */

import {
  query as baseQuery,
  mutation as baseMutation,
  action as baseAction,
} from "../_generated/server";

import { logger, sanitizeArgs } from "./logger";

type FunctionType = "query" | "mutation" | "action";

/* eslint-disable @typescript-eslint/no-explicit-any */
function createLoggedBuilder<T extends (...args: any[]) => any>(
  base: T,
  functionType: FunctionType,
  functionName: string,
): T {
  return ((options: any) => {
    const originalHandler = options.handler;
    return (base as any)({
      ...options,
      handler: async (ctx: any, args: any) => {
        const startTime = Date.now();
        const event: Record<string, unknown> = {
          function: functionName,
          type: functionType,
          args:
            args !== null && typeof args === "object"
              ? sanitizeArgs(args as Record<string, unknown>)
              : {},
        };

        // Best-effort identity extraction — never breaks the handler
        try {
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            event.user_id = identity.subject;
            event.user_email = identity.email;
          } else {
            event.user_id = "anonymous";
          }
        } catch {
          // Silently ignore — logging is best-effort
        }

        if (args !== null && typeof args === "object" && "organizationId" in args) {
          event.organization_id = args.organizationId;
        }

        try {
          const result = await originalHandler(ctx, args);
          event.outcome = "success";
          return result;
        } catch (error: unknown) {
          event.outcome = "error";
          if (error instanceof Error) {
            event.error = { type: error.constructor.name, message: error.message };
          } else {
            event.error = { type: "Unknown", message: String(error) };
          }
          throw error;
        } finally {
          event.duration_ms = Date.now() - startTime;
          event.timestamp = new Date().toISOString();
          if (event.outcome === "error") {
            logger.error(event);
          } else {
            logger.info(event);
          }
        }
      },
    });
  }) as T;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function loggedQuery(name: string): typeof baseQuery {
  return createLoggedBuilder(baseQuery, "query", name);
}

export function loggedMutation(name: string): typeof baseMutation {
  return createLoggedBuilder(baseMutation, "mutation", name);
}

export function loggedAction(name: string): typeof baseAction {
  return createLoggedBuilder(baseAction, "action", name);
}
