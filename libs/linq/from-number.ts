/**
 * The Linq line's own number, required whenever Cascade opens a new chat
 * instead of replying in an existing one (peer broadcasts, first sign-in
 * codes, the post-verification intro).
 */
export function getLinqFromNumber(): string | undefined {
  return (
    process.env.LINQ_FROM_NUMBER?.trim() ||
    process.env.LINQ_PHONE_NUMBER?.trim() ||
    undefined
  );
}
