import { RangeAST, AST } from './interfaces';

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

export function isOperatorNode(node: AST): boolean {
    return ['root', 'operator'].includes(node.type);
}

export function isRangeNode(node: AST): boolean {
    return node.term_min != null || node.term_max != null;
}

export function isGeoNode(node: AST): boolean {
    return node.type === 'geo';
}

export function isTermNode(node: AST): boolean {
    return node.term != null;
}

export function isRegexNode(node: AST): boolean {
    return isTermNode(node) && node.regexpr;
}

export function isWildcardNode(node: AST): boolean {
    return isTermNode(node) && node.wildcard;
}

export function isExistsNode(node: AST): boolean {
    return node.field === '_exists_';
}

export function parseNodeRange(node: RangeAST): ParseNodeRangeResult  {
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
    return input === '*' || input === Number.NEGATIVE_INFINITY || input === Number.POSITIVE_INFINITY;
}

export function isInfiniteMin(min?: number|string) {
    if (min == null) return false;
    return min === '*' || min === Number.NEGATIVE_INFINITY;
}

export function isInfiniteMax(max?: number|string) {
    if (max == null) return false;
    return max === '*' || max === Number.POSITIVE_INFINITY;
}

export interface ParseNodeRangeResult {
    'gte'?: number|string;
    'gt'?: number|string;
    'lte'?: number|string;
    'lt'?: number|string;
}
