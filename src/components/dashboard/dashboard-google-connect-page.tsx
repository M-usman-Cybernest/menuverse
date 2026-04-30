"use client";

import { CheckCircle2, ExternalLink, HardDrive, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_GOOGLE_AUTH, API_GOOGLE_STATUS } from "@/lib/api-routes";

type GoogleDriveStatusResponse = {
  configured: boolean;
  connected: boolean;
  message?: string;
};

export function DashboardGoogleConnectPage() {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadStatus = useCallback(async () => {
    setCheckingStatus(true);

    try {
      const response = await fetch(API_GOOGLE_STATUS);
      const payload = (await response.json()) as
        | GoogleDriveStatusResponse
        | { message?: string };

      if (!response.ok || !("connected" in payload)) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Could not check your Google connection.",
        );
      }

      setConfigured(payload.configured);
      setConnected(payload.connected);
      setStatusMessage(payload.message ?? "");
    } catch (error) {
      setConfigured(false);
      setConnected(false);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not check your Google connection.",
      );
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStatus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadStatus]);

  useEffect(() => {
    function handleWindowMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      if (event.data.type !== "menuverse-google-drive-auth") {
        return;
      }

      setConnecting(false);

      const message =
        typeof event.data.message === "string"
          ? event.data.message
          : "Google account connection finished.";

      setFeedback(message);

      if (event.data.ok) {
        setConnected(true);
        void loadStatus();
      }
    }

    window.addEventListener("message", handleWindowMessage);

    return () => {
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [loadStatus]);

  const connectGoogleDrive = useCallback(async () => {
    setConnecting(true);
    setFeedback("");

    try {
      const origin = window.location.origin;
      const response = await fetch(
        `${API_GOOGLE_AUTH}?origin=${encodeURIComponent(origin)}`,
      );
      const payload = (await response.json()) as
        | { authUrl: string }
        | { message?: string };

      if (!response.ok || !("authUrl" in payload)) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Could not start Google authorization.",
        );
      }

      const popup = window.open(
        payload.authUrl,
        "google-drive",
        "width=560,height=720,resizable=yes,scrollbars=yes",
      );

      if (!popup) {
        throw new Error(
          "Popup blocked. Allow popups for this site, then try connecting again.",
        );
      }

      popup.focus();
    } catch (error) {
      setConnecting(false);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Could not start Google authorization.",
      );
    }
  }, []);

  const showConnectedState = connected && configured;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#0f766e]">Google Connect</p>
        <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
          Connect your Google account
        </h2>
        <p className="text-sm leading-6 text-[#4b5563]">
          Connect once to let your team upload menu images and 3D models into the
          configured Google Drive folder.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-[#0f766e]" />
                Account status
              </CardTitle>
              <CardDescription>
                Check the current Google Drive connection for this admin session.
              </CardDescription>
            </div>
            <Badge variant={showConnectedState ? "accent" : "warm"}>
              {checkingStatus
                ? "Checking..."
                : showConnectedState
                  ? "Connected"
                  : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showConnectedState ? (
            <div className="rounded-xl border border-[#d1fae5] bg-[#ecfdf5] p-4 text-sm text-[#065f46]">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Google account connected successfully.
              </p>
              <p className="mt-2">
                You can go back to the Inventory and add items with Google Drive
                uploads enabled.
              </p>
            </div>
          ) : null}

          {!configured && statusMessage ? (
            <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-4 text-sm text-[#9a3412]">
              {statusMessage}
            </div>
          ) : null}

          {feedback && (!showConnectedState || feedback !== statusMessage) ? (
            <Badge variant={showConnectedState ? "accent" : "warm"}>
              {feedback}
            </Badge>
          ) : null}

          {configured && !showConnectedState ? (
            <p className="text-sm leading-6 text-[#4b5563]">
              Your Google account is not connected yet. Connect it first, then head
              back to the Inventory to add new items and upload 3D assets.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={connecting || checkingStatus || !configured}
              onClick={() => void connectGoogleDrive()}
              type="button"
            >
              <ExternalLink className="h-4 w-4" />
              {connecting
                ? "Connecting..."
                : showConnectedState
                  ? "Reconnect Google Account"
                  : "Connect Google Account"}
            </Button>
            <Button
              disabled={checkingStatus}
              onClick={() => void loadStatus()}
              type="button"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`}
              />
              Refresh Status
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href="/dashboard/menu">Back to Inventory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
