import { isString } from '@terascope/utils';
import { TranslatorOptions } from './interfaces';
import { Translator } from './translator';
import { Parser } from '../parser';

type Cached = { [query: string]: Translator };
const _cache = new WeakMap<CachedTranslator, Cached>();

export class CachedTranslator {
    constructor() {
        _cache.set(this, {});
    }

    make(input: string|Parser, options?: TranslatorOptions): Translator {
        const query = isString(input) ? input : input.query;
        const cached = _cache.get(this)!;
        if (cached[query] != null) return cached[query];

        const translate = new Translator(query, options);

        cached[query] = translate;
        _cache.set(this, cached);

        return translate;
    }

    reset() {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
