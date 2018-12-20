
import { DataEntity } from '@terascope/job-components';
import { JoinConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';

export default class Join extends OperationBase {
    private delimiter: string;
    private fields: string[];

    constructor(config: JoinConfig) {
        super(config);
        this.delimiter = config.delimiter !== undefined ? config.delimiter : '';
        this.fields = config.fields;
    }
    // source work differently here so we do not use the inherited validate
    protected validate(config: JoinConfig) {
        const { target_field: tField, remove_source } = config;
        if (!tField || typeof tField !== 'string' || tField.length === 0)  {
            throw new Error(`could not find target_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        }
        if (!config.fields || !(Array.isArray(config.fields)) || config.fields.length < 2) throw new Error('fields configuration must be properly set for a join operator');
        if (config.delimiter && typeof config.delimiter !== 'string') throw new Error('paramter delimiter must be a string if defined');
        if (remove_source) this.removeSource = remove_source;
        this.target = tField;
    }

    run(doc: DataEntity): DataEntity | null {
        const fieldsData = this.fields.map(field => _.get(doc, field));
        const results = fieldsData.join(this.delimiter);
        if (results.length !== this.delimiter.length) _.set(doc, this.target, results);

        if (this.removeSource) {
            _.each(this.fields, (field: string) => _.unset(doc, field));
        }

        return doc;
    }
}
