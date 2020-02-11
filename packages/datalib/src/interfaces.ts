import { EmptyObject } from '@terascope/utils';
import { FieldTypeConfig } from '@terascope/data-types';

export type RepoConfig = Config & EmptyObject;

export interface Repository {
    [key: string]: {
        fn: any;
        config: RepoConfig;
    };
}

interface Config {
    [key: string]: FieldTypeConfig;
}
