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
