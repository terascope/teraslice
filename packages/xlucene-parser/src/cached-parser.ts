import { ParserOptions, Node } from './interfaces';
import { Parser } from './parser';

type Cached = Map<string, Parser>;
const _cache = new WeakMap<CachedParser, Cached>();

export class CachedParser {
    constructor() {
        _cache.set(this, new Map());
    }

    make(query: string, options?: ParserOptions, _overrideParsedQuery?: Node): Parser {
        const typeConfigKey = options?.type_config ? JSON.stringify(options.type_config) : '';
        const key = `${query}${typeConfigKey}`;

        const cached = _cache.get(this)!;
        const cachedParser = cached.get(key);
        if (cachedParser) return cachedParser;

        const parsed = new Parser(query, options, _overrideParsedQuery);
        cached.set(key, parsed);
        return parsed;
    }

    reset(): void {
        const cached = _cache.get(this)!;
        cached.clear();
    }
}
