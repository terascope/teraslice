import * as i from './interfaces';

export function makeDataEntityObj<T extends object, M extends i.DataEntityMetadata>(
    entity: T,
    metadata: M
): void {
    Object.defineProperties(entity, {
        [i.IS_ENTITY_KEY]: {
            value: true,
            enumerable: false,
            writable: false,
        },
        [i.METADATA_KEY]: {
            value: metadata,
            enumerable: false,
            writable: false,
        },
        [i.RAWDATA_KEY]: {
            value: null,
            enumerable: false,
            writable: true,
        }
    });
}

export function makeMetadata<M extends object>(metadata?: M): i.DataEntityMetadata {
    return { _createTime: Date.now(), ...metadata };
}
