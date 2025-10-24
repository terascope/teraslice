import { isString, isNumber } from '@terascope/core-utils';
import * as i from './interfaces.js';

export function defineEntityProperties(entity: unknown): void {
    Object.defineProperty(entity, i.__IS_DATAENTITY_KEY, {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false,
    });

    Object.defineProperty(entity, i.__ENTITY_METADATA_KEY, {
        value: {},
        configurable: false,
        enumerable: false,
        writable: false,
    });
}

export function createMetadata<M>(metadata: M): i._DataEntityMetadata<M> {
    return { ...createCoreMetadata(), ...metadata } as i._DataEntityMetadata<M>;
}

export function makeMetadata<M extends i._DataEntityMetadataType>(
    metadata?: M | undefined
): i._DataEntityMetadata<M> {
    if (!metadata) return createCoreMetadata();
    return createMetadata(metadata);
}

export function createCoreMetadata<M extends i._DataEntityMetadataType>(
): i._DataEntityMetadata<M> {
    return { _createTime: Date.now() } as i._DataEntityMetadata<M>;
}

export function jsonToBuffer(input: unknown): Buffer {
    return Buffer.from(JSON.stringify(input));
}

export function isValidKey(key: unknown): key is string | number {
    if (key == null) return false;
    if (isString(key) && key !== '') return true;
    if (isNumber(key)) return true;
    return false;
}
