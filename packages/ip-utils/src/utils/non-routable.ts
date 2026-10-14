/**
 * IPv4 ranges that `isRoutableIP` treats as non-routable, in CIDR notation.
 *
 * Exported so other packages (data-mate's SQL translation of `isRoutableIP`)
 * can classify addresses against the same list instead of keeping a copy.
*/
export const NON_ROUTABLE_IPV4_CIDRS: readonly string[] = Object.freeze([
    '0.0.0.0/8', // unspecified
    '10.0.0.0/8', // private
    '100.64.0.0/10', // carrier-grade NAT
    '127.0.0.0/8', // loopback
    '169.254.0.0/16', // link-local
    '172.16.0.0/12', // private
    '192.0.0.0/24', // reserved (IETF protocol)
    '192.0.2.0/24', // documentation (TEST-NET-1)
    '192.31.196.0/24', // AS112-v4 (RFC 7534)
    '192.52.193.0/24', // AMT (RFC 7450)
    '192.88.99.0/24', // 6to4 relay anycast (deprecated)
    '192.168.0.0/16', // private
    '192.175.48.0/24', // AS112-v4 (RFC 7535)
    '198.18.0.0/15', // benchmarking
    '198.51.100.0/24', // documentation (TEST-NET-2)
    '203.0.113.0/24', // documentation (TEST-NET-3)
    '224.0.0.0/8', // multicast (restricted block)
    '240.0.0.0/4', // reserved (class E)
    '255.255.255.255/32', // broadcast
]);

/** IPv6 ranges that `isRoutableIP` treats as non-routable, in CIDR notation. */
export const NON_ROUTABLE_IPV6_CIDRS: readonly string[] = Object.freeze([
    '::/128', // unspecified
    '::1/128', // loopback
    '64:ff9b::/96', // RFC 6052 NAT64
    '64:ff9b:1::/48', // RFC 8215 local NAT64
    '100::/64', // discard (RFC 6666)
    'fc00::/7', // unique local
    'fe80::/10', // link-local
    'ff00::/8', // multicast
    '::ffff:0:0/96', // IPv4-mapped
    '2001::/23', // IANA special (includes teredo, benchmarking, etc.)
    '2001:db8::/32', // documentation (RFC 3849)
    '2002::/16', // 6to4
    '2620:4f:8000::/48', // AS112-v6
]);
