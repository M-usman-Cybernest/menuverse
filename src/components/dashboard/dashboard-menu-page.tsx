"use client";

import { MoveLeft, MoveRight, Plus, Save, Trash2 } from "lucide-react";
import Image from "next/image";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DashboardMenuPage() {
  const {
    addCategory,
    addItem,
    availableTags,
    categories,
    items,
    moveCategory,
    removeCategory,
    removeItem,
    saveError,
    saveRestaurant,
    saveSuccess,
    saving,
    updateCategory,
    updateItem,
    toggleItemTag,
  } = useDashboard();

  const sections = categories.map((category) => ({
    category,
    items: items.filter((item) => item.categoryId === category.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Menu Builder</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Categories, dishes, pricing, media, and AR links
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={addCategory} variant="secondary">
            <Plus className="h-4 w-4" />
            Add category
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

      <div className="space-y-5">
        {sections.map(({ category, items: sectionItems }) => (
          <Card key={category.id}>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-3">
                  <Input
                    className="max-w-sm text-base font-semibold"
                    value={category.name}
                    onChange={(event) =>
                      updateCategory(category.id, "name", event.target.value)
                    }
                  />
                  <Textarea
                    rows={2}
                    value={category.description}
                    onChange={(event) =>
                      updateCategory(category.id, "description", event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => moveCategory(category.id, "left")}
                    size="icon"
                    variant="outline"
                  >
                    <MoveLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => moveCategory(category.id, "right")}
                    size="icon"
                    variant="outline"
                  >
                    <MoveRight className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => addItem(category.id)}
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                    Add item
                  </Button>
                  <Button
                    onClick={() => removeCategory(category.id)}
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
              <CardDescription>{sectionItems.length} items in this section</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {sectionItems.length ? (
                sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#ece4d8] bg-white">
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          sizes="(max-width: 1024px) 100vw, 180px"
                          src={item.imageUrl}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Item Name">
                          <Input
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Price">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "price",
                                Number(event.target.value || 0),
                              )
                            }
                          />
                        </Field>
                        <Field className="md:col-span-2" label="Description">
                          <Textarea
                            rows={3}
                            value={item.description}
                            onChange={(event) =>
                              updateItem(item.id, "description", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Image URL">
                          <Input
                            value={item.imageUrl}
                            onChange={(event) =>
                              updateItem(item.id, "imageUrl", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Prep Time">
                          <Input
                            value={item.prepTime}
                            onChange={(event) =>
                              updateItem(item.id, "prepTime", event.target.value)
                            }
                          />
                        </Field>
                        <Field className="md:col-span-2" label="3D / AR Model URL">
                          <Input
                            value={item.arModelUrl ?? ""}
                            onChange={(event) =>
                              updateItem(item.id, "arModelUrl", event.target.value)
                            }
                          />
                        </Field>
                        <Field className="md:col-span-2" label="iOS `.usdz` URL">
                          <Input
                            value={item.arModelIosUrl ?? ""}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "arModelIosUrl",
                                event.target.value,
                              )
                            }
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => {
                        const active = item.dietaryTags.includes(tag);

                        return (
                          <Button
                            key={tag}
                            onClick={() => toggleItemTag(item.id, tag)}
                            size="sm"
                            variant={active ? "default" : "outline"}
                          >
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {item.dietaryTags.map((tag) => (
                          <Badge key={tag} variant={tag === "AR Ready" ? "accent" : "default"}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button onClick={() => removeItem(item.id)} variant="ghost">
                        <Trash2 className="h-4 w-4" />
                        Remove item
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#d9cdbb] bg-[#fffcf8] p-6 text-sm text-[#6b7280]">
                  No items in this category yet.
                </div>
              )}
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
