import { addConfig } from './add';
import { addValuesConfig } from './addValues';
import { divideConfig } from './divide';
import { divideValuesConfig } from './divideValues';
import { inNumberRangeConfig } from './inNumberRange';
import { isGreaterThanConfig } from './isGreaterThan';
import { isGreaterThanOrEqualToConfig } from './isGreaterThanOrEqual';
import { isLessThanConfig } from './isLessThan';
import { isLessThanOrEqualToConfig } from './isLessThanOrEqual';
import { modulusConfig } from './modulus';
import { multiplyConfig } from './multiply';
import { multiplyValuesConfig } from './multiplyValues';
import { subtractConfig } from './subtract';
import { subtractValuesConfig } from './subtractValues';
import { toPrecisionConfig } from './toPrecision';

export const numericRepository = {
    add: addConfig,
    addValues: addValuesConfig,
    divide: divideConfig,
    divideValues: divideValuesConfig,
    inNumberRange: inNumberRangeConfig,
    isGreaterThan: isGreaterThanConfig,
    isGreaterThanOrEqualTo: isGreaterThanOrEqualToConfig,
    isLessThan: isLessThanConfig,
    isLessThanOrEqualTo: isLessThanOrEqualToConfig,
    modulus: modulusConfig,
    multiply: multiplyConfig,
    multiplyValues: multiplyValuesConfig,
    subtract: subtractConfig,
    subtractValues: subtractValuesConfig,
    toPrecision: toPrecisionConfig,
};
