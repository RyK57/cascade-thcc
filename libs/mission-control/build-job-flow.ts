import type { Edge, Node } from "@xyflow/react";
import { BRAND } from "@/lib/constants/branding";
import { explorerAddressUrl } from "@/libs/dynamic/sandbox";
import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import type { MissionFlowInput, MissionNodeData, MissionNodeState } from "./flow-types";

const ACTIVE = BRAND.accent;
const DONE = BRAND.secondary;

type MissionNode = Node<MissionNodeData>;

/**
 * Both lifecycles collapse onto one rank scale:
 * peer path:   intake → quoted → funded → claimed → delivered → approved → paid
 * expert path: intake → quoted(draft_ready) → launched → in_review → payment_pending → paid
 */
const RANKS: Record<string, number> = {
  [JOB_STATUS.intake]: 0,
  [JOB_STATUS.quoted]: 1,
  [JOB_STATUS.draftReady]: 1,
  [JOB_STATUS.funded]: 2,
  [JOB_STATUS.claimed]: 3,
  [JOB_STATUS.launched]: 3,
  [JOB_STATUS.delivered]: 4,
  [JOB_STATUS.inReview]: 4,
  [JOB_STATUS.approved]: 5,
  [JOB_STATUS.paymentPending]: 5,
  [JOB_STATUS.paid]: 6,
  [JOB_STATUS.cancelled]: 0,
};

/**
 * Stage pills on the top lane: [id, label, doneAt, activeFrom].
 * done when rank >= doneAt; active when rank >= activeFrom; idle otherwise.
 * Achieved-state stages (funded/delivered) jump idle → done; activity stages
 * (quoted-awaiting-funding, working, payout) hold "active" while in progress.
 */
const STAGES: Array<[string, string, number, number]> = [
  ["stage-intake", "iMessage intake", 1, 0],
  ["stage-quoted", "Quoted", 2, 1],
  ["stage-funded", "Escrow funded", 2, 2],
  ["stage-working", "Worker on it", 4, 2],
  ["stage-delivered", "Delivered", 4, 4],
  ["stage-paid", "Paid", 6, 4],
];

function stageState(
  rank: number,
  doneAt: number,
  activeFrom: number
): MissionNodeState {
  if (rank >= doneAt) return "done";
  if (rank >= activeFrom) return "active";
  return "idle";
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
 * Pure projection: (job, payment, live balances) → React Flow graph.
 * Everything on the canvas derives from real data — nothing is hard-coded.
 */
export function buildJobFlow(input: MissionFlowInput): {
  nodes: MissionNode[];
  edges: Edge[];
} {
  const rank = RANKS[input.job.status] ?? 0;
  const settled = input.payment?.status === PAYMENT_STATUS.settled;
  const escrowFunded = settled || rank >= 2;
  const workerPaid = input.job.status === JOB_STATUS.paid;

  const nodes: MissionNode[] = STAGES.map(
    ([id, label, doneAt, activeFrom], index) => ({
      id,
      type: "stage",
      position: { x: index * 165, y: 0 },
      data: {
        kind: "stage",
        title: label,
        state: stageState(rank, doneAt, activeFrom),
      } as MissionNodeData,
    })
  );

  // --- Wallet lane ---
  const requesterState: MissionNodeState = escrowFunded
    ? "done"
    : input.requesterAddress
      ? "active"
      : "idle";
  const treasuryState: MissionNodeState = workerPaid
    ? "done"
    : escrowFunded
      ? "active"
      : "idle";
  const workerState: MissionNodeState = workerPaid
    ? "done"
    : rank >= 3
      ? "active"
      : "idle";

  nodes.push(
    walletNode("wallet-requester", { x: 40, y: 140 }, {
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
    walletNode("wallet-treasury", { x: 360, y: 140 }, {
      title: "Cascade treasury",
      subtitle: "Agent escrow (MPC server wallet)",
      address: input.treasuryAddress,
      balances: input.treasuryAddress
        ? input.balances[input.treasuryAddress]
        : undefined,
      state: treasuryState,
      explorerUrl: input.treasuryAddress
        ? explorerAddressUrl(input.treasuryAddress)
        : undefined,
    }),
    walletNode("wallet-worker", { x: 680, y: 140 }, {
      title: "Worker payout",
      subtitle: "Peer credits / expert USDC",
      state: workerState,
    })
  );

  // --- Edges ---
  const escrowEdgeState: MissionNodeState = escrowFunded
    ? "done"
    : input.payment
      ? "active"
      : "idle";
  const payoutEdgeState: MissionNodeState = workerPaid
    ? "done"
    : rank >= 4
      ? "active"
      : "idle";

  const edges: Edge[] = [
    ...STAGES.slice(0, -1).map(([id], i) => {
      const nextState = nodes[i + 1].data.state as MissionNodeState;
      return {
        id: `stage-e${i}`,
        source: id,
        target: STAGES[i + 1][0],
        ...edgeStyle(nextState),
      };
    }),
    {
      id: "escrow-edge",
      source: "wallet-requester",
      target: "wallet-treasury",
      label: escrowFunded ? "escrow funded" : "USDC escrow",
      ...edgeStyle(escrowEdgeState),
    },
    {
      id: "payout-edge",
      source: "wallet-treasury",
      target: "wallet-worker",
      label: workerPaid ? "worker paid" : "autonomous payout",
      ...edgeStyle(payoutEdgeState),
    },
  ];

  return { nodes, edges };
}
