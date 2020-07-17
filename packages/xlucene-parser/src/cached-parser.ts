import { ParserOptions } from './interfaces';
import { Parser } from './parser';

type Cached = { [query: string]: Parser };
const _cache = new WeakMap<CachedParser, Cached>();

export class CachedParser {
    constructor() {
        _cache.set(this, {});
    }

    make(query: string, options?: ParserOptions): Parser {
        return new Parser(query, options);
    }

    reset(): void {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
