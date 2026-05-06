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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const pakistanPhoneRegex = /^(\+92|92|0)?3\d{9}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateField = (name: string, value: string) => {
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
    return undefined;
  };

  useEffect(() => {
    const newErrors: FieldErrors = {};
    if (touched.identifier) {
      const err = validateField("identifier", identifier);
      if (err) newErrors.identifier = err;
    }
    if (touched.password) {
      const err = validateField("password", password);
      if (err) newErrors.password = err;
    }
    setFieldErrors(newErrors);
  }, [identifier, password, touched]);

  function validate(): boolean {
    const newErrors: FieldErrors = {};
    let isValid = true;

    const idErr = validateField("identifier", identifier);
    if (idErr) {
      newErrors.identifier = idErr;
      isValid = false;
    }

    const passErr = validateField("password", password);
    if (passErr) {
      newErrors.password = passErr;
      isValid = false;
    }

    setFieldErrors(newErrors);
    setTouched({ identifier: true, password: true });
    return isValid;
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

  const getFieldState = (name: "identifier" | "password") => {
    const value = name === "identifier" ? identifier : password;
    const hasError = !!fieldErrors[name];
    const isValid = touched[name] && !hasError && value.length > 0;
    return { hasError, isValid };
  };

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
        <Field
          label="Email or Phone"
          error={fieldErrors.identifier}
          isValid={getFieldState("identifier").isValid}
        >
          <Input
            placeholder="Enter your email or phone number"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
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
            value={password}
            placeholder="Enter your password"
            onChange={(event) => {
              setPassword(event.target.value);
              setTouched((prev) => ({ ...prev, password: true }));
            }}
            className={cn(
              getFieldState("password").hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
              getFieldState("password").isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/15 pr-10"
            )}
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

