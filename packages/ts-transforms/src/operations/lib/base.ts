
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../interfaces';
import _ from 'lodash';

export default abstract class OperationBase {
    protected source: string;
    protected target: string;
    protected removeSource: boolean;

    constructor(config: OperationConfig) {
        this.source = '';
        this.target = '';
        this.removeSource =  false;
        this.validate(config);
    }

    protected validate(config: OperationConfig) {
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

    protected fieldPath(str: string): string {
        return str.lastIndexOf('.') === -1 ? str : str.slice(0, str.lastIndexOf('.'));
    }

    protected decode(doc: DataEntity, decodeFn: Function) {
        try {
            const data = _.get(doc, this.source);
            if (typeof data !== 'string') {
                _.unset(doc, this.source);
            } else {
                _.set(doc, this.target, decodeFn(data));
            }
        } catch (err) {
            _.unset(doc, this.source);
        }

        if (this.removeSource) _.unset(doc, this.source);
        return doc;
    }

    abstract run(data: DataEntity): null | DataEntity;
}
