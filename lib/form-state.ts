/**
 * Shared form-state shape for the auth server actions.
 *
 * This lives outside actions/auth.ts on purpose: a "use server" module may only
 * export async functions, so a plain const initial-state object cannot live
 * there. Keeping it here also means client forms import the initial state
 * without pulling in the action module's server-only dependencies.
 */
export type AuthFormState = { error: string | null };

export const EMPTY_FORM_STATE: AuthFormState = { error: null };

/** Result of creating an employee. The temp password is shown exactly once. */
export type NewEmployeeState = {
  error: string | null;
  created?: {
    fullName: string;
    loginId: string;
    tempPassword: string;
    profileId: string;
  };
};

export const EMPTY_NEW_EMPLOYEE_STATE: NewEmployeeState = { error: null };

/** Result of an inline profile edit. */
export type EditState = { error: string | null; saved: boolean };

export const EMPTY_EDIT_STATE: EditState = { error: null, saved: false };

/** Result of a punch mutation (check in / out / regularize). */
export type PunchState = { error: string | null };

/**
 * Result of submitting a leave request.
 *
 * `autoApproved` is separate from `submitted` because the two outcomes need
 * different words: a pending request means "HR will look at this", an
 * auto-approved one means "you are already off". Collapsing them into one
 * success flag made the modal lie in one of the two cases.
 */
export type LeaveRequestState = {
  error: string | null;
  submitted: boolean;
  autoApproved: boolean;
};

export const EMPTY_LEAVE_REQUEST_STATE: LeaveRequestState = {
  error: null,
  submitted: false,
  autoApproved: false,
};

/** Result of an approve/reject decision. */
export type LeaveDecisionState = { error: string | null; decided: boolean };

export const EMPTY_LEAVE_DECISION_STATE: LeaveDecisionState = { error: null, decided: false };
