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

export interface Repository {
    [key: string]: {
        fn: any;
        config: ArgSchema;
        output_type?: AvailableType;
        primary_input_type: InputType;
    };
}

interface Config {
    [key: string]: FieldTypeConfig;
}

export type RecordInput = AnyObject | AnyObject[];
