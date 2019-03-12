
import _ from 'lodash';
import { OperationConfig, InputOutputCardinality } from '../../interfaces';
import { DataEntity } from '@terascope/utils';

export default class OperationBase {
    protected source!: string|string[];
    protected target!: string|string[];
    protected config: OperationConfig;
    protected destination: string|string[];
    protected hasTarget: boolean;

    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: OperationConfig) {
        this.validateConfig(config);
        this.config = config;
        this.hasTarget = this.target !== this.source;
        this.destination = this.hasTarget ? this.target : this.source;
    }
    // @ts-ignore
    protected validateConfig(config) {
        // we don't need to check target or source for selector ops
        if (this.constructor.name === 'Selector') return;
        const {
            target_field: targetField,
            source_field: sField,
            source_fields: sFields
        } = config;
        // @ts-ignore
        this.source = sField || sFields;
         // @ts-ignore
        this.target = targetField;
        hasStringValues(this.source);
        hasStringValues(this.target);
    }

    set(doc: DataEntity, data: any) {
        _.set(doc, this.destination, data);
    }

    setField(doc: DataEntity, field: string, data: any) {
        _.set(doc, field, data);
    }

    removeSource(doc: DataEntity) {
        _.unset(doc, this.source);
    }

    removeField(doc: DataEntity, field: string) {
        _.unset(doc, field);
    }
}

function hasStringValues(value: string|string[]) {
    if (Array.isArray(value)) {
        if (value.length === 0) throw new Error('if input is an array it must have string values inside');
        const bool = _.every(value, _.isString);
        if (!bool) throw new Error(`input: ${value} must be of type string`);
    } else {
        if (typeof value !== 'string') throw new Error(`input: ${value} must be of type string`);
    }
}
