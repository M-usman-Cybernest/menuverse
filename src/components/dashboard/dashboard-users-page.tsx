"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { API_DASHBOARD_USERS } from "@/lib/api-routes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TeamMember } from "@/lib/types";

type UsersPayload = {
  users: TeamMember[];
};

export function DashboardUsersPage({
  initialUsers,
}: {
  initialUsers: TeamMember[];
}) {
  const [users, setUsers] = useState<TeamMember[]>(initialUsers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    restaurantName: "",
  });

  async function submit() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    const response = await fetch(API_DASHBOARD_USERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as UsersPayload | { message: string };

    if (response.ok && "users" in payload) {
      setUsers(payload.users);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "staff",
        restaurantName: "",
      });
      setSuccess("Team member added");
    } else {
      setError("message" in payload ? payload.message : "Could not create user.");
    }

    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#0f766e]">User Management</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Admin-only team and account setup
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add a team member</CardTitle>
            <CardDescription>
              Create admins, owners, or staff and seed a starter restaurant for new owners.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value }))
                }
              >
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            {form.role === "owner" ? (
              <Field label="Business Name">
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
            ) : null}
            {error ? (
              <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
                {error}
              </Badge>
            ) : null}
            {success ? <Badge variant="accent">{success}</Badge> : null}
            <Button onClick={() => void submit()} disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Creating..." : "Create user"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing users</CardTitle>
            <CardDescription>
              Accounts already seeded or added inside this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-[#6b7280]">{user.email || user.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="accent">{user.role}</Badge>
                  <Badge>{user.subscriptionStatus}</Badge>
                </div>
              </div>
            ))}
            {users.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#d9cdbb] bg-[#fffcf8] p-6 text-sm text-[#6b7280]">
                No users yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
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
    <label>
      <span className="mb-2 block text-sm font-medium text-[#374151]">{label}</span>
      {children}
    </label>
  );
}
