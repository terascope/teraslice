import { addConfig } from './add';
import { divideConfig } from './divide';
import { divideValuesConfig } from './divideValues';
import { inNumberRangeConfig } from './inNumberRange';
import { subtractConfig } from './subtract';

export const numericRepository = {
    add: addConfig,
    divide: divideConfig,
    divideValues: divideValuesConfig,
    inNumberRange: inNumberRangeConfig,
    subtract: subtractConfig
};
