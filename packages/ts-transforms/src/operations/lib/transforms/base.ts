
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default abstract class TransformOpBase extends OperationBase {

    constructor(config: OperationConfig) {
        super(config);
    }

    protected decode(doc: DataEntity, decodeFn: Function) {
        try {
            const data = _.get(doc, this.source);
            if (typeof data !== 'string') {
                this.removeSource(doc);
            } else {
                this.set(doc, decodeFn(data));
            }
        } catch (err) {
            this.removeSource(doc);
        }
        return doc;
    }

    abstract run(data: DataEntity): null | DataEntity;
}
