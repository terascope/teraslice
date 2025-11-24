import { isString } from '@terascope/core-utils';
import { Parser } from 'xlucene-parser';
import { TranslatorOptions } from './interfaces.js';
import { Translator } from './translator.js';

type Cached = { [query: string]: Translator };
const _cache = new WeakMap<CachedTranslator, Cached>();

export class CachedTranslator {
    constructor() {
        _cache.set(this, {});
    }

    make(input: string | Parser, options?: TranslatorOptions): Translator {
        const query = isString(input) ? input : input.query;
        return new Translator(query, options);
    }

    reset(): void {
        _cache.delete(this);
        _cache.set(this, {});
    }
}
