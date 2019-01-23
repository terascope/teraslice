
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../interfaces';
import TransformBase from './base';

export default class Lowercase extends TransformBase {
    private destination: string;
    private hasTarget: boolean;

    constructor(config: OperationConfig) {
        super(config);
        this.hasTarget = this.target !== this.source;
        this.destination = this.hasTarget ? this.target : this.source;
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field === 'string') {
            _.set(doc, this.destination, field.toLowerCase());
            if (this.hasTarget) _.unset(doc, this.source);
        } else {
            _.unset(doc, this.source);
        }
        return doc;
    }
}
