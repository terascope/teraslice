
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base'

export default class Boolean extends OperationBase { 
    constructor(config: OperationConfig) {
        super(config);
    }
    
    run(doc: DataEntity): DataEntity | null {
        if (!_.isBoolean(doc[this.source])) _.unset(doc, this.source);
        return doc;
    }
}