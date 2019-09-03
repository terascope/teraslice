import * as i from './interfaces';

export function defineProperties(entity: any): void {
    Object.defineProperty(entity, i.__IS_ENTITY_KEY, {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false,
    });

    Object.defineProperty(entity, i.__DATAENTITY_METADATA_KEY, {
        value: {},
        configurable: false,
        enumerable: false,
        writable: false,
    });
}

export function createMetadata<M>(metadata: M): i.EntityMetadata<M> {
    return { ...createCoreMetadata(), ...metadata } as i.EntityMetadata<M>;
}

export function makeMetadata<M extends i.EntityMetadataType>(
    metadata?: M|undefined
): i.EntityMetadata<M> {
    if (!metadata) return createCoreMetadata();
    return createMetadata(metadata);
}

export function createCoreMetadata<M extends i.EntityMetadataType>(): i.EntityMetadata<M> {
    return { _createTime: Date.now() } as i.EntityMetadata<M>;
}

export function jsonToBuffer(input: any): Buffer {
    return Buffer.from(JSON.stringify(input));
}
