import { FieldTypeConfig, AvailableType } from '@terascope/data-types';

export type ArgSchema = Config & { description?: string };

export interface Repository {
    [key: string]: {
        fn: any;
        config: ArgSchema;
        output_type?: AvailableType;
    };
}

interface Config {
    [key: string]: FieldTypeConfig;
}
