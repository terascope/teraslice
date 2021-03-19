import { FieldTypeConfig, AvailableType } from '@terascope/data-types';
import { AnyObject } from '@terascope/utils';
import { DataTypeFieldConfig, FieldType, DataTypeFields } from 'packages/types/dist/src';

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

export interface ExtractFieldConfig {
    regex?: string;
    isMultiValue?: boolean;
    jexlExp?: string;
    start?: any;
    end?: any;
}

export enum FunctionDefinitionType {
    FIELD_TRANSFORM = 'FIELD_TRANSFORM',
    RECORD_TRANSFORM = 'RECORD_TRANSFORM',
    FIELD_VALIDATION = 'FIELD_VALIDATION',
    RECORD_VALIDATION = 'RECORD_TRANSFORM'
}

export enum ProcessMode {
    /** This indicates that it operations on non-nil individual values */
    INDIVIDUAL_VALUES = 'INDIVIDUAL_VALUES',
    /** This indicates that it operations on entire values, including nulls and arrays */
    FULL_VALUES = 'FULL_VALUES'
}

export interface FunctionDefinitionConfig<T extends Record<string, any>> {
    name: string,
    type: FunctionDefinitionType,
    process_mode: ProcessMode,
    description: string,
    argument_schema?: DataTypeFields,
    required_arguments?: string[]
    create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
        outputConfig?: DataTypeFieldAndChildren,
    ) => (value: unknown) => boolean
    accepts: FieldType[],
    validate_arguments?: (args: T) => void
}

export interface FieldValidateConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    type: FunctionDefinitionType.FIELD_VALIDATION
}

export interface FieldTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    output_type: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren
}

export interface OutputType<T> {
    output_type: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren
}

export interface DataTypeFieldAndChildren {
    field_config: DataTypeFieldConfig,
    child_config?: DataTypeFields
}
// Make a separate one for record level adapters
export type FieldFunctionDefinitions = FieldValidateConfig | FieldTransformConfig;
