
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import net from 'net';
import OperationBase from '../base'

export default class Ip extends OperationBase { 
    constructor(config: OperationConfig) {
        super(config);
    }
    
    run(doc: DataEntity): DataEntity | null {
        if (net.isIP(doc[this.source]) === 0) _.unset(doc, this.source);
        return doc;
    }
}