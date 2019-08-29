import * as i from './interfaces';

export function makeDataEntityObj<T extends object, M extends i.DataEntityMetadata>(
    entity: T,
    metadata: M
): void {
    Object.defineProperties(entity, {
        [i.__IS_ENTITY_KEY]: {
            value: true,
            enumerable: false,
            writable: false,
        },
        [i.__DATAENTITY_METADATA_KEY]: {
            value: {
                metadata,
                rawData: null,
            },
            configurable: false,
            enumerable: false,
            writable: false,
        },
    });
}

export function makeMetadata<M extends object>(metadata?: M): i.DataEntityMetadata {
    const m = { _createTime: Date.now() };
    if (!metadata) return m;
    return Object.assign({}, m, metadata);
}
