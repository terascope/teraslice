
import { TypeConfig } from 'xlucene-evaluator';
import { DataEntity } from '@terascope/utils';

export enum NotifyType { matcher = 'matcher', transform = 'transform' }

export type UnparsedConfig = {
    selector?: string;
    source_field?: string;
    source_fields?: string[];
    target_field?: string;
    start?: string;
    end?: string;
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
    case?: Case;
    value?: any;
    output?: boolean;
    tag?: string;
};

export type OperationConfig = { __id: string } & Partial<SelectorConfig> & Partial<PostProcessConfig> & Partial<ExtractionConfig>;
// export type OperationConfig = SelectorConfig | PostProcessConfig | ExtractionConfig;

export interface PostProcessConfig {
    __id: string;

    selector?: string;
    source_field?: string;
    source_fields?: string[];
    target_field?: string;

    follow: string;
    tags?: string[];

    start?: string;
    end?: string;
    regex?: string;

    validation?: string;
    decoder?: string;
    post_process?: string;
    mutate?: boolean;
    other_match_required?: boolean;

    length?: number;
    fields?: string[];
    delimiter?: string;
    min?: number;
    max?: number;
    preserve_colons?: boolean;
    case?: Case;
    value?: any;
    output?: boolean;
}

export type Case = 'lowercase' | 'uppercase';

export interface SelectorConfig {
    __id: string;
    selector: string;
}

export interface ExtractionConfig {
    __id: string;
    start?: string;
    end?: string;
    regex?: RegExp;
    mutate: boolean;
    output?: boolean;
    source_field: string;
    target_field: string;
    other_match_required?: boolean;
}

export type PluginClassConstructor = { new (): PluginClassType };

export interface PluginClassType {
    init: () => OperationsDict;
}

export type PluginList = PluginClassConstructor[];

export type BaseOperationClass = { new (config: any, types?: TypeConfig): Operation, cardinality:InputOutputCardinality };

export interface OperationsDict {
    [op: string]: BaseOperationClass;
}

export interface Operation {
    config:OperationConfig;
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

export interface OperationsMapping {
    [key: string]: Operation;
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

export interface ExtractionProcessingDict {
    [field: string]: ExtractionConfig[];
}

export interface PostProcessingDict {
    [field: string]: PostProcessConfig[];
}

export interface ValidationResults {
    selectors: SelectorConfig[];
    extractions: ExtractionProcessingDict;
    postProcessing: PostProcessingDict;
    output: OutputValidation;
}

export interface NormalizedFields{
    soureField: string[];
    targetField: string|undefined;
}

export interface StateDict {
    [field: string]: string[];
}

interface RestrictOutput {
    [field: string]: boolean;
}

export interface MatchRequirements {
    [field: string]: string;
}

export interface OutputValidation {
    restrictOutput: RestrictOutput;
    matchRequirements: MatchRequirements;
}

export type InputOutputCardinality = 'one-to-one' | 'many-to-one';
