import { JOB_STATUS, type JobStatus } from "@/utils/schema/job";

/**
 * Customer-facing wording for a job's state. The database values are pipeline
 * vocabulary ("in_review", "payment_pending"); a requester should read what is
 * happening to their request, not the name of a state machine node.
 */
const STATUS_COPY: Record<JobStatus, { label: string; detail: string }> = {
  [JOB_STATUS.intake]: {
    label: "Being triaged",
    detail: "Cascade is working out who should handle this.",
  },
  [JOB_STATUS.quoted]: {
    label: "Waiting on you",
    detail: "Fund escrow to start the work.",
  },
  [JOB_STATUS.draftReady]: {
    label: "Waiting on you",
    detail: "Fund escrow to start the work.",
  },
  [JOB_STATUS.funded]: {
    label: "Finding someone",
    detail: "Escrow is held. Matching you with a worker now.",
  },
  [JOB_STATUS.claimed]: {
    label: "In progress",
    detail: "Someone picked this up and is working on it.",
  },
  [JOB_STATUS.launched]: {
    label: "Live with experts",
    detail: "Your brief is out to verified specialists.",
  },
  [JOB_STATUS.inReview]: {
    label: "Ready for review",
    detail: "Work came back — approve it in your Messages thread.",
  },
  [JOB_STATUS.delivered]: {
    label: "Ready for review",
    detail: "Work came back — approve it in your Messages thread.",
  },
  [JOB_STATUS.approved]: {
    label: "Approved",
    detail: "Releasing payout to the worker.",
  },
  [JOB_STATUS.paymentPending]: {
    label: "Waiting on you",
    detail: "Approve the charge to release payment.",
  },
  [JOB_STATUS.paid]: {
    label: "Done",
    detail: "Paid out and closed.",
  },
  [JOB_STATUS.cancelled]: {
    label: "Cancelled",
    detail: "Nothing was charged.",
  },
};

export function jobStatusCopy(status: JobStatus) {
  return STATUS_COPY[status] ?? STATUS_COPY[JOB_STATUS.intake];
}

/** Jobs the requester has to act on get pulled to the top of the list. */
export function needsRequesterAction(status: JobStatus): boolean {
  return (
    status === JOB_STATUS.quoted ||
    status === JOB_STATUS.draftReady ||
    status === JOB_STATUS.paymentPending ||
    status === JOB_STATUS.inReview ||
    status === JOB_STATUS.delivered
  );
}
