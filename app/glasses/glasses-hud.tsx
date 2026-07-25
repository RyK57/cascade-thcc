"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HudJob {
  id: string;
  title: string;
  tier: string;
  status: string;
  price: string | null;
}

type Flash = { text: string; kind: "work" | "done" | "fail" };

const ACTIONABLE = new Set(["quoted", "delivered", "in_review"]);

// Four rows is what clears the 600px lens. Scrolling is not available
// on-glasses, so selection has to stop here too — otherwise a pinch approves
// a job nobody can see.
const VISIBLE_JOBS = 4;

const TIER_CLASS: Record<string, string> = {
  ai: "hud-tier--ai",
  peer: "hud-tier--peer",
  expert: "hud-tier--expert",
};

function tokenQuery(): string {
  if (typeof window === "undefined") return "";
  const token = new URLSearchParams(window.location.search).get("token");
  return token ? `?token=${encodeURIComponent(token)}` : "";
}

export function GlassesHud() {
  const [jobs, setJobs] = useState<HudJob[]>([]);
  const [selected, setSelected] = useState(0);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [stale, setStale] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [agentReply, setAgentReply] = useState<string | null>(null);
  // State, not a ref: the footer reads it to decide whether a pinch still does
  // anything, and a ref would not re-render when the latch trips. `busy` stays
  // a ref — it guards a synchronous decision, not the output.
  const [approvedIds, setApprovedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const busy = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((next: Flash) => {
    setFlash(next);
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
      if (!res.ok) {
        setStale(true);
        return;
      }
      const data = (await res.json()) as { jobs: HudJob[] };
      const visible = data.jobs.slice(0, VISIBLE_JOBS);
      setJobs(visible);
      setSelected((s) => Math.min(s, Math.max(0, visible.length - 1)));
      setStale(false);
    } catch {
      // Keep the last known jobs — but say so, rather than showing a frozen
      // board as if it were current.
      setStale(true);
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

  // Live captions: the iOS app streams partial transcripts while the wearer
  // speaks; poll fast so text tracks speech within ~a second.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/glasses/transcript`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          text: string | null;
          reply?: string | null;
        };
        setCaption(data.text);
        setAgentReply(data.reply ?? null);
      } catch {
        // keep last caption on blips
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const approve = useCallback(async () => {
    const job = jobs[selected];
    if (
      !job ||
      busy.current ||
      approvedIds.has(job.id) ||
      !ACTIONABLE.has(job.status)
    ) {
      return;
    }
    busy.current = true;
    showFlash({ text: "Approving…", kind: "work" });
    try {
      const res = await fetch(
        `/api/glasses/jobs/${job.id}/approve${tokenQuery()}`,
        { method: "POST" }
      );
      // The approve route runs the full tapback state machine (launch quote /
      // release payout) with no server-side idempotency, so a second pinch
      // must never reach it. Latch the id before the feed catches up.
      if (res.ok) setApprovedIds((prev) => new Set(prev).add(job.id));
      showFlash(
        res.ok
          ? { text: "Approved", kind: "done" }
          : { text: "Couldn't approve — use iMessage", kind: "fail" }
      );
    } catch {
      showFlash({ text: "Couldn't approve — use iMessage", kind: "fail" });
    } finally {
      // Stay busy until the feed reflects the new status, otherwise the next
      // pinch re-enters against a stale ACTIONABLE status.
      await refresh();
      busy.current = false;
    }
  }, [jobs, selected, approvedIds, refresh, showFlash]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        setSelected((s) => Math.min(s + 1, Math.max(0, jobs.length - 1)));
      } else if (event.key === "ArrowUp") {
        setSelected((s) => Math.max(s - 1, 0));
      } else if (event.key === "Enter") {
        // Enter only. A right swipe is a navigation gesture on the Neural
        // Band, and approve releases a payout — it must take the pinch.
        void approve();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jobs.length, approve]);

  const current = jobs[selected];
  const canApprove = Boolean(
    current && ACTIONABLE.has(current.status) && !approvedIds.has(current.id)
  );

  return (
    <div className="hud">
      <header className="hud-bar hud-caps">
        <span>
          <span className="hud-bracket">[</span> Cascade{" "}
          <span className="hud-bracket">]</span>
        </span>
        <span className="hud-live">
          <span className={`hud-dot${stale ? " hud-dot--stale" : ""}`} />
          {stale ? "No signal" : "Live"}
        </span>
      </header>

      {caption ? (
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.3,
            color: "#fff",
            background: "#141414",
            border: "2px solid #6F68FF",
            borderRadius: 14,
            padding: "10px 14px",
            marginBottom: 12,
            maxHeight: 110,
            overflow: "hidden",
          }}
        >
          🎤 {caption}
        </div>
      ) : null}

      {agentReply ? (
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.3,
            color: "#fff",
            background: "#1a120d",
            border: "2px solid #E8501F",
            borderRadius: 14,
            padding: "10px 14px",
            marginBottom: 12,
            maxHeight: 160,
            overflow: "hidden",
          }}
        >
          ⚡ {agentReply}
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <div className="hud-empty">
          <p className="hud-empty-lead">No open tasks.</p>
          <p className="hud-empty-sub">
            Text the Cascade number and it lands here.
          </p>
        </div>
      ) : (
        <div className="hud-list">
          {jobs.map((job, index) => {
            const isSelected = index === selected;
            return (
              <div
                key={job.id}
                className={`hud-row${isSelected ? " hud-row--on" : ""}`}
              >
                <span className="hud-gutter">
                  {isSelected ? <span className="hud-dot" /> : null}
                </span>
                <span className="hud-meta hud-caps">
                  <span className={TIER_CLASS[job.tier] ?? ""}>{job.tier}</span>
                  <span aria-hidden>·</span>
                  <span>{job.status.replace(/_/g, " ")}</span>
                  {job.price ? (
                    <span className="hud-price">{job.price}</span>
                  ) : null}
                </span>
                <span className="hud-title">{job.title}</span>
              </div>
            );
          })}
        </div>
      )}

      <footer className="hud-foot hud-caps">
        {flash ? (
          <p className={`hud-flash hud-flash--${flash.kind}`}>{flash.text}</p>
        ) : jobs.length === 0 ? (
          // No rows to move through and nothing to pinch — don't advertise
          // controls that would do nothing.
          <p className="hud-idle">Listening for new tasks</p>
        ) : (
          <div className="hud-legend">
            <span>Swipe move</span>
            <span className={canApprove ? "hud-legend--live" : undefined}>
              {canApprove ? "Pinch approve" : "Waiting"}
            </span>
            <span>{jobs.length} open</span>
          </div>
        )}
      </footer>
    </div>
  );
}
