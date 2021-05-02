import { addConfig } from './add';
import { addValuesConfig } from './addValues';
import { divideConfig } from './divide';
import { divideValuesConfig } from './divideValues';
import { inNumberRangeConfig } from './inNumberRange';
import { subtractConfig } from './subtract';
import { subtractValuesConfig } from './subtractValues';

export const numericRepository = {
    add: addConfig,
    addValues: addValuesConfig,
    divide: divideConfig,
    divideValues: divideValuesConfig,
    inNumberRange: inNumberRangeConfig,
    subtract: subtractConfig,
    subtractValues: subtractValuesConfig,
};
