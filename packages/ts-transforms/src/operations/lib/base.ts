import { set, unset, isString } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { OperationConfig, InputOutputCardinality } from '../../interfaces.js';

export default class OperationBase {
    protected source!: string | string[];
    protected target!: string | string[];
    readonly config: OperationConfig;
    protected destination: string | string[];
    protected hasTarget: boolean;

    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: OperationConfig) {
        this.validateConfig(config);
        this.config = config;
        this.hasTarget = this.target !== this.source;
        this.destination = this.hasTarget ? this.target : this.source;
    }

    protected validateConfig(config: OperationConfig) {
        // we don't need to check target or source for selector ops
        if (this.constructor.name === 'Selector') return;
        const {
            target: targetField,
            source: sField,
            sources: sFields
        } = config;
        // @ts-expect-error
        this.source = sField || sFields;
        // @ts-expect-error
        this.target = targetField;
        hasStringValues(this.source);
        hasStringValues(this.target);
    }

    set(doc: DataEntity, data: any) {
        set(doc, this.destination, data);
    }

    setField(doc: DataEntity, field: string, data: any) {
        set(doc, field, data);
    }

    removeSource(doc: DataEntity) {
        unset(doc, this.source);
    }

    removeField(doc: DataEntity, field: string) {
        unset(doc, field);
    }
}

function hasStringValues(value: string | string[]) {
    if (Array.isArray(value)) {
        if (value.length === 0) throw new Error('if input is an array it must have string values inside');
        const bool = value.every(isString);
        if (!bool) throw new Error(`input: ${value} must be of type string`);
    } else if (typeof value !== 'string') throw new Error(`input: ${value} must be of type string`);
}
