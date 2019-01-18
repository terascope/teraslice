
import _ from 'lodash';
import * as url from 'valid-url';
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base';

export default class Url extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field !== 'string' || !url.isUri(field)) _.unset(doc, this.source);
        return doc;
    }
}
// $ curl 'localhost:9200/test_index/_search?q=bytes:>=5642000&size=1000'  | ./bin/ts-transform.js -r ../../../transforms/someRules.txt
// ./bin/ts-transform.js -r ../../../transforms/someRules.txt -d 'localhost:9200/test_index/_search?q=bytes:>=5642000&size=1000'
