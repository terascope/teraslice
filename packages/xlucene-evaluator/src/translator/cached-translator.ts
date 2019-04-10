import { Translator } from './translator';
import { ElasticsearchDSLResult } from './interfaces';
import { TypeConfig } from '../interfaces';
import { Parser } from '../parser';
import { isString } from '@terascope/utils';

type Cached = { [query: string]: ElasticsearchDSLResult };
const _cache = new WeakMap<CachedTranslator, Cached>();

export class CachedTranslator {
    constructor() {
        _cache.set(this, {});
    }

    toElasticsearchDSL(input: string|Parser, types?: TypeConfig): ElasticsearchDSLResult {
        const query = isString(input) ? input : input.query;
        const cached = _cache.get(this)!;
        if (cached[query] != null) return cached[query];

        const translate = new Translator(query, types);
        const result = translate.toElasticsearchDSL();

        cached[query] = result;
        _cache.set(this, cached);

        return result;
    }
}
