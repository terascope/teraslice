// this file cannot depend on any other files in this folder

/**
 * A core implementation of Entity in teraslice
 * with metadata capabilities
*/
export interface Entity<Data = {}, Metadata = {}> {
    /**
     * Get the metadata for the entity
     *
     * If a field is specified, it will get that property of the metadata
    */
    getMetadata(key?: undefined): EntityMetadata & Metadata;
    getMetadata<K extends keyof EntityMetadata>(key: K): EntityMetadata[K];
    getMetadata<K extends keyof Metadata>(key: K): Metadata[K];
    getMetadata(key: string|number): any;
    getMetadata<K extends keyof Metadata|keyof EntityMetadata>(
        key?: K
    ): (EntityMetadata & Metadata)[K]|(EntityMetadata & Metadata);

    /**
     * Given a field and value set the metadata on the entity
    */
    setMetadata<K extends string|number>(
        field: K,
        value: any
    ): void;
    setMetadata<K extends keyof EntityMetadata, V extends EntityMetadata[K]>(
        field: K,
        value: V
    ): void;
    setMetadata<K extends keyof Metadata, V extends Metadata[K]>(
        field: K,
        value: V
    ): void;
    setMetadata<K extends keyof Metadata|keyof EntityMetadata>(field: K, value: any): void;

    /**
     * Get the unique `_key` for the entity
     *
     * If no `_key` is found, an error will be thrown
    */
    getKey(): string|number;

    /**
     * Set the unique `_key` for the entity
     *
     * If no `_key` is found, an error will be thrown
    */
    setKey(key: string|number): void;
}

export type TYPE_ENTITY_METADATA_KEY = '___EntityMetadata';
export const __ENTITY_METADATA_KEY: TYPE_ENTITY_METADATA_KEY = '___EntityMetadata';

/**
 * Entities have conventional metadata properties
 * that can track process and key information
 *
 * **NOTE** Time values are set in UNIX Epoch time,
 * to reduce memory footput, the Entity should convenience
 * apis for getting and setting the time given and handling
 * the conversion between unix milliseconds to Date format.
*/
export interface EntityMetadata {
    /**
     * The time at which this entity was created
     * (this is automatically set on creation)
     * @readonly
    */
    _createTime?: number;

    /**
     * A unique key for the data that is associated with Window
     */
    _key?: string|number;
}
