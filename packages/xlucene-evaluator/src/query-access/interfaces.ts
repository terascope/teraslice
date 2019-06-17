import { AnyObject } from '@terascope/utils';
import { TypeConfig } from '../interfaces';

export interface QueryAccessConfig<T extends AnyObject = AnyObject> {
    excludes?: (keyof T)[];
    includes?: (keyof T)[];
    constraint?: string;
    prevent_prefix_wildcard?: boolean;
    allow_implicit_queries?: boolean;
    allow_empty_queries?: boolean;
    type_config?: TypeConfig;
}
