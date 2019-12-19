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
        const cachedTranslator = cached[query];

        if (cachedTranslator != null) {
            if (!cachedTranslator.variables) return cachedTranslator;
            if (options?.variables) {
                const cachedVars = JSON.stringify(cachedTranslator.variables);
                const newVars = JSON.stringify(options.variables);
                if (cachedVars === newVars) return cachedTranslator;
            }
        }

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
