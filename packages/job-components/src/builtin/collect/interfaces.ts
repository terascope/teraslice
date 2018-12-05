import { OpConfig } from '../../interfaces';

export interface CollectConfig extends OpConfig {
    wait: number;
    size: number;
}
