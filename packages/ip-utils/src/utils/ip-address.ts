// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)';
const IPV4_RE = new RegExp(
    `^${IPV4_OCTET}\\.${IPV4_OCTET}\\.${IPV4_OCTET}\\.${IPV4_OCTET}$`,
);

/** Parse dotted-quad IPv4 string → BigInt. Returns null on failure. */
function parseIPv4Int(input: string): bigint | null {
    if (!IPV4_RE.test(input)) return null;

    const parts = input.split('.');
    let n = 0n;

    for (const p of parts) {
        n = (n << 8n) | BigInt(parseInt(p, 10));
    }

    return n;
}

/** Convert 32-bit BigInt → dotted-quad string. */
function intToIPv4String(n: bigint): string {
    return [
        (n >> 24n) & 0xffn,
        (n >> 16n) & 0xffn,
        (n >> 8n) & 0xffn,
        n & 0xffn,
    ]
        .map(String)
        .join('.');
}

/**
 * Parse IPv6 string → 128-bit BigInt.
 * Handles: compressed (::), embedded IPv4 (::a.b.c.d and ::ffff:a.b.c.d),
 * scope IDs (%zone), uppercase.
 * Per ipaddr.js behaviour: ::a.b.c.d is rewritten as ::ffff:a.b.c.d.
 * Returns null on failure.
 */
function parseIPv6Int(raw: string): bigint | null {
    // Strip scope ID
    const scopeIdx = raw.indexOf('%');
    const input = scopeIdx >= 0 ? raw.slice(0, scopeIdx) : raw;
    const s = input.toLowerCase();

    // Detect embedded IPv4 in last position
    // Match optional leading groups + dotted-quad tail
    const embeddedIPv4Re = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/;
    const embeddedMatch = s.match(embeddedIPv4Re);

    let normalized = s;

    if (embeddedMatch) {
        const prefix = embeddedMatch[1]; // everything up to and including last ':'
        const v4str = embeddedMatch[2];
        const v4int = parseIPv4Int(v4str);
        if (v4int === null) return null;
        const high16 = (v4int >> 16n) & 0xffffn;
        const low16 = v4int & 0xffffn;
        const v4hex = `${high16.toString(16)}:${low16.toString(16)}`;

        normalized = `${prefix}${v4hex}`;
    }

    // Expand :: compression
    const halves = normalized.split('::');
    if (halves.length > 2) return null; // multiple :: not allowed

    let groups: string[];

    if (halves.length === 2) {
        const left = halves[0] ? halves[0].split(':') : [];
        const right = halves[1] ? halves[1].split(':') : [];
        const missing = 8 - left.length - right.length;
        if (missing <= 0) return null;
        groups = [...left, ...Array(missing).fill('0'), ...right];
    } else {
        groups = normalized.split(':');
    }

    if (groups.length !== 8) return null;

    let n = 0n;
    for (const g of groups) {
        if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
        n = (n << 16n) | BigInt(parseInt(g, 16));
    }
    return n;
}

/**
 * Detect IPv6 scope ID for preservation in toString.
 */
function extractScopeId(raw: string): string | undefined {
    const idx = raw.indexOf('%');
    return idx >= 0 ? raw.slice(idx + 1) : undefined;
}

/** Convert 128-bit BigInt → compressed IPv6 string (RFC 5952). */
function intToIPv6String(n: bigint): string {
    const groups: number[] = [];

    for (let i = 7; i >= 0; i--) {
        groups.push(Number((n >> BigInt(i * 16)) & 0xffffn));
    }

    const hex = groups.map((g) => g.toString(16));

    // Find longest run of consecutive zero groups for :: compression
    let bestStart = -1;
    let bestLen = 0;
    let curStart = -1;
    let curLen = 0;

    for (let i = 0; i < 8; i++) {
        if (groups[i] === 0) {
            if (curStart < 0) {
                curStart = i;
                curLen = 0;
            }
            curLen++;
            if (curLen > bestLen) {
                bestLen = curLen;
                bestStart = curStart;
            }
        } else {
            curStart = -1;
            curLen = 0;
        }
    }

    if (bestLen < 2) {
        return hex.join(':');
    }

    const left = hex.slice(0, bestStart).join(':');
    const right = hex.slice(bestStart + bestLen).join(':');
    return `${left}::${right}`;
}

// ---------------------------------------------------------------------------
// Private routing range tables (replaces ipaddr.js range() + restricted lists)
// ---------------------------------------------------------------------------

interface IPv4Range {
    lo: bigint;
    hi: bigint;
}

function cidr4(
    a: number,
    b: number,
    c: number,
    d: number,
    prefix: number,
): IPv4Range {
    const base = BigInt(((a * 256 + b) * 256 + c) * 256 + d);
    const hostBits = BigInt(32 - prefix);
    const mask = ((1n << 32n) - 1n) ^ ((1n << hostBits) - 1n);
    return { lo: base & mask, hi: (base & mask) | ((1n << hostBits) - 1n) };
}

