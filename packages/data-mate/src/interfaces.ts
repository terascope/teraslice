import { FieldTypeConfig, AvailableType } from '@terascope/data-types';
import { AnyObject } from '@terascope/utils';

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

export type RecordInput = AnyObject | AnyObject[];
