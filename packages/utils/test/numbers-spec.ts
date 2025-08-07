import 'jest-extended';
import {
    parseNumberList,
    toFloat,
    toNumber,
    toInteger,
    toBigInt,
    bigIntToJSON,
    isBigInt,
    inNumberRange,
    setPrecision,
    toFahrenheit,
    toCelsius
} from '../src/numbers.js';

describe('Numbers', () => {
    const bigNumber = BigInt(Number.MAX_SAFE_INTEGER) * BigInt(2);
    describe('parseNumberList', () => {
        test.each([
            ['a', []],
            ['33.435518 , -111.873616 ,', [33.435518, -111.873616]],
            [[33.435518, -111.873616], [33.435518, -111.873616]],
            [['33.435518 ', -111.873616], [33.435518, -111.873616]],
            [[Infinity, 0, 'c ', '', null, 10], [Infinity, 0, 10]],
            [[Infinity, 0, 'c ', '', null, 10], [Infinity, 0, 10]],
            [null, []]
        ])('should parse %j to be %j', (input, expected) => {
            expect(parseNumberList(input)).toEqual(expected);
        });
    });

    describe('toNumber', () => {
        test.each([
            ['33.435518', 33.435518],
            [' 33.435518     ', 33.435518],
            [0, 0],
            [Infinity, Infinity],
            ['Infinity', Infinity],
            [null, 0],
            [2335, 2335],
            [BigInt(2335), 2335],
            [false, 0],
            [true, 1],
            [' ', 0],
            ['', 0],
            ['uhoh', Number.NaN],
            [Buffer.from('idk'), Number.NaN],
            [Buffer.from('0'), 0],
            [Buffer.from('1'), 1],
            [{ a: 1 }, Number.NaN],
            [{ }, Number.NaN],
            [[], 0],
            [[1], 1],
        ])('should convert %p to be %p', (input, expected) => {
            expect(toNumber(input)).toEqual(expected);
        });
    });

    describe('toFloat', () => {
        test.each([
            ['33.435518', 33.435518],
            [' 33.435518     ', 33.435518],
            [' 33,2004-.435518     ', false],
            ['+333.2333', +333.2333],
            ['++333.2333', false],
            ['-433', -433],
            [0, 0],
            [Number.NEGATIVE_INFINITY, -Infinity],
            [Number.POSITIVE_INFINITY, Infinity],
            ['Infinity', false],
            [null, false],
            [2335, 2335],
            [BigInt(2335), 2335],
            [bigNumber, false],
            [false, false],
            [true, false],
            [' ', false],
            ['', false],
            ['uhoh', false],
            [Buffer.from('idk'), false],
            [Buffer.from('0'), false],
            [Buffer.from('1'), false],
            [{ a: 1 }, false],
            [{ }, false],
            [[], false],
            [[1], false],
        ])('should convert %p to be %p', (input, expected) => {
            expect(toFloat(input)).toEqual(expected);
        });
    });

    describe('toInteger', () => {
        test.each([
            ['33.435518', 33],
            [' 33.435518     ', 33],
            [' 33,2004-.435518     ', false],
            ['+333.2333', 333],
            ['++333.2333', false],
            ['-433', -433],
            [0, 0],
            [Infinity, Infinity],
            [Number.NEGATIVE_INFINITY, -Infinity],
            [Number.POSITIVE_INFINITY, Infinity],
            ['Infinity', false],
            [null, false],
            [2335, 2335],
            [BigInt(2335), 2335],
            [bigNumber, false],
            [false, false],
            [true, false],
            [' ', false],
            ['', false],
            ['uhoh', false],
            [Buffer.from('idk'), false],
            [Buffer.from('0'), false],
            [Buffer.from('1'), false],
            [{ a: 1 }, false],
            [{ }, false],
            [[], false],
            [[1], false],
        ])('should convert %p to be %p', (input, expected) => {
            expect(toInteger(input)).toEqual(expected);
        });
    });

    describe('toBigInt', () => {
        test.each([
            ['33.435518', BigInt(33)],
            [' 33.435518     ', BigInt(33)],
            [2335, BigInt(2335)],
            [BigInt(2335), BigInt(2335)],
            [Number.MAX_SAFE_INTEGER, BigInt(Number.MAX_SAFE_INTEGER)],
            [bigNumber, bigNumber],
            [0, BigInt(0)],
            [Number.NEGATIVE_INFINITY, false],
            [Number.POSITIVE_INFINITY, false],
            ['Infinity', false],
            [null, false],
            [bigNumber, bigNumber],
            [false, false],
            [true, false],
            [' ', false],
            ['', false],
            ['uhoh', false],
            [Buffer.from('idk'), false],
            [Buffer.from('0'), false],
            [Buffer.from('1'), false],
            [{ a: 1 }, false],
            [{ }, false],
            [[], false],
            [[1], false],
            [`${Number.MAX_SAFE_INTEGER - 2}`, BigInt(Number.MAX_SAFE_INTEGER) - BigInt(2)],
            [`${Number.MAX_SAFE_INTEGER + 2}`, BigInt(Number.MAX_SAFE_INTEGER) + BigInt(2)],
            [`${Number.MAX_SAFE_INTEGER + 10}`, BigInt(Number.MAX_SAFE_INTEGER) + BigInt(10)],
        ])('should convert %p to be %p', (input, expected) => {
            expect(serialize(toBigInt(input))).toEqual(serialize(expected));
        });

        function serialize(input: unknown): string | number | false {
            if (!isBigInt(input)) return false;
            return bigIntToJSON(input);
        }
    });

    describe('bigIntToJSON', () => {
        it('should correctly convert a smaller bigint', () => {
            const actual = bigIntToJSON(BigInt(Number.MAX_SAFE_INTEGER) - BigInt(2));
            expect(actual).toEqual(Number.MAX_SAFE_INTEGER - 2);
        });

        it('should correctly convert a large bigint', () => {
            const actual = bigIntToJSON(BigInt(Number.MAX_SAFE_INTEGER) + BigInt(2));
            expect(actual).toEqual(`${Number.MAX_SAFE_INTEGER + 2}`);
        });

        it('should correctly convert a larger bigint', () => {
            const actual = bigIntToJSON(BigInt(Number.MAX_SAFE_INTEGER) + BigInt(10));
            expect(actual).toEqual(`${Number.MAX_SAFE_INTEGER + 10}`);
        });
    });

    describe('inNumberRange', () => {
        test.each([
            [10, { min: 0, max: 20 }, true],
            [0, { min: 0, max: 20 }, false],
            [0, { min: 0, max: 20, inclusive: true }, true],
            [5, { min: -10, max: 0, inclusive: true }, false],
            [5, { min: -10, max: 5, inclusive: true }, true],
            [10.09373, { min: 10, max: 20.234 }, true],
        ])('should convert %p to be %p', (input, args, expected) => {
            expect(inNumberRange(input, args)).toEqual(expected);
        });
    });

    describe('setPrecision', () => {
        test.each([
            [10.123, 2, false, 10.12],
            [10.123, 2, true, 10.12],
            [10.125, 2, false, 10.13],
            [10.125, 2, true, 10.12],
            [Math.PI, 0, true, 3],
            [1000, 10, true, 1000],
        ])('should convert %p with (digits: %p, truncate: %p) to %p', (input, digits, truncate, expected) => {
            expect(setPrecision(input, digits, truncate)).toEqual(expected);
        });
    });

    describe('toCelsius', () => {
        test.each([
            [32, 0],
            [69.8, 21],
            [26.42, -3.1],
            [17.269, -8.18],
        ])('should convert %p to %p', (input, expected) => {
            expect(trunc(toCelsius(input))).toEqual(expected);
        });
    });

    describe('toFahrenheit', () => {
        test.each([
            [0, 32],
            [21, 69.8],
            [-3.1, 26.42],
            [-8.184, 17.27],
        ])('should convert %p to %p', (input, expected) => {
            expect(trunc(toFahrenheit(input))).toEqual(expected);
        });
    });
});

function trunc(num: number) {
    return Math.round(num * 1000) / 1000;
}