// All IPv4 ranges considered non-routable
const NON_ROUTABLE_IPV4: IPv4Range[] = [
    cidr4(0, 0, 0, 0, 8), // unspecified
    cidr4(10, 0, 0, 0, 8), // private
    cidr4(100, 64, 0, 0, 10), // carrier-grade NAT
    cidr4(127, 0, 0, 0, 8), // loopback
    cidr4(169, 254, 0, 0, 16), // link-local
    cidr4(172, 16, 0, 0, 12), // private
    cidr4(192, 0, 0, 0, 24), // reserved (IETF protocol)
    cidr4(192, 0, 2, 0, 24), // documentation (TEST-NET-1)
    cidr4(192, 31, 196, 0, 24), // AS112-v4 (RFC 7534)
    cidr4(192, 52, 193, 0, 24), // AMT (RFC 7450)
    cidr4(192, 88, 99, 0, 24), // 6to4 relay anycast (deprecated)
    cidr4(192, 168, 0, 0, 16), // private
    cidr4(192, 175, 48, 0, 24), // AS112-v4 (RFC 7535)
    cidr4(198, 18, 0, 0, 15), // benchmarking
    cidr4(198, 51, 100, 0, 24), // documentation (TEST-NET-2)
    cidr4(203, 0, 113, 0, 24), // documentation (TEST-NET-3)
    cidr4(224, 0, 0, 0, 8), // multicast (restricted block)
    cidr4(240, 0, 0, 0, 4), // reserved (class E)
    cidr4(255, 255, 255, 255, 32), // broadcast
];

interface IPv6Range {
    lo: bigint;
    hi: bigint;
}

function cidr6(groups: number[], prefix: number): IPv6Range {
    let base = 0n;

    for (const g of groups) {
        base = (base << 16n) | BigInt(g);
    }

    const hostBits = BigInt(128 - prefix);
    const mask = ((1n << 128n) - 1n) ^ ((1n << hostBits) - 1n);

    return { lo: base & mask, hi: (base & mask) | ((1n << hostBits) - 1n) };
}

// All IPv6 ranges considered non-routable
const NON_ROUTABLE_IPV6: IPv6Range[] = [
    cidr6([0, 0, 0, 0, 0, 0, 0, 0], 128), // unspecified ::
    cidr6([0, 0, 0, 0, 0, 0, 0, 1], 128), // loopback ::1
    cidr6([0x64, 0xff9b, 0, 0, 0, 0, 0, 0], 96), // RFC 6052 NAT64
    cidr6([0x64, 0xff9b, 1, 0, 0, 0, 0, 0], 48), // RFC 8215 local NAT64
    cidr6([0x100, 0, 0, 0, 0, 0, 0, 0], 64), // discard (RFC 6666)
    cidr6([0xfc00, 0, 0, 0, 0, 0, 0, 0], 7), // unique local (fc00::/7)
    cidr6([0xfe80, 0, 0, 0, 0, 0, 0, 0], 10), // link-local
    cidr6([0xff00, 0, 0, 0, 0, 0, 0, 0], 8), // multicast
    cidr6([0, 0, 0, 0, 0, 0xffff, 0, 0], 96), // IPv4-mapped (::ffff:0:0/96)
    cidr6([0x2001, 0, 0, 0, 0, 0, 0, 0], 23), // IANA special (includes teredo, benchmarking, etc.)
    cidr6([0x2001, 0x0db8, 0, 0, 0, 0, 0, 0], 32), // documentation (RFC 3849)
    cidr6([0x2002, 0, 0, 0, 0, 0, 0, 0], 16), // 6to4
    cidr6([0x2620, 0x4f, 0x8000, 0, 0, 0, 0, 0], 48), // AS112-v6
];

function isInRange(
    n: bigint,
    ranges: Array<{ lo: bigint; hi: bigint }>,
): boolean {
    for (const r of ranges) {
        if (n >= r.lo && n <= r.hi) return true;
    }

    return false;
}

// ---------------------------------------------------------------------------
// IPAddress class
// ---------------------------------------------------------------------------

/** Matches ::a.b.c.d (deprecated IPv4-compatible) — no ffff groups. */
const IPV4_COMPAT_RE = /^::(\d+\.\d+\.\d+\.\d+)(%.*)?$/i;

export class IPAddress {
    readonly version: 4 | 6;
    private readonly _int: bigint;
    private readonly _scopeId: string | undefined;
    /** True when parsed from ::a.b.c.d (deprecated IPv4-compatible) notation. */
    private readonly _isIPv4Compat: boolean;

    private constructor(
        int: bigint,
        version: 4 | 6,
        scopeId?: string,
        isIPv4Compat = false,
    ) {
        this._int = int;
        this.version = version;
        this._scopeId = scopeId;
        this._isIPv4Compat = isIPv4Compat;
    }

