"use client";
import { Building2, Clock, ImagePlus, Key, Plus, Save, Shield, Store, Trash2, User } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { API_DASHBOARD_UPLOAD } from "@/lib/api-routes";
import { MapPicker } from "@/components/dashboard/map-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeRange, slugify } from "@/lib/utils";

type Tab = "business" | "hours" | "branches" | "account";

type BranchForm = {
  name: string;
  address: string;
  city: string;
  directionsLabel: string;
  tableCount: number;
  mapsUrl: string;
};

const EMPTY_BRANCH: BranchForm = {
  name: "",
  address: "",
  city: "",
  directionsLabel: "",
  tableCount: 10,
  mapsUrl: "https://maps.google.com",
};

export function DashboardSettingsPage() {
  const {
    bundle,
    restaurant,
    saveBranches,
    saveError,
    saveHours,
    saveProfile,
    saveRestaurant,
    saveSuccess,
    saving,
    updateBranch,
    updateRestaurantField,
    updateAnnouncementBar,
    updateTiming,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<Tab>("business");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchForm>(EMPTY_BRANCH);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File, field: "logoUrl" | "coverImageUrl") => {
      const setter = field === "logoUrl" ? setUploadingLogo : setUploadingCover;
      setter(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(API_DASHBOARD_UPLOAD, {
          method: "POST",
          body: formData,
        });
        const result = (await response.json()) as
          | { url: string }
          | { message: string };
        if (response.ok && "url" in result) {
          updateRestaurantField(field, result.url);
        }
      } catch {
        // silently fail
      } finally {
        setter(false);
      }
    },
    [updateRestaurantField],
  );

  async function submitBranch() {
    if (!branchForm.name.trim() || !restaurant) return;
    const newBranch = {
      id: Math.random().toString(36).slice(2, 9),
      ...branchForm,
    };
    const success = await saveBranches([...restaurant.branches, newBranch]);
    if (success) {
      setBranchModalOpen(false);
      setBranchForm(EMPTY_BRANCH);
    }
  }

  async function handleRemoveBranch(branchId: string) {
    if (!restaurant) return;
    await saveBranches(restaurant.branches.filter((b) => b.id !== branchId));
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "business", label: "Business", icon: <Store className="h-4 w-4" /> },
    { id: "hours", label: "Hours", icon: <Clock className="h-4 w-4" /> },
    { id: "branches", label: "Branches", icon: <Building2 className="h-4 w-4" /> },
    { id: "account", label: "Account", icon: <User className="h-4 w-4" /> },
  ];

  if (!restaurant) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Settings</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Business Configuration
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() =>
              updateRestaurantField(
                "isPublished",
                !restaurant.isPublished,
              )
            }
            variant={restaurant.isPublished ? "default" : "secondary"}
            size="sm"
            className="h-9 px-4 rounded-full border-[#0f766e]/20"
          >
            <div className={`mr-2 h-2 w-2 rounded-full ${restaurant.isPublished ? "bg-white animate-pulse" : "bg-slate-400"}`} />
            {restaurant.isPublished ? "Public" : "Hidden"}
          </Button>
          <Button
            onClick={() => {
              if (activeTab === "business") saveProfile(restaurant);
              else if (activeTab === "hours") saveHours(restaurant.timings);
              else if (activeTab === "branches") saveBranches(restaurant.branches);
              else saveRestaurant();
            }}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : `Save Changes`}
          </Button>
        </div>
      </div>

      {saveError ? (
        <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
          {saveError}
        </Badge>
      ) : null}
      {saveSuccess ? <Badge variant="accent">{saveSuccess}</Badge> : null}

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[#e7dfd2] bg-[#faf7f2] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${activeTab === tab.id
              ? "bg-[#0f766e] text-white shadow-sm"
              : "text-[#6b7280] hover:bg-[#efe8dc] hover:text-[#111827]"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== BUSINESS TAB ===== */}
      {activeTab === "business" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                Core information shown on the public site page.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Business Name">
                <Input
                  value={restaurant.name}
                  onChange={(e) => updateRestaurantField("name", e.target.value)}
                />
              </Field>
              <Field label="Slug">
                <Input
                  value={restaurant.slug}
                  onChange={(e) =>
                    updateRestaurantField(
                      "slug",
                      slugify(e.target.value) || "restaurant",
                    )
                  }
                />
              </Field>
              <Field className="md:col-span-2" label="Description">
                <Textarea
                  rows={3}
                  value={restaurant.description}
                  onChange={(e) =>
                    updateRestaurantField("description", e.target.value)
                  }
                />
              </Field>
              <Field className="md:col-span-2" label="Hero Note">
                <Textarea
                  rows={2}
                  value={restaurant.heroNote}
                  onChange={(e) =>
                    updateRestaurantField("heroNote", e.target.value)
                  }
                />
              </Field>
              <Field label="Cuisine Label">
                <Input
                  value={restaurant.cuisineLabel}
                  onChange={(e) =>
                    updateRestaurantField("cuisineLabel", e.target.value)
                  }
                />
              </Field>
              <Field label="Support Email">
                <Input
                  value={restaurant.supportEmail}
                  onChange={(e) =>
                    updateRestaurantField("supportEmail", e.target.value)
                  }
                />
              </Field>

              {/* Location map picker */}
              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#374151]">
                  Location
                </span>
                <MapPicker
                  locationLabel={restaurant.locationLabel}
                  value={restaurant.locationMapsUrl}
                  onLabelChange={(label) =>
                    updateRestaurantField("locationLabel", label)
                  }
                  onLocationChange={(url) =>
                    updateRestaurantField("locationMapsUrl", url)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {/* Images */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Logo / Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUploadZone
                    currentUrl={restaurant.logoUrl}
                    inputRef={logoInputRef}
                    loading={uploadingLogo}
                    onUpload={(file) => void uploadFile(file, "logoUrl")}
                    label="Upload Logo"
                    height={110}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUploadZone
                    currentUrl={restaurant.coverImageUrl}
                    inputRef={coverInputRef}
                    loading={uploadingCover}
                    onUpload={(file) => void uploadFile(file, "coverImageUrl")}
                    label="Upload Cover"
                    height={110}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Announcement Bar */}
            <Card className="overflow-hidden border-teal-600/20 shadow-sm">
              <div className="bg-gradient-to-r from-teal-600/10 to-teal-600/5 px-6 py-4 border-b border-teal-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-teal-900">Announcement Bar</CardTitle>
                    <p className="text-xs text-teal-700/70 mt-0.5">Highlight deals or updates at the top of your site.</p>
                  </div>
                  <button
                    onClick={() =>
                      updateAnnouncementBar(
                        "show",
                        !restaurant.announcementBar?.show
                      )
                    }
                    type="button"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${restaurant.announcementBar?.show ? "bg-teal-600" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${restaurant.announcementBar?.show ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </div>
              <CardContent className="pt-6">
                <div className="relative">
                  <div className={`transition-opacity duration-300 ${!restaurant.announcementBar?.show ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                    <Field label="Promotion Message">
                      <div className="relative">
                        <Input
                          placeholder="Enter your announcement message"
                          value={restaurant.announcementBar?.text || ""}
                          onChange={(e) =>
                            updateAnnouncementBar("text", e.target.value)
                          }
                          className="pl-10 h-11"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/50">
                          <Store className="h-4 w-4" />
                        </div>
                      </div>
                    </Field>
                    <p className="mt-2 text-[11px] text-slate-500 italic">
                      Tip: Keep it short and catchy for better mobile display.
                    </p>
                  </div>
                  {!restaurant.announcementBar?.show && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white/80 px-3 py-1 rounded-md text-xs font-medium text-slate-400 border border-slate-100">
                        Enable toggle above to edit
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* ===== HOURS TAB ===== */}
      {activeTab === "hours" ? (
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
            <CardDescription>
              These timings appear on the public site page. Changes are saved
              with the restaurant data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-2">
              {restaurant.timings.map((timing) => (
                <div
                  key={timing.day}
                  className="rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{timing.day}</p>
                      <p className="text-sm text-[#6b7280]">
                        {formatTimeRange(
                          timing.open,
                          timing.close,
                          timing.closed,
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateTiming(timing.day, "closed", !timing.closed)
                      }
                      type="button"
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${!timing.closed ? "bg-[#0f766e]" : "bg-[#d9cdbb]"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${!timing.closed ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-xs text-[#6b7280]">
                        Opens
                      </span>
                      <Input
                        type="time"
                        value={timing.open}
                        onChange={(e) =>
                          updateTiming(timing.day, "open", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-[#6b7280]">
                        Closes
                      </span>
                      <Input
                        type="time"
                        value={timing.close}
                        onChange={(e) =>
                          updateTiming(timing.day, "close", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ===== BRANCHES TAB ===== */}
      {activeTab === "branches" ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Branch Locations</CardTitle>
                  <CardDescription>
                    {restaurant.branches.length} branches configured
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setBranchForm(EMPTY_BRANCH);
                    setBranchModalOpen(true);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {restaurant.branches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-b border-[#e7dfd2] bg-[#faf7f2]">
                        <th className="px-5 py-3 text-left font-medium text-[#6b7280]">
                          Name
                        </th>
                        <th className="hidden px-5 py-3 text-left font-medium text-[#6b7280] sm:table-cell">
                          Address
                        </th>
                        <th className="hidden px-5 py-3 text-left font-medium text-[#6b7280] md:table-cell">
                          City
                        </th>
                        <th className="px-5 py-3 text-center font-medium text-[#6b7280]">
                          Tables
                        </th>
                        <th className="px-5 py-3 text-right font-medium text-[#6b7280]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurant.branches.map((branch) => (
                        <tr
                          key={branch.id}
                          className="border-b border-[#ece4d8] transition hover:bg-[#fffcf8]"
                        >
                          <td className="px-5 py-3 font-semibold text-[#111827]">
                            {branch.name}
                          </td>
                          <td className="hidden px-5 py-3 text-[#6b7280] sm:table-cell">
                            <span className="line-clamp-1">
                              {branch.address}
                            </span>
                          </td>
                          <td className="hidden px-5 py-3 text-[#6b7280] md:table-cell">
                            {branch.city}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant="accent">{branch.tableCount}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              onClick={() => void handleRemoveBranch(branch.id)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mx-5 mb-5 rounded-lg border border-dashed border-[#d9cdbb] bg-[#fffcf8] p-6 text-center text-sm text-[#6b7280]">
                  No branches yet. Click &quot;Add Branch&quot; to create one.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inline editing for existing branches */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurant.branches.map((branch) => (
              <Card key={branch.id} className="flex flex-col border-[#e7dfd2]/60 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="bg-[#faf7f2]/50 border-b border-[#e7dfd2]/40 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-[#111827]">{branch.name}</CardTitle>
                  <Button
                    onClick={() => void handleRemoveBranch(branch.id)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-5 space-y-4 flex-grow">
                  <Field label="Branch Name">
                    <Input
                      value={branch.name}
                      onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                      <Input
                        value={branch.city}
                        onChange={(e) => updateBranch(branch.id, "city", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </Field>
                    <Field label="Tables">
                      <Input
                        type="number"
                        value={branch.tableCount}
                        onChange={(e) =>
                          updateBranch(
                            branch.id,
                            "tableCount",
                            Number(e.target.value || 0),
                          )
                        }
                        className="h-9 text-sm"
                      />
                    </Field>
                  </div>
                  <Field label="Address">
                    <Input
                      value={branch.address}
                      onChange={(e) =>
                        updateBranch(branch.id, "address", e.target.value)
                      }
                      className="h-9 text-sm"
                    />
                  </Field>
                  
                  <div className="pt-2">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Map Location
                    </span>
                    <MapPicker
                      locationLabel={branch.address}
                      value={branch.mapsUrl}
                      onLabelChange={(label) => updateBranch(branch.id, "address", label)}
                      onLocationChange={(url) => updateBranch(branch.id, "mapsUrl", url)}
                      height={120}
                    />
                  </div>
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t border-[#e7dfd2]/40 mt-auto">
                  <Button
                    onClick={() => saveBranches(restaurant.branches)}
                    size="sm"
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold bg-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Branch modal */}
          <Modal
            open={branchModalOpen}
            onClose={() => setBranchModalOpen(false)}
            title="New Branch"
            description="Add a new branch location to your restaurant."
          >
            <div className="space-y-4">
              <Field label="Branch Name">
                <Input
                  placeholder="Enter branch name"
                  value={branchForm.name}
                  onChange={(e) =>
                    setBranchForm((p) => ({ ...p, name: e.target.value }))
                  }
                  autoFocus
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Address">
                  <Input
                    placeholder="123 Main St"
                    value={branchForm.address}
                    onChange={(e) =>
                      setBranchForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </Field>
                <Field label="City">
                  <Input
                    placeholder="New York"
                    value={branchForm.city}
                    onChange={(e) =>
                      setBranchForm((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Directions Label">
                  <Input
                    placeholder="Near Central Park"
                    value={branchForm.directionsLabel}
                    onChange={(e) =>
                      setBranchForm((p) => ({
                        ...p,
                        directionsLabel: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Table Count">
                  <Input
                    type="number"
                    value={branchForm.tableCount}
                    onChange={(e) =>
                      setBranchForm((p) => ({
                        ...p,
                        tableCount: Number(e.target.value || 0),
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => setBranchModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitBranch}
                  disabled={!branchForm.name.trim()}
                >
                  Add Branch
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : null}

      {/* ===== ACCOUNT TAB ===== */}
      {activeTab === "account" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#0f766e]" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your personal details and login credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4">
                <InfoRow label="Name" value={bundle.currentUser.name} />
                <div className="border-t border-[#ece4d8]" />
                <InfoRow label="Email" value={bundle.currentUser.email} />
                <div className="border-t border-[#ece4d8]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">Role</span>
                  <Badge variant="accent">{bundle.currentUser.role}</Badge>
                </div>
                <div className="border-t border-[#ece4d8]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">Subscription</span>
                  <Badge>{bundle.currentUser.subscriptionStatus}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0f766e]" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Current Password">
                <Input id="current-password" type="password" placeholder="••••••••" />
              </Field>
              <Field label="New Password">
                <Input id="new-password" type="password" placeholder="••••••••" />
              </Field>
              <Field label="Confirm Password">
                <Input id="confirm-password" type="password" placeholder="••••••••" />
              </Field>
              <Button
                onClick={async () => {
                  const current = (document.getElementById("current-password") as HTMLInputElement).value;
                  const newPass = (document.getElementById("new-password") as HTMLInputElement).value;
                  const confirm = (document.getElementById("confirm-password") as HTMLInputElement).value;
                  if (newPass !== confirm) {
                    alert("Passwords do not match");
                    return;
                  }
                  const res = await fetch("/api/dashboard/account/password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
                  });
                  if (res.ok) alert("Password updated");
                  else alert("Failed to update password");
                }}
                variant="secondary"
                className="w-full"
              >
                <Key className="h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

/* ---- Helper components ---- */

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
    <label className={`block ${className || ""}`}>
      <div className="mb-2 block text-sm font-medium text-[#374151]">
        {label}
      </div>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ImageUploadZone({
  currentUrl,
  inputRef,
  loading,
  onUpload,
  label,
  height = 140,
}: {
  currentUrl: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  onUpload: (file: File) => void;
  label: string;
  height?: number;
}) {
  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div
          className="relative w-full overflow-hidden rounded-lg border border-[#ece4d8] bg-white"
          style={{ height }}
        >
          <Image
            alt="Preview"
            className="object-cover"
            fill
            sizes="400px"
            src={currentUrl}
          />
        </div>
      ) : null}
      <input
        ref={inputRef}
        accept="image/*"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        type="button"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-[#fffcf8] px-4 py-5 text-sm text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb]"
      >
        {loading ? (
          <span className="animate-pulse">Uploading...</span>
        ) : (
          <>
            <ImagePlus className="h-5 w-5" />
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}
