export interface ParsedIP {
    number: bigint;
    version: 4|6;
    ipv4mapped?: any;
    scopeid?: any;
}

export function parse(input: string): ParsedIP;

export function stringify(parsed: ParsedIP): string;
