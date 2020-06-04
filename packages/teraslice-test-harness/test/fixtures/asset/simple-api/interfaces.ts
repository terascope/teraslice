import { APICore } from '@terascope/job-components';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SimpleAPIConfig {

}

export interface SimpleAPI extends APICore {
    count: number;
    add(n?: number): void;
    sub(n?: number): void;
}
