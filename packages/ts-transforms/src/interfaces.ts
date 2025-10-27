import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import { DataEntity } from '@terascope/core-utils';
import { Extraction } from './operations/index.js';

export type OperationConfigInput = Partial<OperationConfig> & {
    tag?: string;
};

export type OperationConfig
    = { __id: string; target_field?: string; source_field?: string }
        & Partial<SelectorConfig>
        & Partial<PostProcessConfig>
        & Partial<ExtractionConfig>;

export interface PostProcessConfig {
    __id: string;

    selector?: string;
    source?: string;
    sources?: string[];
    target?: string;

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

    hash?: string;

    __pipeline?: string;
}

export type Case = 'lowercase' | 'uppercase';

export interface SelectorConfig {
    __id: string;
    selector: string;
}

export interface MatcherConfig {
    type_config?: xLuceneTypeConfig;
    variables?: xLuceneVariables;
}

export interface ExtractionConfig {
    __id: string;
    start?: string;
    end?: string;
    regex?: string;
    /**
     * exp is a jexl expression string, please refer to https://github.com/TomFrost/Jexl for detailed information.
     *
     */
    exp?: string;
    mutate: boolean;
    output?: boolean;
    source?: string;
    target: string;
    other_match_required?: boolean;
    multivalue?: boolean;
    deepSourceField?: boolean;
}

export type PluginClassConstructor = { new (): PluginClassType };

export interface PluginClassType {
    init: () => OperationsDict;
}

export type PluginList = PluginClassConstructor[];

export type BaseOperationClass = {
    new (config: any, ...args: any[]): Operation;
    cardinality: InputOutputCardinality;
};

export interface OperationsDict {
    [op: string]: BaseOperationClass;
}

export interface Operation {
    config?: OperationConfig;
    run(data: DataEntity): null | DataEntity;
}

export interface OperationsPipline {
    [key: string]: Operation[];
}

export interface ExtractionPipline {
    [key: string]: Extraction[];
}

export interface OperationsMapping {
    [key: string]: Operation;
}

export interface WatcherConfig {
    rules?: string[];
    type_config?: xLuceneTypeConfig;
    variables?: xLuceneVariables;
    notification_rules?: string;
}

export interface PhaseConfig extends WatcherConfig {
    type: string;
}

export interface BoolValidationResult {
    isValid: boolean;
    bool?: boolean;
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
