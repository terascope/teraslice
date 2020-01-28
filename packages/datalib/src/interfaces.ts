import { EmptyObject } from '@terascope/utils';

export type RepoConfig = Config | EmptyObject;

export interface Repository {
    [key: string]: {
        fn: any;
        config: RepoConfig;
    };
}

interface Config {
    [key: string]: {
        type: string;
    };
}

export interface ValidationResults {
    isValid: boolean;
    error?: string;
}
