"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const pakistanPhoneRegex = /^(\+92|92|0)?3\d{9}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateField = (name: string, value: string) => {
    if (name === "name") {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
    }
    if (name === "identifier") {
      if (!value.trim()) return "Email or phone is required.";
      if (value.includes("@") || !/^\+?\d+$/.test(value)) {
        if (!emailRegex.test(value)) return "Please enter a valid email address.";
      } else {
        if (!pakistanPhoneRegex.test(value)) return "Please enter a valid Pakistan phone number.";
      }
    }
    if (name === "password") {
      if (!value.trim()) return "Password is required.";
      if (value.length < 6) return "Password must be at least 6 characters.";
    }
    if (name === "restaurantName") {
      if (!value.trim()) return "Business Name is required.";
      if (value.trim().length < 2) return "Business Name must be at least 2 characters.";
    }
    return undefined;
  };

  useEffect(() => {
    const newErrors: FieldErrors = {};
    Object.keys(form).forEach((key) => {
      const fieldName = key as keyof typeof form;
      if (touched[fieldName]) {
        const error = validateField(fieldName, form[fieldName]);
        if (error) newErrors[fieldName] = error;
      }
    });
    setFieldErrors(newErrors);
  }, [form, touched]);

  function validate(): boolean {
    const newErrors: FieldErrors = {};
    let isValid = true;

    Object.keys(form).forEach((key) => {
      const fieldName = key as keyof typeof form;
      const error = validateField(fieldName, form[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setFieldErrors(newErrors);
    setTouched({
      name: true,
      identifier: true,
      password: true,
      restaurantName: true,
    });
    return isValid;
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

  const getFieldState = (name: keyof typeof form) => {
    const hasError = !!fieldErrors[name];
    const isValid = touched[name] && !hasError && form[name].length > 0;
    return { hasError, isValid };
  };

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
        <Field
          label="Full Name"
          error={fieldErrors.name}
          isValid={getFieldState("name").isValid}
        >
          <Input
            placeholder="Enter your full name"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              setTouched((prev) => ({ ...prev, name: true }));
            }}
            className={cn(
              getFieldState("name").hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
              getFieldState("name").isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/15 pr-10"
            )}
          />
        </Field>
        <Field
          label="Email or Phone"
          error={fieldErrors.identifier}
          isValid={getFieldState("identifier").isValid}
        >
          <Input
            placeholder="Enter your email or phone number"
            value={form.identifier}
            onChange={(event) => {
              setForm((current) => ({ ...current, identifier: event.target.value }));
              setTouched((prev) => ({ ...prev, identifier: true }));
            }}
            className={cn(
              getFieldState("identifier").hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
              getFieldState("identifier").isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/15 pr-10"
            )}
          />
        </Field>
        <Field
          label="Password"
          error={fieldErrors.password}
          isValid={getFieldState("password").isValid}
        >
          <Input
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => {
              setForm((current) => ({ ...current, password: event.target.value }));
              setTouched((prev) => ({ ...prev, password: true }));
            }}
            className={cn(
              getFieldState("password").hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
              getFieldState("password").isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/15 pr-10"
            )}
          />
        </Field>
        <Field
          label="Business Name"
          error={fieldErrors.restaurantName}
          isValid={getFieldState("restaurantName").isValid}
        >
          <Input
            placeholder="Enter your business name"
            value={form.restaurantName}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                restaurantName: event.target.value,
              }));
              setTouched((prev) => ({ ...prev, restaurantName: true }));
            }}
            className={cn(
              getFieldState("restaurantName").hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
              getFieldState("restaurantName").isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/15 pr-10"
            )}
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
  isValid,
}: {
  children: React.ReactNode;
  label: string;
  error?: string;
  isValid?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#374151]">{label}</span>
      <div className="relative">
        {children}
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </label>
  );
}

