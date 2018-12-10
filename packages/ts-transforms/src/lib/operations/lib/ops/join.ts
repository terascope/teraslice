
import { DataEntity } from '@terascope/job-components';
import { JoinConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base'

export default class Join extends OperationBase { 
    private config: JoinConfig

    constructor(config: JoinConfig) {
        super();
        this.validate(config);
        this.config = config;
    }

    protected validate(config: JoinConfig) {
        if (!config.fields || !(Array.isArray(config.fields)) || config.fields.length < 2) throw new Error('fields configuration must be properly set for a join operator');
        if (!config.target_field || typeof config.target_field !== 'string' || config.target_field.length === 0) throw new Error('target_field parameter must be set in a join operator');
        if (config.delimiter && typeof config.delimiter !== 'string') throw new Error('paramter delimiter must be a string if defined')
    }
    
    run(doc: DataEntity | null): DataEntity | null {
        if (!doc) return doc;
        const { config } = this;
        const delimiter = config.delimiter !== undefined ? config.delimiter : '';
        const fields = config.fields.map(field => _.get(doc, field));
        const results = fields.join(delimiter);

        if (config.remove_source) {
            const final = {}
            if (results.length !== delimiter.length) final[config.target_field] = results;
            return new DataEntity(final, doc.getMetadata())
        }
        if (results.length !== delimiter.length) doc[config.target_field] = results;

        return doc;
    }
}