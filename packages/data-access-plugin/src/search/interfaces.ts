import { FinalResponse } from '@terascope/data-access';

export interface SearchFn {
    (query: any): Promise<FinalResponse>;
}
