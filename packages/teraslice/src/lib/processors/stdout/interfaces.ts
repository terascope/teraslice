import { OpConfig } from '@terascope/job-components';

export interface StdoutConfig extends OpConfig {
    limit: number;
}
