import { AST } from './interfaces';

export function bindThis(instance:object, cls:object): void {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        .filter((name) => {
            const method = instance[name];
            return method instanceof Function && method !== cls;
        })
        .forEach((mtd) => {
            instance[mtd] = instance[mtd].bind(instance);
        });
}

export function isRangeNode(node: AST) {
    return node.term_min != null || node.term_max != null;
}

export function parseNodeRange(node: AST): ParseNodeRangeResult  {
    const result: ParseNodeRangeResult = {};

    if (!isInfiniteValue(node.term_min)) {
        if (node.inclusive_min) {
            result.gte = node.term_min;
        } else {
            result.gt = node.term_min;
        }
    }

    if (!isInfiniteValue(node.term_max)) {
        if (node.inclusive_max) {
            result.lte = node.term_max;
        } else {
            result.lt = node.term_max;
        }
    }

    return result;
}

export function isInfiniteValue(input?: number|string) {
    return input === '*' || input === -Infinity || input === Infinity;
}

export function isInfiniteMin(min?: number|string) {
    if (min == null) return false;
    return min === '*' || min === -Infinity;
}

export function isInfiniteMax(max?: number|string) {
    if (max == null) return false;
    return max === '*' || max === Infinity;
}

export interface ParseNodeRangeResult {
    'gte'?: number|string;
    'gt'?: number|string;
    'lte'?: number|string;
    'lt'?: number|string;
}
