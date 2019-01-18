
import _ from 'lodash';
import { DataEntity } from '@terascope/job-components';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default class StringValidation extends OperationBase {
    private length?: number;
    private min?: number;
    private max?: number;

    constructor(config: OperationConfig) {
        super(config);
        this.length = config.length;
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (field == null) {
            _.unset(doc, this.source);
            return doc;
        }
        let data = field;

        if (typeof field !== 'string') {
            try {
                if (typeof field === 'object') {
                    data = JSON.stringify(field);
                } else {
                    data = field.toString();
                }
                _.set(doc, this.source, data);
            } catch (err) {
                _.unset(doc, this.source);
                return doc;
            }
        }

        if (this.length && data && data.length !== this.length) _.unset(doc, this.source);

        if (this.min || this.max) {
            const min = this.min || 1;
            const max = this.max || Infinity;
            // wierd method name, it actually check if it fits the range
            if (!validator.isLength(data, { min, max })) {
                _.unset(doc, this.source);
                return doc;
            }
        }
        return doc;
    }
}
