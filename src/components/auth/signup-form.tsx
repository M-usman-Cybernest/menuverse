"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    restaurantName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Could not create account.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      description="Create a restaurant owner account and start with a seeded starter menu you can edit."
      footer={
        <span>
          Already have an account?{" "}
          <Link className="font-medium text-[#0f766e]" href="/login">
            Sign in
          </Link>
        </span>
      }
      title="Create account"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Full Name">
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </Field>
        <Field label="Email">
          <Input
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
          />
        </Field>
        <Field label="Restaurant Name">
          <Input
            value={form.restaurantName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                restaurantName: event.target.value,
              }))
            }
          />
        </Field>
        {error ? (
          <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
            {error}
          </Badge>
        ) : null}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Creating..." : "Create account"}
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
