import { Teraslice } from '@terascope/types';

export interface CollectConfig extends Teraslice.OpConfig {
    wait: number;
    size: number;
}
