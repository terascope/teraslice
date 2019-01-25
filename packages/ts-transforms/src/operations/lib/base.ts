
import _ from 'lodash';
import { OperationConfig } from '../../interfaces';
import { DataEntity } from '@terascope/utils';

export default class OperationBase {
    protected source!: string;
    protected target!: string;
    protected config: OperationConfig;
    protected destination: string;
    protected hasTarget: boolean;

    constructor(config: OperationConfig) {
        this.validateConfig(config);
        this.config = config;
        this.hasTarget = this.target !== this.source;
        this.destination = this.hasTarget ? this.target : this.source;
    }

    // TODO: verify if we should do validateConfig source and target manipulations in normalizeConfig in phasebase

    protected validateConfig(config: OperationConfig) {
        // we don't need to check target or source for selector ops
        if (this.constructor.name === 'Selector' || this.constructor.name === 'RequiredExtractions') return;
        const { target_field: targetField, source_field: sField } = config;
        const tField = targetField || sField;
        if (!tField || typeof tField !== 'string' || tField.length === 0) {
            throw new Error(`could not find target_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        }
        if (!sField || typeof sField !== 'string' || sField.length === 0) {
            throw new Error(`could not find source_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        }
        this.source = sField;
        this.target = tField;
    }

    protected parentFieldPath(str: string): string {
        return str.lastIndexOf('.') === -1 ? str : str.slice(0, str.lastIndexOf('.'));
    }

    set(doc: DataEntity, data: any) {
        _.set(doc, this.destination, data);
        if (this.hasTarget) _.unset(doc, this.source);
    }

    setField(doc: DataEntity, field: string, data: any) {
        _.set(doc, field, data);
        if (this.hasTarget) _.unset(doc, this.source);
    }

    removeSource(doc: DataEntity) {
        _.unset(doc, this.source);
    }

    removeField(doc: DataEntity, field: string) {
        _.unset(doc, field);
    }
}
