import { OpConfig } from '@terascope/job-components';

export interface SaveFileConfig extends OpConfig {
    file_path: string;
}
