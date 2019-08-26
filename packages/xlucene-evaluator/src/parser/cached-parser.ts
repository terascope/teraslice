import { ParserOptions } from './interfaces';
import { Parser } from './parser';

type Cached = { [query: string]: Parser };
const _cache = new WeakMap<CachedParser, Cached>();

export class CachedParser {
    constructor() {
        _cache.set(this, {});
    }

    make(query: string, options?: ParserOptions) {
        const cached = _cache.get(this)!;
        if (cached[query] != null) return cached[query];

        const parser = new Parser(query, options);

        cached[query] = parser;
        _cache.set(this, cached);

        return parser;
    }

    reset() {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
