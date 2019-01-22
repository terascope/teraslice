
import _ from 'lodash';
import { OperationConfig } from '../../interfaces';

export default class OperationBase {
    protected source: string;
    protected target: string;
    protected removeSource: boolean;
    protected config: OperationConfig;

    constructor(config: OperationConfig) {
        this.source = '';
        this.target = '';
        this.removeSource =  false;
        this.validateConfig(config);
        this.config = config;

    }

    // TODO: verify if we should do validateConfig source and target manipulations in normalizeConfig in phasebase

    protected validateConfig(config: OperationConfig) {
        // we don't need to check target or source for selector ops
        if (this.constructor.name === 'Selector' || this.constructor.name === 'RequiredExtractions') return;
        const { target_field: targetField, source_field: sField, remove_source } = config;
        const tField = targetField || sField;
        if (remove_source && typeof remove_source !== 'boolean') throw new Error('remove_source if specified must be of type boolean');
        if (!tField || typeof tField !== 'string' || tField.length === 0) {
            throw new Error(`could not find target_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        }
        if (!sField || typeof sField !== 'string' || sField.length === 0) {
            throw new Error(`could not find source_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        }
        if (remove_source) this.removeSource = remove_source;
        this.source = sField;
        this.target = tField;
    }

    protected parentFieldPath(str: string): string {
        return str.lastIndexOf('.') === -1 ? str : str.slice(0, str.lastIndexOf('.'));
    }
}
