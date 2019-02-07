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

    if (isInfiniteMax(node.term_max) && node.inclusive_min) {
        result.gte = node.term_min;
    } else if (isInfiniteMax(node.term_max) && !node.inclusive_min) {
        result.gt = node.term_min;
    } else if (isInfiniteMin(node.term_min) && node.inclusive_max) {
        result.lte = node.term_max;
    } else if (isInfiniteMin(node.term_min) && !node.inclusive_max) {
        result.lt = node.term_max;
    }

    return result;
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
