import * as i from './interfaces';

export function defineProperties<T extends object, M extends i.DataEntityMetadata>(
    entity: T,
    metadata: M
): void {
    Object.defineProperties(entity, {
        [i.__IS_ENTITY_KEY]: _makeISEntityProp(),
        [i.__DATAENTITY_METADATA_KEY]: _makeDataEntityMetadata(metadata),
    });
}

function _makeDataEntityMetadata<M>(metadata: M) {
    return {
        value: {
            metadata,
            rawData: null,
        },
        configurable: false,
        enumerable: false,
        writable: false,
    };
}

function _makeISEntityProp() {
    return {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false,
    };
}

export function createMetadata<M extends object>(metadata: M): i.DataEntityMetadata {
    return { ..._baseMetadata(), ...metadata };
}

export function makeMetadata<M extends object>(metadata?: M): i.DataEntityMetadata {
    if (!metadata) return _baseMetadata();
    return createMetadata(metadata);
}

function _baseMetadata() {
    return { _createTime: Date.now() };
}

export function jsonToBuffer(input: any): Buffer {
    return Buffer.from(JSON.stringify(input));
}
