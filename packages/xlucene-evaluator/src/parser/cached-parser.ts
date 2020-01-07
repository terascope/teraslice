import { ParserOptions } from './interfaces';
import { Parser } from './parser';

type Cached = { [query: string]: Parser };
const _cache = new WeakMap<CachedParser, Cached>();

export class CachedParser {
    constructor() {
        _cache.set(this, {});
    }

    make(query: string, options?: ParserOptions) {
        return new Parser(query, options);
    }

    reset() {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
