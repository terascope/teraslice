import 'jest-extended';
import {
    DataEntity,
    parseJSON,
    getTypeOf,
    isEmpty,
    parseList,
    parseNumberList,
    toNumber,
} from '../src';

describe('Utils', () => {
    describe('isEmpty', () => {
        const map = new Map();
        map.set('hello', 'hello');

        const set = new Set();
        set.add(1);

        describe.each([
            [null, true],
            [undefined, true],
            [{}, true],
            [false, true],
            [true, true],
            [-1, true],
            [0, true],
            [1, true],
            [[], true],
            ['', true],
            [new Map(), true],
            [new Set(), true],
            [{ hi: true }, false],
            [map, false],
            [set, false],
            [[1, 2], false],
            [[null], false],
            ['howdy', false],
        // @ts-ignore
        ])('when given %p', (input, expected) => {
            it(`should return ${expected ? 'true' : 'false'}`, () => {
                expect(isEmpty(input)).toBe(expected);
            });
        });
    });

    describe('parseJSON', () => {
        it('should handle a json encoded Buffer', () => {
            const input = Buffer.from(JSON.stringify({ foo: 'bar' }));
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        // TODO: We may need to add support for this?
        // eslint-disable-next-line jest/no-disabled-tests
        xit('should handle a json base64 encoded Buffer', () => {
            const input = Buffer.from(JSON.stringify({ foo: 'bar' }), 'base64');
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should handle a json encoded string', () => {
            const input = JSON.stringify({ foo: 'bar' });
            expect(parseJSON(input)).toEqual({ foo: 'bar' });
        });

        it('should throw a TypeError if given a non-buffer', () => {
            expect(() => {
                // @ts-ignore
                parseJSON(123);
            }).toThrowError('Failure to serialize non-buffer, got "Number"');
        });

        it('should throw an Error if given invalid json', () => {
            expect(() => {
                parseJSON(Buffer.from('foo:bar'));
            }).toThrowError(/^Failure to parse buffer, SyntaxError:/);
        });
    });

    describe('getTypeOf', () => {
        it('should return the correct kind', () => {
            expect(getTypeOf({})).toEqual('Object');

            expect(getTypeOf(new DataEntity({}))).toEqual('DataEntity');
            expect(getTypeOf(DataEntity.make({}))).toEqual('DataEntity');

            expect(getTypeOf([])).toEqual('Array');

            const fn = () => 123;

            function hello() {
                return 'hello';
            }

            expect(getTypeOf(fn)).toEqual('Function');
            expect(getTypeOf(hello)).toEqual('Function');

            expect(getTypeOf(Buffer.from('hello'))).toEqual('Buffer');
            expect(getTypeOf('hello')).toEqual('String');

            expect(getTypeOf(123)).toEqual('Number');

            expect(getTypeOf(null)).toEqual('null');
            expect(getTypeOf(undefined)).toEqual('undefined');

            const error = new Error('Hello');
            expect(getTypeOf(error)).toEqual('Error');
        });
    });

    describe('parseList', () => {
        test.each([
            ['a', ['a']],
            ['a,b,c', ['a', 'b', 'c']],
            ['a , b,c,   ', ['a', 'b', 'c']],
            [['a ', ' b ', 'c ', false, '', null], ['a', 'b', 'c']],
            [null, []]
        // @ts-ignore
        ])('should parse %j to be %j', (input, expected) => {
            expect(parseList(input)).toEqual(expected);
        });
    });

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
