
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base'

export default class Email extends OperationBase { 
    private regex: RegExp;

    constructor(config: OperationConfig) {
        super();
        this.validate(config);
        // Email Validation as per RFC2822 standards. Straight from .net helpfiles
        this.regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
    }
    
    run(doc: DataEntity | null): DataEntity | null {
        if (!doc) return doc;
        const field = doc[this.source];
        if (typeof field !== 'string' || !field.match(this.regex)) _.unset(doc, this.source);
        return doc;
    }
}
