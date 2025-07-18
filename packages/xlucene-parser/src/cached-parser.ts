import { ParserOptions, Node } from './interfaces.js';
import { Parser } from './parser.js';

type Cached = Map<string, Parser>;
const _cache = new WeakMap<CachedParser, Cached>();

/**
 * A caching wrapper around the Parser class for improved performance.
 * 
 * CachedParser maintains an internal cache of parsed queries to avoid
 * re-parsing identical query strings. This is particularly useful when
 * the same queries are parsed repeatedly.
 * 
 * @example
 * ```typescript
 * const cache = new CachedParser();
 * 
 * // First parse - creates and caches the parser
 * const parser1 = cache.make('name:John');
 * 
 * // Second parse - returns cached parser
 * const parser2 = cache.make('name:John');
 * 
 * console.log(parser1 === parser2); // true
 * ```
 */
export class CachedParser {
    constructor() {
        _cache.set(this, new Map());
    }

    /**
     * Create or retrieve a cached Parser instance for the given query.
     * 
     * The cache key is based on the query string and type configuration.
     * If a parser for the same query and configuration exists in the cache,
     * it will be returned instead of creating a new one.
     * 
     * @param query - The xLucene query string to parse
     * @param options - Optional configuration for parsing behavior
     * @param _overrideParsedQuery - Internal parameter for providing pre-parsed AST
     * @returns A Parser instance (cached or newly created)
     * 
     * @example
     * ```typescript
     * const cache = new CachedParser();
     * 
     * // Create parser with type configuration
     * const parser = cache.make('age:25', {
     *   type_config: { age: 'integer' }
     * });
     * 
     * // Same query and config returns cached parser
     * const cachedParser = cache.make('age:25', {
     *   type_config: { age: 'integer' }
     * });
     * ```
     */
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

    /**
     * Clear all cached parsers.
     * 
     * This method removes all entries from the internal cache, forcing
     * subsequent calls to `make()` to create new Parser instances.
     * 
     * @example
     * ```typescript
     * const cache = new CachedParser();
     * cache.make('name:John'); // Creates and caches parser
     * 
     * cache.reset(); // Clear cache
     * 
     * cache.make('name:John'); // Creates new parser (not cached)
     * ```
     */
    reset(): void {
        const cached = _cache.get(this)!;
        cached.clear();
    }
}
