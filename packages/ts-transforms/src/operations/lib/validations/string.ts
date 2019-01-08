
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';

export default class StringValidation extends OperationBase {
    private length?: number;

    constructor(config: OperationConfig) {
        super(config);
        this.length = config.length;
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field !== 'string') _.unset(doc, this.source);
        if (this.length && field && field.length !== this.length) _.unset(doc, this.source);
        return doc;
    }
}
