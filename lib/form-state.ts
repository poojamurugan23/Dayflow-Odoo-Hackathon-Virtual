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
