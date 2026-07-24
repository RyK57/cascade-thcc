"use client";

import { useEffect, useState, type ComponentType } from "react";
import { isDynamicConfigured } from "@/libs/dynamic/config";

interface MissionControlCanvasProps {
  jobId: string;
}

/**
 * Drop-in live pipeline canvas for the /main?job= page:
 *
 *   <MissionControlCanvas jobId={job.id} />
 *
 * Lazy loader mirroring dynamic-auth-panel: the client uses Dynamic hooks +
 * react-query, which only exist inside the lazily-mounted provider subtree.
 * Renders nothing when Dynamic isn't configured — safe to place anywhere.
 */
export function MissionControlCanvas({ jobId }: MissionControlCanvasProps) {
  const [Canvas, setCanvas] =
    useState<ComponentType<MissionControlCanvasProps> | null>(null);

  useEffect(() => {
    if (!isDynamicConfigured()) return;

    let cancelled = false;

    void import("./mission-control-canvas-client").then((module) => {
      if (!cancelled) setCanvas(() => module.MissionControlCanvasClient);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!Canvas) return null;
  return <Canvas jobId={jobId} />;
}
