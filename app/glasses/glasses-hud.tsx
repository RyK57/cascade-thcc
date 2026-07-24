"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HudJob {
  id: string;
  title: string;
  tier: string;
  status: string;
  price: string | null;
}

const ACTIONABLE = new Set(["quoted", "delivered", "in_review"]);

const TIER_COLOR: Record<string, string> = {
  ai: "#6F68FF",
  peer: "#E8501F",
  expert: "#B44FD8",
};

function tokenQuery(): string {
  if (typeof window === "undefined") return "";
  const token = new URLSearchParams(window.location.search).get("token");
  return token ? `?token=${encodeURIComponent(token)}` : "";
}

export function GlassesHud() {
  const [jobs, setJobs] = useState<HudJob[]>([]);
  const [selected, setSelected] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const busy = useRef(false);
  const approved = useRef(new Set<string>());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2500);
  }, []);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/glasses/feed${tokenQuery()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { jobs: HudJob[] };
      setJobs(data.jobs);
      setSelected((s) => Math.min(s, Math.max(0, data.jobs.length - 1)));
    } catch {
      // HUD keeps last known state on network blips
    }
  }, []);

  useEffect(() => {
    // Subscribing to an external system (the job feed) is what effects are
    // for. The rule can't see past the async boundary: refresh awaits fetch
    // before it ever calls setState, so nothing updates state synchronously
    // during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  const approve = useCallback(async () => {
    const job = jobs[selected];
    if (
      !job ||
      busy.current ||
      approved.current.has(job.id) ||
      !ACTIONABLE.has(job.status)
    ) {
      return;
    }
    busy.current = true;
    showFlash(`Approving "${job.title}"…`);
    try {
      const res = await fetch(
        `/api/glasses/jobs/${job.id}/approve${tokenQuery()}`,
        { method: "POST" }
      );
      // The approve route runs the full tapback state machine (launch quote /
      // release payout) with no server-side idempotency, so a second pinch
      // must never reach it. Latch the id before the feed catches up.
      if (res.ok) approved.current.add(job.id);
      showFlash(res.ok ? "Approved ✓" : "Failed — try in iMessage");
    } catch {
      showFlash("Failed — try in iMessage");
    } finally {
      // Stay busy until the feed reflects the new status, otherwise the next
      // keypress re-enters against a stale ACTIONABLE status.
      await refresh();
      busy.current = false;
    }
  }, [jobs, selected, refresh, showFlash]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        setSelected((s) => Math.min(s + 1, Math.max(0, jobs.length - 1)));
      } else if (event.key === "ArrowUp") {
        setSelected((s) => Math.max(s - 1, 0));
      } else if (event.key === "Enter" || event.key === "ArrowRight") {
        void approve();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jobs.length, approve]);

  return (
    <div
      style={{
        width: 600,
        height: 600,
        maxWidth: "100vw",
        background: "#000",
        color: "#fff",
        fontFamily: "-apple-system, system-ui, sans-serif",
        padding: 24,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          marginBottom: 14,
          background: "linear-gradient(90deg,#E8501F,#6F68FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        CASCADE
      </div>

      {flash ? (
        <div style={{ fontSize: 30, color: "#4ade80", marginBottom: 12 }}>
          {flash}
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <div style={{ fontSize: 26, color: "#aaa" }}>
          Text the Cascade number to start a task.
        </div>
      ) : (
        jobs.slice(0, 5).map((job, index) => {
          const isSelected = index === selected;
          const actionable = ACTIONABLE.has(job.status);
          return (
            <div
              key={job.id}
              style={{
                padding: "10px 12px",
                marginBottom: 8,
                borderRadius: 14,
                border: isSelected ? "3px solid #E8501F" : "3px solid #333",
                background: isSelected ? "#1a120d" : "transparent",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {job.title}
              </div>
              <div style={{ fontSize: 20, display: "flex", gap: 12 }}>
                <span style={{ color: TIER_COLOR[job.tier] ?? "#888" }}>
                  {job.tier.toUpperCase()}
                </span>
                <span style={{ color: "#ccc" }}>{job.status}</span>
                {job.price ? (
                  <span style={{ color: "#4ade80" }}>{job.price}</span>
                ) : null}
                {isSelected && actionable ? (
                  <span style={{ color: "#E8501F" }}>▸ pinch to approve</span>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
