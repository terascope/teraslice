
import { TypeConfig } from 'xlucene-evaluator';
import { DataEntity } from '@terascope/utils';

export enum NotifyType { matcher = 'matcher', transform = 'transform' }

export interface OperationConfig {
    tags?: string[];
    selector?: string;
    source_field?: string;
    source_fields?: string[];
    start?: string;
    end?: string;
    target_field?: string;
    regex?: string;
    validation?: string;
    decoder?: string;
    follow?: string;
    post_process?: string;
    registration_selector?:string;
    mutate?: boolean;
    other_match_required?: boolean;
    length?: number;
    fields?: string[];
    delimiter?: string;
    min?: number;
    max?: number;
    preserve_colons?: boolean;
    case?: 'lowercase' | 'uppercase';
    multivalue?: boolean;
    _multi_target_field?: string;
    value?: any;
    output?: boolean;
    __id: string;
}

export type PluginClassConstructor = { new (): PluginClassType };

export interface PluginClassType {
    init: () => OperationsDict;
}

export type PluginList = PluginClassConstructor[];

export type BaseOperationClass = { new (config: OperationConfig, types?: TypeConfig): Operation };

export interface OperationsDict {
    [op: string]: BaseOperationClass;
}

export interface Operation {
    run(data: DataEntity): null | DataEntity;
}
// TODO: delete the next two
export interface ConfigResults {
    registrationSelector?: string;
    targetConfig: OperationConfig | null;
}

export interface NormalizedConfig {
    configuration: OperationConfig;
    registrationSelector: string;
}

export interface OperationsPipline {
    [key: string]: Operation[];
}

export interface WatcherConfig {
    rules: string[];
    types?: TypeConfig;
}

export interface PhaseConfig extends WatcherConfig {
    type: string;
}

export type injectFn = (config: OperationConfig, list: OperationConfig[]) => void;
export type filterFn = (config: OperationConfig) => boolean;

export interface BoolValidationResult {
    isValid: boolean;
    bool?: boolean;
}

export interface ConfigProcessingDict {
    [field: string]: OperationConfig[];
}

export interface ValidationResults {
    selectors: OperationConfig[];
    extractions: ConfigProcessingDict;
    postProcessing: ConfigProcessingDict;
    output: OutputValidation;
}

export interface NormalizedFields{
    soureField: string[];
    targetField: string|undefined;
}

interface RestrictOutput {
    [field: string]: boolean;
}

interface MatchRequirements {
    [field: string]: string;
}

export interface OutputValidation {
    hasMultiValue: boolean;
    restrictOutput: RestrictOutput;
    matchRequirements: MatchRequirements;
}
