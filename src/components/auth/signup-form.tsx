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
  name?: string;
  identifier?: string;
  password?: string;
  restaurantName?: string;
};

export function SignupForm() {
  const router = useRouter();
  const { success: toastSuccess } = useToast();
  const [form, setForm] = useState({
    name: "",
    identifier: "",
    password: "",
    restaurantName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!form.name.trim()) {
      errors.name = "Full name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!form.identifier.trim()) {
      errors.identifier = "Email or phone is required.";
    } else if (form.identifier.length < 3) {
      errors.identifier = "Please enter a valid identifier.";
    }

    if (!form.password.trim()) {
      errors.password = "Password is required.";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!form.restaurantName.trim()) {
      errors.restaurantName = "Business Name is required.";
    } else if (form.restaurantName.trim().length < 2) {
      errors.restaurantName = "Business Name must be at least 2 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function clearFieldError(key: keyof FieldErrors) {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function submit() {
    if (!validate()) return;

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

    toastSuccess("Account created successfully!");
    router.push("/dashboard");
    router.refresh();
  }

  const errorClass = "border-red-400 focus:border-red-500 focus:ring-red-500/15";

  return (
    <AuthShell
      description="Start your business journey today. You will stay logged in for 30 days."
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
        <Field label="Full Name" error={fieldErrors.name}>
          <Input
            placeholder="Enter your full name"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              clearFieldError("name");
            }}
            className={fieldErrors.name ? errorClass : ""}
          />
        </Field>
        <Field label="Email or Phone" error={fieldErrors.identifier}>
          <Input
            placeholder="Enter your email or phone number"
            value={form.identifier}
            onChange={(event) => {
              setForm((current) => ({ ...current, identifier: event.target.value }));
              clearFieldError("identifier");
            }}
            className={fieldErrors.identifier ? errorClass : ""}
          />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <Input
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => {
              setForm((current) => ({ ...current, password: event.target.value }));
              clearFieldError("password");
            }}
            className={fieldErrors.password ? errorClass : ""}
          />
        </Field>
        <Field label="Business Name" error={fieldErrors.restaurantName}>
          <Input
            placeholder="Enter your business name"
            value={form.restaurantName}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                restaurantName: event.target.value,
              }));
              clearFieldError("restaurantName");
            }}
            className={fieldErrors.restaurantName ? errorClass : ""}
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
