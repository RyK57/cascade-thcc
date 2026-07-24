import type { Edge, Node } from "@xyflow/react";
import { BRAND } from "@/lib/constants/branding";
import { explorerAddressUrl, explorerTxUrl } from "@/libs/dynamic/usdc";
import { JOB_TIER } from "@/utils/schema/agent";
import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import type { MissionFlowInput, MissionNodeData, MissionNodeState } from "./flow-types";

const ACTIVE = BRAND.accent; // #E8501F
const DONE = BRAND.secondary; // #6F68FF

type MissionNode = Node<MissionNodeData>;

/** Expert-shaped ranks. */
const EXPERT_STAGE_ORDER = [
  JOB_STATUS.intake,
  JOB_STATUS.draftReady,
  JOB_STATUS.quoted,
  JOB_STATUS.launched,
  JOB_STATUS.inReview,
  JOB_STATUS.paymentPending,
  JOB_STATUS.paid,
] as const;

/** Peer-shaped ranks. */
const PEER_STAGE_ORDER = [
  JOB_STATUS.intake,
  JOB_STATUS.quoted,
  JOB_STATUS.funded,
  JOB_STATUS.claimed,
  JOB_STATUS.delivered,
  JOB_STATUS.approved,
  JOB_STATUS.paymentPending,
  JOB_STATUS.paid,
] as const;

function jobRank(status: string, peer: boolean): number {
  const order: readonly string[] = peer ? PEER_STAGE_ORDER : EXPERT_STAGE_ORDER;
  const index = order.indexOf(status);
  return index === -1 ? 0 : index;
}

/** Escrow hold: authorized or settled payment, or peer job past funded. */
function escrowFunded(input: MissionFlowInput): boolean {
  const status = input.payment?.status;
  if (status === PAYMENT_STATUS.authorized || status === PAYMENT_STATUS.settled) {
    return true;
  }
  const jobStatus = input.job.status;
  return (
    jobStatus === JOB_STATUS.funded ||
    jobStatus === JOB_STATUS.claimed ||
    jobStatus === JOB_STATUS.delivered ||
    jobStatus === JOB_STATUS.approved ||
    jobStatus === JOB_STATUS.paid
  );
}

/** Worker paid only when the job is closed paid — not merely escrow settled. */
function workerPaid(input: MissionFlowInput): boolean {
  return input.job.status === JOB_STATUS.paid;
}

function walletNode(
  id: string,
  position: { x: number; y: number },
  data: Omit<MissionNodeData, "kind">
): MissionNode {
  return {
    id,
    type: "wallet",
    position,
    data: { ...data, kind: "wallet" } as MissionNodeData,
  };
}

function stageNode(
  id: string,
  position: { x: number; y: number },
  title: string,
  state: MissionNodeState
): MissionNode {
  return { id, type: "stage", position, data: { kind: "stage", title, state } };
}

function edgeStyle(state: MissionNodeState) {
  return {
    animated: state === "active",
    style: {
      stroke: state === "done" ? DONE : state === "active" ? ACTIVE : "#9ca3af",
      strokeWidth: state === "idle" ? 1.5 : 2.5,
    },
  };
}

function stageStatesForJob(input: MissionFlowInput): {
  labels: string[];
  states: MissionNodeState[];
} {
  const isPeer = input.job.tier === JOB_TIER.peer;
  const rank = jobRank(input.job.status, isPeer);
  const paid = workerPaid(input);

  if (isPeer) {
    return {
      labels: ["iMessage intake", "Quoted / fund", "Claimed work", "Paid"],
      states: [
        rank > 0 ? "done" : "active",
        rank > 2 ? "done" : rank >= 1 ? "active" : "idle",
        rank > 4 ? "done" : rank >= 3 ? "active" : "idle",
        paid ? "done" : rank >= 5 ? "active" : "idle",
      ],
    };
  }

  return {
    labels: ["iMessage intake", "Terac worker", "Work approved", "Paid"],
    states: [
      rank > 0 ? "done" : "active",
      rank > 3 ? "done" : rank >= 1 ? "active" : "idle",
      rank > 4 ? "done" : rank >= 4 ? "active" : "idle",
      paid ? "done" : rank >= 5 ? "active" : "idle",
    ],
  };
}

