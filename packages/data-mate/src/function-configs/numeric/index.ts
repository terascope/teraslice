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
import { expConfig } from './exp';
import { expm1Config } from './expm1';
import { floorConfig } from './floor';
import { froundConfig } from './fround';
import { inNumberRangeConfig } from './inNumberRange';
import { isEvenConfig } from './isEven';
import { isGreaterThanConfig } from './isGreaterThan';
import { isGreaterThanOrEqualToConfig } from './isGreaterThanOrEqual';
import { isLessThanConfig } from './isLessThan';
import { isLessThanOrEqualToConfig } from './isLessThanOrEqual';
import { isOddConfig } from './isOdd';
import { logConfig } from './log';
import { log10Config } from './log10';
import { log1pConfig } from './log1p';
import { log2Config } from './log2';
import { minValuesConfig } from './minValues';
import { modulusConfig } from './modulus';
import { multiplyConfig } from './multiply';
import { multiplyValuesConfig } from './multiplyValues';
import { powConfig } from './pow';
import { randomConfig } from './random';
import { roundConfig } from './round';
import { signConfig } from './sign';
import { sinConfig } from './sin';
import { sinhConfig } from './sinh';
import { sqrtConfig } from './sqrt';
import { subtractConfig } from './subtract';
import { subtractValuesConfig } from './subtractValues';
import { tanConfig } from './tan';
import { tanhConfig } from './tanh';
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
    exp: expConfig,
    expm1: expm1Config,
    floor: floorConfig,
    fround: froundConfig,
    inNumberRange: inNumberRangeConfig,
    isEven: isEvenConfig,
    isGreaterThan: isGreaterThanConfig,
    isGreaterThanOrEqualTo: isGreaterThanOrEqualToConfig,
    isLessThan: isLessThanConfig,
    isLessThanOrEqualTo: isLessThanOrEqualToConfig,
    isOdd: isOddConfig,
    log: logConfig,
    log1p: log1pConfig,
    log2: log2Config,
    log10: log10Config,
    minValues: minValuesConfig,
    modulus: modulusConfig,
    multiply: multiplyConfig,
    multiplyValues: multiplyValuesConfig,
    pow: powConfig,
    random: randomConfig,
    round: roundConfig,
    sign: signConfig,
    sin: sinConfig,
    sinh: sinhConfig,
    sqrt: sqrtConfig,
    subtract: subtractConfig,
    subtractValues: subtractValuesConfig,
    tan: tanConfig,
    tanh: tanhConfig,
    toCelsius: toCelsiusConfig,
    toFahrenheit: toFahrenheitConfig,
    toPrecision: toPrecisionConfig,
};
