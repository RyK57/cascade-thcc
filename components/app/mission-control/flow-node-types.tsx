"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MissionNodeData } from "@/libs/mission-control";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const STATE_RING: Record<string, string> = {
  idle: "border-border",
  active: "border-[var(--brand-accent,#E8501F)]",
  done: "border-[#6F68FF]",
};

function WalletNode({ data }: NodeProps) {
  const nodeData = data as MissionNodeData;
  const reduceMotion = useReducedMotion();
  const pulsing = nodeData.state === "active" && !reduceMotion;

  return (
    <motion.div
      animate={pulsing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={pulsing ? { duration: 1.6, repeat: Infinity } : undefined}
      className={`w-56 rounded-xl border-2 bg-card p-3 shadow-sm ${STATE_RING[nodeData.state]}`}
    >
      <Handle type="target" position={Position.Left} />
      <p className="text-sm font-medium text-foreground">{nodeData.title}</p>
      {nodeData.subtitle ? (
        <p className="text-xs text-muted-foreground">{nodeData.subtitle}</p>
      ) : null}
      {nodeData.address ? (
        <a
          href={nodeData.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {truncateAddress(nodeData.address)}
        </a>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">not connected</p>
      )}
      {nodeData.balances ? (
        <div className="mt-2 flex justify-between text-xs">
          <span className="font-medium text-foreground">
            {nodeData.balances.usdc} USDC
          </span>
          <span className="text-muted-foreground">
            {Number(nodeData.balances.eth).toFixed(4)} ETH
          </span>
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </motion.div>
  );
}

function StageNode({ data }: NodeProps) {
  const nodeData = data as MissionNodeData;
  const stateStyles: Record<string, string> = {
    idle: "border-border text-muted-foreground",
    active: "border-[var(--brand-accent,#E8501F)] text-foreground",
    done: "border-[#6F68FF] text-foreground",
  };
  return (
    <div
      className={`rounded-full border-2 bg-card px-4 py-1.5 text-xs font-medium ${stateStyles[nodeData.state]}`}
    >
      <Handle type="target" position={Position.Left} />
      {nodeData.title}
      {nodeData.state === "done" ? " ✓" : ""}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

/** Module-scope: React Flow requires a stable nodeTypes identity. */
export const nodeTypes = {
  wallet: WalletNode,
  stage: StageNode,
};
