import { absConfig } from './abs';
import { acosConfig } from './acos';
import { acoshConfig } from './acosh';
import { addConfig } from './add';
import { addValuesConfig } from './addValues';
import { asinConfig } from './asin';
import { asinhConfig } from './asinh';
import { atanConfig } from './atan';
import { atanhConfig } from './atanh';
import { cbrtConfig } from './cbrt';
import { ceilConfig } from './ceil';
import { clz32Config } from './clz32';
import { cosConfig } from './cos';
import { coshConfig } from './cosh';
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
    abs: absConfig,
    acos: acosConfig,
    acosh: acoshConfig,
    add: addConfig,
    addValues: addValuesConfig,
    asin: asinConfig,
    asinh: asinhConfig,
    atan: atanConfig,
    atanh: atanhConfig,
    cbrt: cbrtConfig,
    ceil: ceilConfig,
    clz32: clz32Config,
    cos: cosConfig,
    cosh: coshConfig,
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
