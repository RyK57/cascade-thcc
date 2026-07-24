/**
 * Hardcoded Cascade demo peers (option B).
 * These E.164 placeholders must already have texted the Linq number
 * (inbound-first sandbox) before claim broadcasts succeed.
 * Lat/lng are near a demo campus for location-ranked peer jobs.
 */
export const CASCADE_PEERS = [
  {
    phone: "+15550001001",
    fullName: "Alex Peer",
    email: "alex.peer@cascade.local",
    trustScore: 82,
    creditBalance: 0,
    lastLat: 37.4275,
    lastLng: -122.1697,
  },
  {
    phone: "+15550001002",
    fullName: "Blake Peer",
    email: "blake.peer@cascade.local",
    trustScore: 74,
    creditBalance: 0,
    lastLat: 37.429,
    lastLng: -122.172,
  },
  {
    phone: "+15550001003",
    fullName: "Casey Peer",
    email: "casey.peer@cascade.local",
    trustScore: 91,
    creditBalance: 0,
    lastLat: 37.424,
    lastLng: -122.166,
  },
  {
    phone: "+15550001004",
    fullName: "Drew Peer",
    email: "drew.peer@cascade.local",
    trustScore: 66,
    creditBalance: 0,
    lastLat: 37.44,
    lastLng: -122.15,
  },
] as const;

export type CascadePeerSeed = (typeof CASCADE_PEERS)[number];
