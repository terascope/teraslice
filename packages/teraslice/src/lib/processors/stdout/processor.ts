/* eslint-disable no-console */

import _ from 'lodash';
import { BatchProcessor } from '@terascope/job-components';
import { StdoutConfig } from './interfaces.js';

export default class Stdout extends BatchProcessor<StdoutConfig> {
    async onBatch(data: any) {
        if (this.opConfig.limit === 0) {
            console.log(data);
        } else {
            console.log(_.take(data, this.opConfig.limit));
        }
        return data;
    }
}