    // ---- Static factories --------------------------------------------------

    static of(input: string): IPAddress {
        const result = IPAddress._parse(input);

        if (result === null) {
            throw new TypeError(`"${input}" is not a valid IP address`);
        }

        return result;
    }

    static fromInt(n: bigint, version: 4 | 6): IPAddress {
        return new IPAddress(n, version);
    }

    private static _parse(input: string): IPAddress | null {
        if (typeof input !== 'string') return null;

        // Try IPv4 first (no colon present)
        if (!input.includes(':')) {
            const n = parseIPv4Int(input);
            return n !== null ? new IPAddress(n, 4) : null;
        }

        // IPv6 (may have embedded IPv4, scope ID)
        const scopeId = extractScopeId(input);
        const n = parseIPv6Int(input);

        if (n === null) return null;

        const isIPv4Compat = IPV4_COMPAT_RE.test(input);
        return new IPAddress(n, 6, scopeId, isIPv4Compat);
    }

    // ---- Static validators -------------------------------------------------

    static isValid(input: unknown): input is string {
        return typeof input === 'string' && IPAddress._parse(input) !== null;
    }

    static isIPv4(input: unknown): boolean {
        if (typeof input !== 'string') return false;
        return parseIPv4Int(input) !== null;
    }

    static isIPv6(input: unknown): boolean {
        if (typeof input !== 'string') return false;
        if (!input.includes(':')) return false;

        return parseIPv6Int(input) !== null;
    }

    static ipVersion(input: string): 4 | 6 | undefined {
        if (IPAddress.isIPv4(input)) return 4;
        if (IPAddress.isIPv6(input)) return 6;

        return undefined;
    }

    // ---- Instance methods --------------------------------------------------

    toInt(): bigint {
        return this._int;
    }

    toString(): string {
        if (this.version === 4) {
            return intToIPv4String(this._int);
        }

        const base = intToIPv6String(this._int);

        return this._scopeId ? `${base}%${this._scopeId}` : base;
    }

    /** Normalized full-groups string (no :: compression). Used by reverseIP. */
    toNormalizedString(): string {
        if (this.version === 4) return this.toString();

        const groups: string[] = [];

        for (let i = 7; i >= 0; i--) {
            groups.push(((this._int >> BigInt(i * 16)) & 0xffffn).toString(16));
        }

        return groups.join(':');
    }

    compare(other: IPAddress): -1 | 0 | 1 {
        if (this._int < other._int) return -1;
        if (this._int > other._int) return 1;

        return 0;
    }

    offset(n: bigint): IPAddress {
        return new IPAddress(this._int + n, this.version);
    }

    /**
     * Returns true for ::ffff:a.b.c.d (IPv4-mapped) addresses.
     * Note: ::a.b.c.d is rewritten to ::ffff:a.b.c.d during parsing,
     * so those also return true (matching ipaddr.js behaviour).
     */
    isMappedIPv4(): boolean {
        if (this.version !== 6) return false;
        // ::a.b.c.d (IPv4-compatible, deprecated) — treated as mapped per ipaddr.js
        if (this._isIPv4Compat) return true;
        // IPv4-mapped range: ::ffff:0:0/96
        // First 80 bits must be 0, next 16 bits must be 0xffff
        const high80 = this._int >> 48n;
        const ffff = (this._int >> 32n) & 0xffffn;

        return high80 === 0n && ffff === 0xffffn;
    }

    /** Extract the embedded IPv4 from an IPv4-mapped IPv6 address. */
    toMappedIPv4(): IPAddress {
        if (!this.isMappedIPv4()) {
            throw new Error(
                'input must be an IPv4 address mapped to an IPv6 address',
            );
        }

        return new IPAddress(this._int & 0xffffffffn, 4);
    }

    isRoutable(): boolean {
        if (this.version === 4) {
            return !isInRange(this._int, NON_ROUTABLE_IPV4);
        }
        // For IPv6, if it's IPv4-mapped, classify the embedded IPv4
        if (this.isMappedIPv4()) {
            return !isInRange(this._int & 0xffffffffn, NON_ROUTABLE_IPV4);
        }

        return !isInRange(this._int, NON_ROUTABLE_IPV6);
    }

    /** Returns DNS PTR reverse format. */
    reverse(): string {
        if (this.version === 4) {
            return intToIPv4String(this._int)
                .split('.')
                .reverse()
                .join('.');
        }
        return _reverseIPv6(this);
    }
}

function _reverseIPv6(ip: IPAddress): string {
    // Expand to full 32 hex nibbles, then reverse with dots
    return ip
        .toNormalizedString()
        .split(':')
        .map((g) => g.padStart(4, '0'))
        .join('')
        .split('')
        .reverse()
        .join('.');
}
