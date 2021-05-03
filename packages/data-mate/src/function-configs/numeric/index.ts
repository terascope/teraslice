import { addConfig } from './add';
import { addValuesConfig } from './addValues';
import { divideConfig } from './divide';
import { divideValuesConfig } from './divideValues';
import { inNumberRangeConfig } from './inNumberRange';
import { isEvenConfig } from './isEven';
import { isGreaterThanConfig } from './isGreaterThan';
import { isGreaterThanOrEqualToConfig } from './isGreaterThanOrEqual';
import { isLessThanConfig } from './isLessThan';
import { isLessThanOrEqualToConfig } from './isLessThanOrEqual';
import { isOddConfig } from './isOdd';
import { modulusConfig } from './modulus';
import { multiplyConfig } from './multiply';
import { multiplyValuesConfig } from './multiplyValues';
import { subtractConfig } from './subtract';
import { subtractValuesConfig } from './subtractValues';
import { toCelsiusConfig } from './toCelsius';
import { toFahrenheitConfig } from './toFahrenheit';
import { toPrecisionConfig } from './toPrecision';

export const numericRepository = {
    add: addConfig,
    addValues: addValuesConfig,
    divide: divideConfig,
    divideValues: divideValuesConfig,
    inNumberRange: inNumberRangeConfig,
    isEven: isEvenConfig,
    isGreaterThan: isGreaterThanConfig,
    isGreaterThanOrEqualTo: isGreaterThanOrEqualToConfig,
    isLessThan: isLessThanConfig,
    isLessThanOrEqualTo: isLessThanOrEqualToConfig,
    isOdd: isOddConfig,
    modulus: modulusConfig,
    multiply: multiplyConfig,
    multiplyValues: multiplyValuesConfig,
    subtract: subtractConfig,
    subtractValues: subtractValuesConfig,
    toCelsius: toCelsiusConfig,
    toFahrenheit: toFahrenheitConfig,
    toPrecision: toPrecisionConfig,
};
