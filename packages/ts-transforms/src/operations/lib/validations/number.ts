
import _ from 'lodash';
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base';

export default class NumberValidation extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field === 'number') return doc;
        if (typeof field === 'string') {
            const results = _.toNumber(field);
            if (!_.isNaN(results)) {
                _.set(doc, this.source, results);
                return doc;
            }
        }
        // if we are here it must be another type so we unset it
        _.unset(doc, this.source);
        return doc;
    }
}
