import { OpConfig } from '../../interfaces/index.js';

export interface CollectConfig extends OpConfig {
    wait: number;
    size: number;
}
