import { IPAddress } from './ip-address.js';

const MAX4 = (1n << 32n) - 1n;
const MAX6 = (1n << 128n) - 1n;

function prefixMask(prefix: number, version: 4 | 6): bigint {
    const total = version === 4 ? 32 : 128;
    const hostBits = BigInt(total - prefix);
    const maxVal = version === 4 ? MAX4 : MAX6;

    return maxVal ^ ((1n << hostBits) - 1n);
}

// ---------------------------------------------------------------------------
// CIDRBlock class
// ---------------------------------------------------------------------------

export class CIDRBlock {
    private readonly _input: IPAddress; // original input address (may not be network addr)
    private readonly _network: IPAddress; // network address (all host bits 0)
    private readonly _prefix: number;
    readonly version: 4 | 6;

    private constructor(input: IPAddress, prefix: number) {
        this._input = input;
        this._prefix = prefix;
        this.version = input.version;

        const mask = prefixMask(prefix, input.version);
        this._network = IPAddress.fromInt(input.toInt() & mask, input.version);
    }

    // ---- Static factories --------------------------------------------------

    /** Parse "a.b.c.d/n" or "::1/128" CIDR notation. Throws if invalid. */
    static of(cidr: string): CIDRBlock {
        const result = CIDRBlock._parse(cidr);

        if (result === null) {
            throw new Error(`"${cidr}" is not a valid CIDR notation`);
        }

        return result;
    }

    /** Build a CIDRBlock from an IPAddress and prefix length. */
    static from(ip: IPAddress, prefix: number): CIDRBlock {
        const maxPrefix = ip.version === 4 ? 32 : 128;

        if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) {
            throw new Error(
                `Invalid prefix length ${prefix} for IPv${ip.version}`,
            );
        }

        return new CIDRBlock(ip, prefix);
    }

    /**
     * Return the smallest CIDR block that encloses both IP addresses.
     * Both IPs must be the same version.
     *
     * NOTE: The result is network-aligned and may extend beyond the input IPs.
     * For example, enclosing(192.198.0.1, 192.198.0.254) → 192.198.0.0/24,
     * which includes 192.198.0.0 and 192.198.0.255. This is a CIDR/routing
     * operation — use IPRange for arbitrary range containment checks.
     */
    static enclosing(ip1: IPAddress, ip2: IPAddress): CIDRBlock {
        if (ip1.version !== ip2.version) {
            throw new Error(
                'Both IPs must be the same version to compute enclosing CIDR',
            );
        }

        const xor = ip1.toInt() ^ ip2.toInt();
        const totalBits = ip1.version === 4 ? 32 : 128;
        const hostBits = xor === 0n ? 0 : xor.toString(2).length;
        const prefix = totalBits - hostBits;

        return CIDRBlock.from(ip1, prefix);
    }

    private static _parse(cidr: string): CIDRBlock | null {
        if (typeof cidr !== 'string') return null;

        const slashIdx = cidr.lastIndexOf('/');
        if (slashIdx < 0) return null;

        const ipStr = cidr.slice(0, slashIdx);
        const prefixStr = cidr.slice(slashIdx + 1);

        // Prefix must be a non-negative integer with no leading zeros (except "0")
        if (!/^\d+$/.test(prefixStr)) return null;
        if (prefixStr.length > 1 && prefixStr[0] === '0') return null;
        const prefix = parseInt(prefixStr, 10);

        if (!IPAddress.isValid(ipStr)) return null;
        const ip = IPAddress.of(ipStr);

        const maxPrefix = ip.version === 4 ? 32 : 128;
        if (prefix > maxPrefix) return null;

        return new CIDRBlock(ip, prefix);
    }

    // ---- Static validators -------------------------------------------------

    static isValid(input: unknown): input is string {
        if (typeof input !== 'string') return false;
        return CIDRBlock._parse(input) !== null;
    }

    static isCidr(input: string): 4 | 6 | 0 {
        if (typeof input !== 'string') return 0;

        const block = CIDRBlock._parse(input);

        if (block === null) return 0;
        if (block._prefix === 0) return 0;

        return block.version;
    }

    // ---- Instance methods --------------------------------------------------

    toString(): string {
        return `${this._network.toString()}/${this._prefix}`;
    }

    /** The original input address (may differ from network address). */
    address(): IPAddress {
        return this._input;
    }

    /** Network address — first IP in block (all host bits 0). */
    first(): IPAddress {
        return this._network;
    }

    /** Last IP in block (all host bits 1). */
    last(): IPAddress {
        const totalBits = this.version === 4 ? 32 : 128;
        const hostBits = BigInt(totalBits - this._prefix);
        const lastInt = this._network.toInt() | ((1n << hostBits) - 1n);

        return IPAddress.fromInt(lastInt, this.version);
    }

    /**
     * First usable host address.
     * IPv4: network + 1, except /32 (single host).
     * IPv6: network + 1, except /128 (single host).
     */
    firstUsable(): IPAddress {
        const f = this.first();
        const l = this.last();

        if (f.toInt() === l.toInt()) return f;

        return f.offset(1n);
    }

    /**
     * Last usable host address.
     * IPv4: broadcast - 1, except /32 (returns broadcast).
     * IPv6: same as last (no broadcast concept).
     */
    lastUsable(): IPAddress {
        const f = this.first();
        const l = this.last();

        if (f.toInt() === l.toInt()) return l;
        if (this.version === 4) return l.offset(-1n);

        return l;
    }

    /**
     * IPv4 broadcast address (last IP in block).
     * Throws for IPv6 CIDRs.
     */
    broadcast(): IPAddress {
        if (this.version !== 4) {
            throw new Error('IPv6 addresses do not have a broadcast address');
        }

        return this.last();
    }

    /**
     * IPv4 network address (first IP in block).
     * Throws for IPv6 CIDRs.
     */
    network(): IPAddress {
        if (this.version !== 4) {
            throw new Error(
                'IPv6 addresses do not have a network address in the IPv4 sense',
            );
        }

        return this.first();
    }

    /**
     * Returns true if the given IP is within this CIDR block.
     * The IP version must match the CIDR version exactly.
     */
    contains(input: IPAddress | string): boolean {
        try {
            const ip = typeof input === 'string' ? IPAddress.of(input) : input;

            if (ip.version !== this.version) return false;

            const n = ip.toInt();
            return n >= this._network.toInt() && n <= this.last().toInt();
        } catch {
            return false;
        }
    }
}
