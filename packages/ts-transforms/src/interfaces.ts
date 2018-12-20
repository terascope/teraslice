
import PhaseBase from './operations/lib/base';
export enum NotifyType { matcher = 'matcher', transform = 'transform' }

export interface OperationConfig {
    id?: string;
    selector?: string;
    selector_config?: object | undefined;
    source_field?: string;
    start?: string;
    end?: string;
    target_field?: string;
    regex?: string;
    validation?: string;
    decoder?: string;
    refs?: string;
    post_process?: string;
    remove_source?: boolean;
    registration_selector?:string;
    mutate?: boolean;
    other_match_required?: boolean;
}
// TODO: fix registrationSelector above
export interface Refs {
    refs: string;
    validation?: string;
    post_process?: string;
}

export interface StringRefs extends Refs {
    length?: number;
    target_field?: string;
    source_field: string;
}

export interface ConfigResults {
    registrationSelector?: string;
    targetConfig: OperationConfig | null;
}

export interface NormalizedConfig {
    configuration: OperationConfig;
    registrationSelector: string;
}

export interface OperationsDictionary {
    [key: string]: PhaseBase[];
}

export interface WatcherConfig {
    type: string;
    file_path: string | undefined;
    connection?: string | undefined;
    index?: string | undefined;
    selector_config?: object | undefined;
    actions?: object[];
}

export interface JoinConfig {
    selector?: string;
    operation: string;
    fields: string[];
    target_field: string;
    delimiter?: string;
    remove_source?: boolean;
}

export type injectFn = (config: OperationConfig, list: OperationConfig[]) => void;
export type filterFn = (config: OperationConfig) => boolean;
