/** Clears the member cookie and, if it came with sign-in, the admin one. */
export async function signOut(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  if (!response.ok) throw new Error(`logout ${response.status}`);
}
