"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Could not sign in.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      description="Use the seeded admin or owner account, or sign up a fresh restaurant owner."
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
        <Field label="Email">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#374151]">{label}</span>
      {children}
    </label>
  );
}
