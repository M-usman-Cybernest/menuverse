"use client";

import { Plus, Save, Trash2 } from "lucide-react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function DashboardBranchesPage() {
  const {
    restaurant,
    addBranch,
    removeBranch,
    saveError,
    saveRestaurant,
    saveSuccess,
    saving,
    updateBranch,
  } = useDashboard();

  if (!restaurant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Branch Management</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Multi-location restaurant setup
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={addBranch} variant="secondary">
            <Plus className="h-4 w-4" />
            Add branch
          </Button>
          <Button onClick={() => void saveRestaurant()} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {saveError ? (
        <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
          {saveError}
        </Badge>
      ) : null}
      {saveSuccess ? <Badge variant="accent">{saveSuccess}</Badge> : null}

      <div className="grid gap-4">
        {restaurant.branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <CardTitle>{branch.name}</CardTitle>
              <CardDescription>
                Keep address, directions, and table counts clean for every branch.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Branch Name">
                <Input
                  value={branch.name}
                  onChange={(event) =>
                    updateBranch(branch.id, "name", event.target.value)
                  }
                />
              </Field>
              <Field label="Table Count">
                <Input
                  type="number"
                  value={branch.tableCount}
                  onChange={(event) =>
                    updateBranch(
                      branch.id,
                      "tableCount",
                      Number(event.target.value || 0),
                    )
                  }
                />
              </Field>
              <Field className="md:col-span-2" label="Address">
                <Input
                  value={branch.address}
                  onChange={(event) =>
                    updateBranch(branch.id, "address", event.target.value)
                  }
                />
              </Field>
              <Field label="City">
                <Input
                  value={branch.city}
                  onChange={(event) =>
                    updateBranch(branch.id, "city", event.target.value)
                  }
                />
              </Field>
              <Field label="Directions Label">
                <Input
                  value={branch.directionsLabel}
                  onChange={(event) =>
                    updateBranch(branch.id, "directionsLabel", event.target.value)
                  }
                />
              </Field>
              <Field className="md:col-span-2" label="Google Maps Link">
                <Input
                  value={branch.mapsUrl}
                  onChange={(event) =>
                    updateBranch(branch.id, "mapsUrl", event.target.value)
                  }
                />
              </Field>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  onClick={() => removeBranch(branch.id)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove branch
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-[#374151]">{label}</span>
      {children}
    </label>
  );
}
