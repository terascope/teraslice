/* eslint-disable no-console */

import _ from 'lodash';
import { BatchProcessor } from '@terascope/job-components';

export default class Stdout extends BatchProcessor {
    async onBatch(data) {
        if (this.opConfig.limit === 0) {
            console.log(data);
        } else {
            console.log(_.take(data, this.opConfig.limit));
        }
        return data;
    }
}
