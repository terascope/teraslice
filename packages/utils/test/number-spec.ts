import 'jest-extended';
import {
    parseNumberList,
    toNumber
} from '../src/numbers';

describe('Numbers', () => {
    describe('parseNumberList', () => {
        test.each([
            ['a', []],
            ['33.435518 , -111.873616 ,', [33.435518, -111.873616]],
            [[33.435518, -111.873616], [33.435518, -111.873616]],
            [['33.435518 ', -111.873616], [33.435518, -111.873616]],
            [[Infinity, 0, 'c ', '', null, 10], [Infinity, 0, 10]],
            [[Infinity, 0, 'c ', '', null, 10], [Infinity, 0, 10]],
            [null, []]
        // @ts-ignore
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
        // @ts-ignore
        ])('should convert %j to be %j', (input, expected) => {
            expect(toNumber(input)).toEqual(expected);
        });
    });
});
