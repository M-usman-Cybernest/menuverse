"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type FieldErrors = {
  identifier?: string;
  password?: string;
};

export function LoginForm() {
  const router = useRouter();
  const { success: toastSuccess } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!identifier.trim()) {
      errors.identifier = "Email or phone is required.";
    } else if (identifier.length < 3) {
      errors.identifier = "Please enter a valid identifier.";
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Could not sign in.");
      setSubmitting(false);
      return;
    }

    toastSuccess("Signed in successfully!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      description="Access your business dashboard. You will stay logged in for 30 days."
      footer={
        <span>
          No account yet?{" "}
          <Link className="font-medium text-[#0f766e]" href="/signup">
            Create one
          </Link>
        </span>
      }
      title="Sign in"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Email or Phone" error={fieldErrors.identifier}>
          <Input
            placeholder="Enter your email or phone number"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
            }}
            className={fieldErrors.identifier ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}
          />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <Input
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            className={fieldErrors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}
          />
        </Field>
        {error ? (
          <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
            {error}
          </Badge>
        ) : null}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

function Field({
  children,
  label,
  error,
}: {
  children: React.ReactNode;
  label: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#374151]">{label}</span>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </label>
  );
}
