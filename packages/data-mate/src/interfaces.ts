import { FieldTypeConfig } from '@terascope/data-types';

export type ArgSchema = Config & { description?: string };

export interface Repository {
    [key: string]: {
        fn: any;
        config: ArgSchema;
    };
}

interface Config {
    [key: string]: FieldTypeConfig;
}
