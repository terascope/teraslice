/* eslint-disable no-console */

import { take } from 'lodash-es';
import { BatchProcessor } from '@terascope/job-components';

export default class Stdout extends BatchProcessor {
    async onBatch(data) {
        if (this.opConfig.limit === 0) {
            console.log(data);
        } else {
            console.log(take(data, this.opConfig.limit));
        }
        return data;
    }
}
