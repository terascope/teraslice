import { AnyObject } from '@terascope/utils';
import { TypeConfig } from '../interfaces';

export interface QueryAccessConfig<T extends AnyObject = AnyObject> {
    excludes?: (keyof T)[];
    includes?: (keyof T)[];
    constraint?: string;
    prevent_prefix_wildcard?: boolean;
    allow_implicit_queries?: boolean;
    /** allow empty an empty query, and convert it to a wildcard query */
    convert_empty_query_to_wildcard?: boolean;
    type_config?: TypeConfig;
}
