/**
 * Cascade demo peer seeds. Phone numbers come from the CASCADE_PEER_PHONES
 * env var (comma-separated E.164) so real numbers never live in the repo.
 * Each number must already have texted the Linq line (inbound-first sandbox)
 * before claim broadcasts succeed. Lat/lng are near a demo campus for
 * location-ranked peer jobs.
 */
const PEER_PROFILES = [
  {
    fullName: "Alex Peer",
    email: "alex.peer@cascade.local",
    trustScore: 82,
    creditBalance: 100,
    lastLat: 37.4275,
    lastLng: -122.1697,
  },
  {
    fullName: "Blake Peer",
    email: "blake.peer@cascade.local",
    trustScore: 74,
    creditBalance: 100,
    lastLat: 37.429,
    lastLng: -122.172,
  },
  {
    fullName: "Casey Peer",
    email: "casey.peer@cascade.local",
    trustScore: 91,
    creditBalance: 100,
    lastLat: 37.424,
    lastLng: -122.166,
  },
] as const;

export interface CascadePeerSeed {
  phone: string;
  fullName: string;
  email: string;
  trustScore: number;
  creditBalance: number;
  lastLat: number;
  lastLng: number;
}

export const CASCADE_PEERS: CascadePeerSeed[] = (
  process.env.CASCADE_PEER_PHONES ?? ""
)
  .split(",")
  .map((phone) => phone.trim())
  .filter((phone) => /^\+\d{7,15}$/.test(phone))
  .slice(0, PEER_PROFILES.length)
  .map((phone, index) => ({ phone, ...PEER_PROFILES[index] }));
