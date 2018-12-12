
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import * as url from 'valid-url';
import OperationBase from '../base'

export default class Url extends OperationBase { 
    constructor(config: OperationConfig) {
        super();
        this.validate(config);
    }
    
    run(doc: DataEntity | null): DataEntity | null {
        if (!doc) return doc;
        if (typeof doc[this.source] !== 'string' || !url.isUri(doc[this.source])) _.unset(doc, this.source);
        return doc;
    }
}
