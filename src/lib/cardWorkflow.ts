// Pure state-machine logic for the Module 2 card approval workflow
// (SRS §5.3-5.4, the 9-phase pipeline). No DB dependency — the API route
// layer is responsible for persisting the result of each transition.

export type CardRequestStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PENDING_CANDIDATE"
  | "CANDIDATE_CHANGES"
  | "CANDIDATE_APPROVED"
  | "FINALIZED"
  | "DELIVERED";

export type CardEvent =
  | "SUBMIT"              // HR submits a draft
  | "ADMIN_APPROVE"        // Admin approves -> auto-advances to PENDING_CANDIDATE
  | "ADMIN_REQUEST_CHANGES"
  | "RESUBMIT"             // HR resubmits after changes requested
  | "CANDIDATE_APPROVE"
  | "CANDIDATE_REQUEST_CHANGES"
  | "RESEND_TO_CANDIDATE"  // after candidate changes are addressed
  | "FINALIZE";

const TRANSITIONS: Record<CardRequestStatus, Partial<Record<CardEvent, CardRequestStatus>>> = {
  DRAFT:               { SUBMIT: "PENDING_APPROVAL" },
  PENDING_APPROVAL:    { ADMIN_APPROVE: "PENDING_CANDIDATE", ADMIN_REQUEST_CHANGES: "CHANGES_REQUESTED" },
  CHANGES_REQUESTED:   { RESUBMIT: "PENDING_APPROVAL" },
  APPROVED:            { }, // pass-through state, system auto-advances immediately (see ADMIN_APPROVE above)
  PENDING_CANDIDATE:   { CANDIDATE_APPROVE: "CANDIDATE_APPROVED", CANDIDATE_REQUEST_CHANGES: "CANDIDATE_CHANGES" },
  CANDIDATE_CHANGES:   { RESEND_TO_CANDIDATE: "PENDING_CANDIDATE" },
  CANDIDATE_APPROVED:  { FINALIZE: "DELIVERED" },
  FINALIZED:           { },
  DELIVERED:           { },
};

export class InvalidCardTransitionError extends Error {
  constructor(public from: CardRequestStatus, public event: CardEvent) {
    super(`Cannot apply event "${event}" to a card request in status "${from}"`);
    this.name = "InvalidCardTransitionError";
  }
}

/** Returns the next status, or throws if the transition isn't legal from here. */
export function nextCardStatus(current: CardRequestStatus, event: CardEvent): CardRequestStatus {
  const next = TRANSITIONS[current]?.[event];
  if (!next) throw new InvalidCardTransitionError(current, event);
  return next;
}

export function availableEvents(current: CardRequestStatus): CardEvent[] {
  return Object.keys(TRANSITIONS[current] ?? {}) as CardEvent[];
}

/** The fixed left-to-right pipeline order used for the progress UI. */
export const PIPELINE_ORDER: CardRequestStatus[] = [
  "DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED",
  "PENDING_CANDIDATE", "CANDIDATE_CHANGES", "CANDIDATE_APPROVED", "FINALIZED", "DELIVERED",
];
