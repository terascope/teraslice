import { IPAddress } from './ip-address.js';
import { CIDRBlock } from './cidr-block.js';

export class IPRange {
    readonly minValue: IPAddress;
    readonly maxValue: IPAddress;
    readonly version: 4 | 6;

    private constructor(min: IPAddress, max: IPAddress) {
        this.minValue = min;
        this.maxValue = max;
        this.version = min.version;
    }

    // ---- Static factories --------------------------------------------------

    /**
     * Build an IPRange from two IPAddress boundary values (inclusive).
     * Both must be the same IP version and min must be <= max.
     */
    static from(min: IPAddress, max: IPAddress): IPRange {
        if (min.version !== max.version) {
            throw new Error(
                `IPRange boundaries must be the same version: got IPv${min.version} and IPv${max.version}`,
            );
        }
        if (min.toInt() > max.toInt()) {
            throw new Error(
                `IPRange min (${min.toString()}) must be <= max (${max.toString()})`,
            );
        }

        return new IPRange(min, max);
    }

    // ---- Instance methods --------------------------------------------------

    toString(): string {
        return `${this.minValue.toString()} - ${this.maxValue.toString()}`;
    }

    /**
     * Returns true if the given IP address falls within this range (inclusive).
     * The IP version must match the range version exactly.
     */
    contains(input: IPAddress | string): boolean {
        try {
            const ip = typeof input === 'string' ? IPAddress.of(input) : input;
            if (ip.version !== this.version) return false;

            const n = ip.toInt();
            return n >= this.minValue.toInt() && n <= this.maxValue.toInt();
        } catch {
            return false;
        }
    }

    /**
     * Returns true if the given CIDR block is fully contained within this range.
     * Both the CIDR's network address (first) and broadcast address (last) must
     * fall within [minValue, maxValue]. This ensures exclusive range bounds are
     * respected for the entire CIDR, not just the usable host addresses.
     */
    containsCIDR(cidr: CIDRBlock): boolean {
        if (cidr.version !== this.version) return false;

        return (
            cidr.first().toInt() >= this.minValue.toInt()
            && cidr.last().toInt() <= this.maxValue.toInt()
        );
    }
}
