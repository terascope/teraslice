
import _ from 'lodash';
import { DataEntity } from '@terascope/job-components';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default class UuidLike extends OperationBase {
    private regex: RegExp;
    constructor(config: OperationConfig) {
        super(config);
        this.regex = /^[^\s]{8}-[^\s]{4}-[^\s]{4}-[^\s]{4}-[^\s]{12}$/g;
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field !== 'string') {
            _.unset(doc, this.source);
            return doc;
        }
        if (field.match(this.regex) === null) _.unset(doc, this.source);
        return doc;
    }
}
