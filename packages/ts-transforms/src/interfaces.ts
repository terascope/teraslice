
import { DataEntity } from '@terascope/job-components';

export enum NotifyType { matcher = 'matcher', transform = 'transform' }

export interface OperationConfig {
    tag?: string;
    selector?: string;
    types?: object | undefined;
    source_field?: string;
    start?: string;
    end?: string;
    target_field?: string;
    regex?: string;
    validation?: string;
    decoder?: string;
    follow?: string;
    post_process?: string;
    remove_source?: boolean;
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
}

export interface SelectorTypes {
    [field: string]: string;
}

export type PluginClassConstructor = { new (): PluginClassType };

export interface PluginClassType {
    init: () => OperationsDict;
}

export type PluginList = PluginClassConstructor[];

export type BaseOperationClass = { new (config: OperationConfig, types?: SelectorTypes): Operation };

export interface OperationsDict {
    [op: string]: BaseOperationClass;
}

export interface Operation {
    run(data: DataEntity): null | DataEntity;
}

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
    type: string;
    rules: string[];
    plugins?: string[];
    types?: SelectorTypes;
}

export type injectFn = (config: OperationConfig, list: OperationConfig[]) => void;
export type filterFn = (config: OperationConfig) => boolean;

export interface BoolValidation {
    isValid: boolean;
    bool?: boolean;
}
