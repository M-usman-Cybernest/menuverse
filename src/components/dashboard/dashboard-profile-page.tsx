"use client";

import { Save } from "lucide-react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeRange, slugify } from "@/lib/utils";

export function DashboardProfilePage() {
  const {
    restaurant,
    saveError,
    saveRestaurant,
    saveSuccess,
    saving,
    updateRestaurantField,
    updateTiming,
  } = useDashboard();

  if (!restaurant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Restaurant Profile</p>
          <h2 className="text-3xl font-semibold tracking-tight">Brand and publishing</h2>
        </div>
        <Button onClick={() => void saveRestaurant()} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant details</CardTitle>
            <CardDescription>
              Everything that appears on the public page and restaurant QR destination.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Restaurant Name">
              <Input
                value={restaurant.name}
                onChange={(event) =>
                  updateRestaurantField("name", event.target.value)
                }
              />
            </Field>
            <Field label="Slug">
              <Input
                value={restaurant.slug}
                onChange={(event) =>
                  updateRestaurantField("slug", slugify(event.target.value) || "restaurant")
                }
              />
            </Field>
            <Field className="md:col-span-2" label="Description">
              <Textarea
                rows={4}
                value={restaurant.description}
                onChange={(event) =>
                  updateRestaurantField("description", event.target.value)
                }
              />
            </Field>
            <Field className="md:col-span-2" label="Hero Note">
              <Textarea
                rows={3}
                value={restaurant.heroNote}
                onChange={(event) =>
                  updateRestaurantField("heroNote", event.target.value)
                }
              />
            </Field>
            <Field label="Cuisine Label">
              <Input
                value={restaurant.cuisineLabel}
                onChange={(event) =>
                  updateRestaurantField("cuisineLabel", event.target.value)
                }
              />
            </Field>
            <Field label="Support Email">
              <Input
                value={restaurant.supportEmail}
                onChange={(event) =>
                  updateRestaurantField("supportEmail", event.target.value)
                }
              />
            </Field>
            <Field label="Cover Image URL">
              <Input
                value={restaurant.coverImageUrl}
                onChange={(event) =>
                  updateRestaurantField("coverImageUrl", event.target.value)
                }
              />
            </Field>
            <Field label="Logo / Thumb URL">
              <Input
                value={restaurant.logoUrl}
                onChange={(event) =>
                  updateRestaurantField("logoUrl", event.target.value)
                }
              />
            </Field>
            <Field className="md:col-span-2" label="Location Label">
              <Input
                value={restaurant.locationLabel}
                onChange={(event) =>
                  updateRestaurantField("locationLabel", event.target.value)
                }
              />
            </Field>
            <Field className="md:col-span-2" label="Google Maps Link">
              <Input
                value={restaurant.locationMapsUrl}
                onChange={(event) =>
                  updateRestaurantField("locationMapsUrl", event.target.value)
                }
              />
            </Field>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing state</CardTitle>
              <CardDescription>
                Toggle whether the restaurant should be publicly visible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-[#ece4d8] bg-[#fffcf8] px-4 py-3">
                <div>
                  <p className="font-medium text-[#111827]">Public menu</p>
                  <p className="text-sm text-[#6b7280]">
                    When off, the public route stays hidden.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    updateRestaurantField("isPublished", !restaurant.isPublished)
                  }
                  variant={restaurant.isPublished ? "default" : "secondary"}
                >
                  {restaurant.isPublished ? "Published" : "Hidden"}
                </Button>
              </div>
              {saveError ? (
                <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
                  {saveError}
                </Badge>
              ) : null}
              {saveSuccess ? <Badge variant="accent">{saveSuccess}</Badge> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating hours</CardTitle>
              <CardDescription>
                These timings appear directly on the public experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {restaurant.timings.map((timing) => (
                <div
                  key={timing.day}
                  className="rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{timing.day}</p>
                      <p className="text-sm text-[#6b7280]">
                        {formatTimeRange(timing.open, timing.close, timing.closed)}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        updateTiming(timing.day, "closed", !timing.closed)
                      }
                      size="sm"
                      variant={timing.closed ? "default" : "secondary"}
                    >
                      {timing.closed ? "Closed" : "Open"}
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="time"
                      value={timing.open}
                      onChange={(event) =>
                        updateTiming(timing.day, "open", event.target.value)
                      }
                    />
                    <Input
                      type="time"
                      value={timing.close}
                      onChange={(event) =>
                        updateTiming(timing.day, "close", event.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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
