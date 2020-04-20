import { FieldTypeConfig, AvailableType } from '@terascope/data-types';
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
    output_type?: AvailableType;
    primary_input_type: InputType;
}

export interface Repository {
    [key: string]: RepoConfig;
}

interface Config {
    [key: string]: FieldTypeConfig;
}

export type RecordInput = AnyObject | AnyObject[];
