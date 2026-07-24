import type { Edge, Node } from "@xyflow/react";
import { BRAND } from "@/lib/constants/branding";
import { explorerAddressUrl, explorerTxUrl } from "@/libs/dynamic/usdc";
import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import type { MissionFlowInput, MissionNodeData, MissionNodeState } from "./flow-types";

const ACTIVE = BRAND.accent; // #E8501F
const DONE = BRAND.secondary; // #6F68FF

type MissionNode = Node<MissionNodeData>;

/** Ranks for "has the job reached stage X yet". */
const JOB_STAGE_ORDER = [
  JOB_STATUS.intake,
  JOB_STATUS.draftReady,
  JOB_STATUS.launched,
  JOB_STATUS.inReview,
  JOB_STATUS.paymentPending,
  JOB_STATUS.paid,
] as const;

function jobRank(status: string): number {
  const index = JOB_STAGE_ORDER.indexOf(status as (typeof JOB_STAGE_ORDER)[number]);
  return index === -1 ? 0 : index;
}

/** Payment progress: has escrow been funded / has the worker been paid. */
function escrowFunded(input: MissionFlowInput): boolean {
  const status = input.payment?.status;
  return status === PAYMENT_STATUS.authorized || status === PAYMENT_STATUS.settled;
}

function workerPaid(input: MissionFlowInput): boolean {
  return input.payment?.status === PAYMENT_STATUS.settled;
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

/**
 * Pure projection: (job, payment, live balances, tx hashes) → React Flow graph.
 * Everything on the canvas derives from real data — nothing is hard-coded.
 */
export function buildJobFlow(input: MissionFlowInput): {
  nodes: MissionNode[];
  edges: Edge[];
} {
  const rank = jobRank(input.job.status);
  const funded = escrowFunded(input);
  const paid = workerPaid(input);

  // --- Stage lane (top): job lifecycle ---
  const stageStates: MissionNodeState[] = [
    rank > 0 ? "done" : "active", // intake
    rank > 2 ? "done" : rank >= 1 ? "active" : "idle", // terac launch (draft/launched)
    rank > 3 ? "done" : rank >= 3 ? "active" : "idle", // work approved (in_review)
    input.job.status === JOB_STATUS.paid
      ? "done"
      : rank >= 4
        ? "active"
        : "idle", // payment
  ];

  const nodes: MissionNode[] = [
    stageNode("stage-intake", { x: 0, y: 0 }, "iMessage intake", stageStates[0]),
    stageNode("stage-terac", { x: 190, y: 0 }, "Terac worker", stageStates[1]),
    stageNode("stage-review", { x: 380, y: 0 }, "Work approved", stageStates[2]),
    stageNode("stage-paid", { x: 570, y: 0 }, "Paid", stageStates[3]),
  ];

  // --- Wallet lane (bottom): the money ---
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
      subtitle: "Dynamic server wallet (MPC)",
      address: input.agentAddress,
      balances: input.agentAddress ? input.balances[input.agentAddress] : undefined,
      state: agentState,
      explorerUrl: input.agentAddress
        ? explorerAddressUrl(input.agentAddress)
        : undefined,
    }),
    walletNode("wallet-worker", { x: 560, y: 150 }, {
      title: "Worker",
      subtitle: "Payout destination",
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

  // --- Edges ---
  const stageEdgeState = (i: number): MissionNodeState =>
    stageStates[i + 1] === "done"
      ? "done"
      : stageStates[i + 1] === "active"
        ? "active"
        : "idle";

  const escrowEdgeState: MissionNodeState = funded
    ? "done"
    : input.payment && !input.job.status.startsWith("paid")
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
          ? "escrow funded"
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
          : "autonomous payout",
      ...(input.payoutTxHash
        ? { data: { txUrl: explorerTxUrl(input.payoutTxHash) } }
        : {}),
      ...edgeStyle(payoutEdgeState),
    },
  ];

  return { nodes, edges };
}
