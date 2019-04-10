import { Parser } from './parser';

type Parsers = { [query: string]: Parser };
const _cache = new WeakMap<CachedParser, Parsers>();

export class CachedParser {
    constructor() {
        _cache.set(this, {});
    }

    parse(query: string) {
        const cached = _cache.get(this)!;
        if (cached[query] != null) return cached[query];

        const parser = new Parser(query);

        cached[query] = parser;
        _cache.set(this, cached);

        return parser;
    }
}
