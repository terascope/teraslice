import { addConfig } from './add';
import { addValuesConfig } from './addValues';
import { divideConfig } from './divide';
import { divideValuesConfig } from './divideValues';
import { inNumberRangeConfig } from './inNumberRange';
import { multiplyConfig } from './multiply';
import { multiplyValuesConfig } from './multiplyValues';
import { subtractConfig } from './subtract';
import { subtractValuesConfig } from './subtractValues';

export const numericRepository = {
    add: addConfig,
    addValues: addValuesConfig,
    divide: divideConfig,
    divideValues: divideValuesConfig,
    inNumberRange: inNumberRangeConfig,
    multiply: multiplyConfig,
    multiplyValues: multiplyValuesConfig,
    subtract: subtractConfig,
    subtractValues: subtractValuesConfig,
};
