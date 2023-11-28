import { OpConfig } from '@terascope/job-components';

export interface ScriptConfig extends OpConfig {
    command: string;
    args: string[];
    options: Record<string, any>
    asset: string
}
