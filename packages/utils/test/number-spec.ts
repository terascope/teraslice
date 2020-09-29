import 'jest-extended';
import {
    parseNumberList,
    toFloat,
    toNumber,
    toInteger,
    toBigInt,
    bigIntToJSON,
    isBigInt
} from '../src/numbers';

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
            [Number.NEGATIVE_INFINITY, false],
            [Number.POSITIVE_INFINITY, false],
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
            [Infinity, false],
            [Number.NEGATIVE_INFINITY, false],
            [Number.POSITIVE_INFINITY, false],
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
        ])('should convert %p to be %p', (input, expected) => {
            expect(serialize(toBigInt(input))).toEqual(serialize(expected));
        });

        function serialize(input: unknown) {
            if (!isBigInt(input)) return false;
            return bigIntToJSON(input);
        }
    });
});
