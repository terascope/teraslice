import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { AnyObject } from '@terascope/utils';

export type ArgSchema = Config & { description?: string };

export enum InputType {
    String = 'String',
    Array = 'Array',
    Number = 'Number',
    Boolean = 'Boolean',
    Object = 'Object',
    Any = 'Any'
}

export interface RepoConfig {
    fn: any;
    config: ArgSchema;
    output_type?: FieldType;
    primary_input_type: InputType;
}

export interface Repository {
    [key: string]: RepoConfig;
}

interface Config {
    [key: string]: DataTypeFieldConfig;
}

export type RecordInput = AnyObject | AnyObject[];

export interface ExtractFieldConfig {
    regex?: string;
    isMultiValue?: boolean;
    jexlExp?: string;
    start?: any;
    end?: any;
}
