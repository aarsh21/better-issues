"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/lib/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { clearIssueSnapshots } from "@/lib/issue-snapshot-cache";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type SignInFormProps = {
  readonly redirectTo?: string;
};

export default function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const identifier = value.identifier.trim();
      const callbacks = {
        onSuccess: () => {
          queryClient.clear();
          clearIssueSnapshots();
          router.replace(redirectTo ?? "/org");
          toast.success("Signed in");
        },
        onError: (error: { error: { message?: string; statusText?: string } }) => {
          toast.error(error.error.message || error.error.statusText);
        },
      };

      if (identifier.includes("@")) {
        await authClient.signIn.email(
          {
            email: identifier,
            password: value.password,
          },
          callbacks,
        );
        return;
      }

      await authClient.signIn.username(
        {
          username: identifier,
          password: value.password,
        },
        callbacks,
      );
    },
    validators: {
      onSubmit: z.object({
        identifier: z
          .string()
          .trim()
          .min(1, "Email or username is required")
          .refine((value) => {
            if (value.includes("@")) {
              return z.email().safeParse(value).success;
            }

            return value.length >= 3;
          }, "Enter a valid email or username"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <form
      action={async () => {
        await form.handleSubmit();
      }}
      className="space-y-3"
    >
      <form.Field name="identifier">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs">
              Email or Username
            </Label>
            <Input
              id={field.name}
              name={field.name}
              placeholder="you@example.com or jane_doe"
              autoComplete="username"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-xs text-destructive">
                {error?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs">
              Password
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-xs text-destructive">
                {error?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>

      <form.Subscribe>
        {(state) => (
          <Button
            type="submit"
            className="w-full"
            size="sm"
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
