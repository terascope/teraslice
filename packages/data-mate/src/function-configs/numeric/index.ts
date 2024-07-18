import { absConfig } from './abs.js';
import { acosConfig } from './acos.js';
import { acoshConfig } from './acosh.js';
import { addConfig, AddArgs } from './add.js';
import { addValuesConfig } from './addValues.js';
import { asinConfig } from './asin.js';
import { asinhConfig } from './asinh.js';
import { atanConfig } from './atan.js';
import { atan2Config } from './atan2.js';
import { atanhConfig } from './atanh.js';
import { cbrtConfig } from './cbrt.js';
import { ceilConfig } from './ceil.js';
import { clz32Config } from './clz32.js';
import { cosConfig } from './cos.js';
import { coshConfig } from './cosh.js';
import { divideConfig, DivideArgs } from './divide.js';
import { divideValuesConfig } from './divideValues.js';
import { expConfig } from './exp.js';
import { expm1Config } from './expm1.js';
import { floorConfig } from './floor.js';
import { froundConfig } from './fround.js';
import { hypotConfig } from './hypot.js';
import { inNumberRangeConfig, InNumberRangeArg } from './inNumberRange.js';
import { isEvenConfig } from './isEven.js';
import { isGreaterThanConfig, GreaterThanArgs } from './isGreaterThan.js';
import { isGreaterThanOrEqualToConfig, GreaterThanOrEqualToArgs } from './isGreaterThanOrEqualTo.js';
import { isLessThanConfig, LessThanArgs } from './isLessThan.js';
import { isLessThanOrEqualToConfig, LessThanOrEqualToArgs } from './isLessThanOrEqualTo.js';
import { isOddConfig } from './isOdd.js';
import { logConfig } from './log.js';
import { log10Config } from './log10.js';
import { log1pConfig } from './log1p.js';
import { log2Config } from './log2.js';
import { maxValuesConfig } from './maxValues.js';
import { minValuesConfig } from './minValues.js';
import { modulusConfig, ModulusArgs } from './modulus.js';
import { multiplyConfig, MultiplyArgs } from './multiply.js';
import { multiplyValuesConfig } from './multiplyValues.js';
import { powConfig, PowerArgs } from './pow.js';
import { randomConfig, RandomArgs } from './random.js';
import { roundConfig } from './round.js';
import { setPrecisionConfig, SetPrecisionArgs } from './setPrecision.js';
import { signConfig } from './sign.js';
import { sinConfig } from './sin.js';
import { sinhConfig } from './sinh.js';
import { sqrtConfig } from './sqrt.js';
import { subtractConfig, SubtractArgs } from './subtract.js';
import { subtractValuesConfig } from './subtractValues.js';
import { tanConfig } from './tan.js';
import { tanhConfig } from './tanh.js';
import { toCelsiusConfig } from './toCelsius.js';
import { toFahrenheitConfig } from './toFahrenheit.js';
import { toNumberConfig } from './toNumber.js';

export const numericRepository = {
    abs: absConfig,
    acos: acosConfig,
    acosh: acoshConfig,
    add: addConfig,
    addValues: addValuesConfig,
    asin: asinConfig,
    asinh: asinhConfig,
    atan: atanConfig,
    atan2: atan2Config,
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
    hypot: hypotConfig,
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
    maxValues: maxValuesConfig,
    minValues: minValuesConfig,
    modulus: modulusConfig,
    multiply: multiplyConfig,
    multiplyValues: multiplyValuesConfig,
    pow: powConfig,
    random: randomConfig,
    round: roundConfig,
    setPrecision: setPrecisionConfig,
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
    toNumber: toNumberConfig,
};

export type {
    AddArgs,
    DivideArgs,
    GreaterThanArgs,
    GreaterThanOrEqualToArgs,
    InNumberRangeArg,
    LessThanArgs,
    LessThanOrEqualToArgs,
    ModulusArgs,
    MultiplyArgs,
    PowerArgs,
    RandomArgs,
    SetPrecisionArgs,
    SubtractArgs
};
