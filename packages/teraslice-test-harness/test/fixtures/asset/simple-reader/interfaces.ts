import { OpConfig } from '@terascope/job-components';

export interface SimpleReaderConfig extends OpConfig {
    slicesToCreate: number;
    recordsToFetch: number;
}
