import { QueryAccess } from './query-access';
import { QueryAccessConfig, QueryAccessOptions } from './interfaces';

type Cached = { [key: string]: QueryAccess<any> };
const _cache = new WeakMap<CachedQueryAccess, Cached>();

export class CachedQueryAccess {
    constructor() {
        _cache.set(this, {});
    }

    make<T extends Record<string, any>>(
        config: QueryAccessConfig<T>,
        options?: QueryAccessOptions
    ): QueryAccess<T> {
        return new QueryAccess(config, options);
    }

    reset(): void {
        this.resetInstances();

        _cache.delete(this);
        _cache.set(this, {});
    }

    resetInstances(): void {
        const cached = _cache.get(this)!;
        Object.values(cached)
            .forEach((instance) => instance.clearCache());
    }
}
