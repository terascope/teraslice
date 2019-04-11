import { Translator } from './translator';
import { TypeConfig } from '../interfaces';
import { Parser } from '../parser';
import { isString, Logger } from '@terascope/utils';

type Cached = { [query: string]: Translator };
const _cache = new WeakMap<CachedTranslator, Cached>();

export class CachedTranslator {
    constructor() {
        _cache.set(this, {});
    }

    make(input: string|Parser, typeConfig?: TypeConfig, logger?: Logger): Translator {
        const query = isString(input) ? input : input.query;
        const cached = _cache.get(this)!;
        if (cached[query] != null) return cached[query];

        const translate = new Translator(query, typeConfig, logger);

        cached[query] = translate;
        _cache.set(this, cached);

        return translate;
    }

    reset() {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