/**
 * Pure projection: (job, payment, live balances, tx hashes) → React Flow graph.
 * Peer and expert jobs use different stage lanes; payout is job.paid, not escrow settle.
 */
export function buildJobFlow(input: MissionFlowInput): {
  nodes: MissionNode[];
  edges: Edge[];
} {
  const funded = escrowFunded(input);
  const paid = workerPaid(input);
  const { labels, states: stageStates } = stageStatesForJob(input);

  const nodes: MissionNode[] = [
    stageNode("stage-intake", { x: 0, y: 0 }, labels[0], stageStates[0]),
    stageNode("stage-terac", { x: 190, y: 0 }, labels[1], stageStates[1]),
    stageNode("stage-review", { x: 380, y: 0 }, labels[2], stageStates[2]),
    stageNode("stage-paid", { x: 570, y: 0 }, labels[3], stageStates[3]),
  ];

  const requesterState: MissionNodeState = funded
    ? "done"
    : input.requesterAddress
      ? "active"
      : "idle";
  const agentState: MissionNodeState = paid
    ? "done"
    : funded || input.isPayingOut
      ? "active"
      : "idle";
  const workerState: MissionNodeState = paid
    ? "done"
    : input.isPayingOut
      ? "active"
      : "idle";

  nodes.push(
    walletNode("wallet-requester", { x: 0, y: 150 }, {
      title: "Requester",
      subtitle: "Dynamic embedded wallet",
      address: input.requesterAddress,
      balances: input.requesterAddress
        ? input.balances[input.requesterAddress]
        : undefined,
      state: requesterState,
      explorerUrl: input.requesterAddress
        ? explorerAddressUrl(input.requesterAddress)
        : undefined,
    }),
    walletNode("wallet-agent", { x: 280, y: 150 }, {
      title: "Agent escrow",
      subtitle: "Cascade agent wallet (hold)",
      address: input.agentAddress,
      balances: input.agentAddress ? input.balances[input.agentAddress] : undefined,
      state: agentState,
      explorerUrl: input.agentAddress
        ? explorerAddressUrl(input.agentAddress)
        : undefined,
    }),
    walletNode("wallet-worker", { x: 560, y: 150 }, {
      title: "Worker",
      subtitle: "Paid on approve",
      address: input.workerAddress,
      balances: input.workerAddress
        ? input.balances[input.workerAddress]
        : undefined,
      state: workerState,
      explorerUrl: input.workerAddress
        ? explorerAddressUrl(input.workerAddress)
        : undefined,
    })
  );

  const stageEdgeState = (i: number): MissionNodeState =>
    stageStates[i + 1] === "done"
      ? "done"
      : stageStates[i + 1] === "active"
        ? "active"
        : "idle";

  const escrowEdgeState: MissionNodeState = funded
    ? "done"
    : input.payment && input.job.status !== JOB_STATUS.paid
      ? "active"
      : "idle";
  const payoutEdgeState: MissionNodeState = paid
    ? "done"
    : input.isPayingOut
      ? "active"
      : "idle";

  const edges: Edge[] = [
    ...[0, 1, 2].map((i) => ({
      id: `stage-e${i}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      ...edgeStyle(stageEdgeState(i)),
    })),
    {
      id: "escrow-edge",
      source: "wallet-requester",
      target: "wallet-agent",
      label: input.escrowTxHash
        ? `${input.escrowTxHash.slice(0, 10)}…`
        : funded
          ? "escrow held"
          : "USDC escrow",
      ...(input.escrowTxHash
        ? { data: { txUrl: explorerTxUrl(input.escrowTxHash) } }
        : {}),
      ...edgeStyle(escrowEdgeState),
    },
    {
      id: "payout-edge",
      source: "wallet-agent",
      target: "wallet-worker",
      label: input.payoutTxHash
        ? `${input.payoutTxHash.slice(0, 10)}…`
        : paid
          ? "worker paid"
          : "release on approve",
      ...(input.payoutTxHash
        ? { data: { txUrl: explorerTxUrl(input.payoutTxHash) } }
        : {}),
      ...edgeStyle(payoutEdgeState),
    },
  ];

  return { nodes, edges };
}
