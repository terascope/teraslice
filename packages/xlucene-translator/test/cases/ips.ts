import type { QueryCase } from './interfaces.js';
import { allExcept } from './corpus.js';

/**
 * Queries over an `ip` column, which holds one address per record.
 *
 * **The corpus mixes IPv4 and IPv6 on purpose.** Elasticsearch stores an `ip` as 128 bits
 * with IPv4 mapped into IPv6 and orders by that value; `INET` in both SQL engines orders by
 * (family, address), so every IPv4 address sorts before every IPv6 one. `ip:>="172.16.0.0"`
 * is the case that separates them: `::1` is BELOW a mapped IPv4 address and `2001:db8::1` is
 * above it, and an emitter comparing families first would return both or neither.
 *
 * The bracket spellings are here for the same reason they are in the numeric cases - an
 * address range has two independent ends - and `10.0.0.1`, `10.0.0.9` and `10.0.0.17` sit on
 * the bounds so that each spelling answers differently.
*/
export const ipCases: readonly QueryCase[] = [
    ['an address', 'ip:"10.0.0.1"', ['01', '12']],
    ['a CIDR block, which asks what is inside it', 'ip:"10.0.0.0/30"', ['01', '12']],
    // the mapped spelling is the same address, and has to find a record stored as IPv4
    ['the IPv4-mapped spelling of an address', 'ip:"::ffff:10.0.0.1"', ['01', '12']],
    ['an IPv6 address', 'ip:"2001:db8::1"', ['06']],
    ['[ TO ], both bounds included', 'ip:["10.0.0.1" TO "10.0.0.17"]', ['01', '02', '09', '12']],
    ['{ TO }, neither bound included', 'ip:{"10.0.0.1" TO "10.0.0.17"}', ['02']],
    ['[ TO }, the upper bound excluded', 'ip:["10.0.0.1" TO "10.0.0.17"}', ['01', '02', '12']],
    ['{ TO ], the lower bound excluded', 'ip:{"10.0.0.1" TO "10.0.0.17"]', ['02', '09']],
    // ::1 is below every mapped IPv4 address and 2001:db8::1 is above every one of them
    ['>= an address, across both families', 'ip:>="172.16.0.0"', ['03', '04', '06', '10']],
    ['< an address, across both families', 'ip:<"8.8.8.8"', ['05', '08']],
    // `ip:[* TO *]` cannot be written - see the parser limitation pinned in the parity spec
    ['every record that has an address', '_exists_:ip', allExcept('11')],
    ['a negated CIDR block', 'NOT ip:"10.0.0.0/30"', allExcept('01', '12')],
    ['two CIDR blocks OR-ed', 'ip:"10.0.0.0/30" OR ip:"8.8.4.0/24"', ['01', '08', '12']],
    ['a CIDR block AND a term', 'ip:"10.0.0.0/24" AND active:true', ['01', '12']],
];

/**
 * Queries over an `ip_range` column, which holds a BLOCK per record.
 *
 * Every comparison runs the other way round from the `ip` cases: the question is whether the
 * stored block and the queried range OVERLAP, so a `/113` block matches a `/112` query and an
 * address matches the block that contains it.
 *
 * **An excluded bound still has to be excluded.** `{"10.0.0.3" TO "10.0.0.16"}` is the
 * addresses `10.0.0.4` through `10.0.0.15`, which touches neither the block ending at
 * `10.0.0.3` nor the one starting at `10.0.0.16` - while the inclusive spelling of the same
 * two bounds touches both. Nothing about an overlap makes that distinction for itself.
*/
export const ipRangeCases: readonly QueryCase[] = [
    ['an address, which finds the block containing it', 'net:"10.0.0.9"', ['02']],
    ['the IPv4-mapped spelling of that address', 'net:"::ffff:10.0.0.9"', ['02']],
    ['a CIDR block, which finds the blocks overlapping it', 'net:"10.0.0.0/30"', ['01', '12']],
    ['a wider CIDR block, which overlaps more of them', 'net:"10.0.0.0/28"', ['01', '02', '12']],
    ['an IPv6 address', 'net:"::1"', ['05']],
    ['[ TO ], both bounds included', 'net:["10.0.0.3" TO "10.0.0.16"]', ['01', '02', '09', '12']],
    ['{ TO }, neither bound included', 'net:{"10.0.0.3" TO "10.0.0.16"}', ['02']],
    ['[ TO }, the upper bound excluded', 'net:["10.0.0.3" TO "10.0.0.16"}', ['01', '02', '12']],
    ['{ TO ], the lower bound excluded', 'net:{"10.0.0.3" TO "10.0.0.16"]', ['02', '09']],
    ['>= an address, across both families', 'net:>="192.168.0.0"', ['03', '06', '10']],
    ['<= an address, across both families', 'net:<="10.0.0.3"', ['01', '05', '07', '08', '12']],
    ['neither bound', 'net:[* TO *]', allExcept('11')],
    ['a negated block', 'NOT net:"10.0.0.0/30"', allExcept('01', '12')],
    ['a block AND a term', 'net:"10.0.0.0/28" AND active:true', ['01', '12']],
];
