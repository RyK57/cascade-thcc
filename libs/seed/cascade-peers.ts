/**
 * Hardcoded Cascade demo peers (option B).
 * These E.164 numbers must already have texted the Linq number
 * (inbound-first sandbox) before claim broadcasts succeed.
 * Lat/lng are near a demo campus for location-ranked peer jobs.
 */
export const CASCADE_PEERS = [
  {
    phone: "+15122263512",
    fullName: "Alex Peer",
    email: "alex.peer@cascade.local",
    trustScore: 82,
    creditBalance: 100,
    lastLat: 37.4275,
    lastLng: -122.1697,
  },
  {
    phone: "+15129377003",
    fullName: "Blake Peer",
    email: "blake.peer@cascade.local",
    trustScore: 74,
    creditBalance: 100,
    lastLat: 37.429,
    lastLng: -122.172,
  },
  {
    phone: "+16502838667",
    fullName: "Casey Peer",
    email: "casey.peer@cascade.local",
    trustScore: 91,
    creditBalance: 100,
    lastLat: 37.424,
    lastLng: -122.166,
  },
] as const;

export type CascadePeerSeed = (typeof CASCADE_PEERS)[number];
