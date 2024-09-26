import { APICore } from '@terascope/job-components';

export interface SimpleAPIConfig {

}

export interface SimpleAPI extends APICore {
    count: number;
    add(n?: number): void;
    sub(n?: number): void;
}
