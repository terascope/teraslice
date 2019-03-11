function isCidr(input: string): number|boolean;

namespace isCidr {
    export function v4(input: string): number|boolean;
    export function v6(input: string): number|boolean;
}

export = isCidr;
