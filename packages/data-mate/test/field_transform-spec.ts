import 'jest-extended';
import { FieldTransform } from '../src/index.js';

function encodeBase64(input: any) {
    return Buffer.from(input).toString('base64');
}

function encodeUrl(input: any) {
    return encodeURIComponent(input);
}

function encodeHex(input: any) {
    return Buffer.from(input).toString('hex');
}

describe('field FieldTransforms', () => {
    describe('toBoolean should', () => {
        it('return true for truthy values', () => {
            [32, '1', 'string', true, {}, Infinity, new Date(), -87]
                .forEach((v) => expect(FieldTransform.toBoolean(v)).toBe(true));
        });

        it('return false for falsy values', () => {
            [0, false, NaN, '']
                .forEach((v) => expect(FieldTransform.toBoolean(v)).toBe(false));
        });

        it('return false for defined falsy values', () => {
            ['0', 'false', 'no']
                .forEach((v) => expect(FieldTransform.toBoolean(v)).toBe(false));
        });

        it('converts an array values to strings, ignores undefined/null', () => {
            expect(FieldTransform.toBoolean(['foo', 'false', null])).toEqual([true, false]);
        });
    });

    describe('toString should', () => {
        it('convert values to strings', () => {
            expect(FieldTransform.toString('lowercase')).toEqual('lowercase');
            expect(FieldTransform.toString(11111)).toEqual('11111');
            expect(FieldTransform.toString(true)).toEqual('true');
            expect(FieldTransform.toString({ foo: 'bar' })).toEqual('{"foo":"bar"}');
        });

        it('undefined/null returns null', () => {
            expect(FieldTransform.toString(null)).toBe(null);
            expect(FieldTransform.toString(undefined)).toBe(null);
        });

        it('converts an array values to strings, ignores undefined/null', () => {
            expect(FieldTransform.toString([1, 2])).toEqual(['1', '2']);
            expect(FieldTransform.toString([true, undefined, false])).toEqual(['true', 'false']);
            expect(FieldTransform.toString([{ foo: 'bar' }, null])).toEqual(['{"foo":"bar"}']);
        });
    });

    describe('toUpperCase should', () => {
        it('return an upper case string', () => {
            expect(FieldTransform.toUpperCase('lowercase')).toBe('LOWERCASE');
            expect(FieldTransform.toUpperCase('11111')).toBe('11111');
            expect(FieldTransform.toUpperCase('MixEdCAsE')).toBe('MIXEDCASE');
        });

        it('converts an array of values to uppercase, ignores undefined/null', () => {
            expect(FieldTransform.toUpperCase(['MixEdCAsE', undefined, 'lowercase'] as any)).toEqual(['MIXEDCASE', 'LOWERCASE']);
        });
    });

    describe('toLowerCase should', () => {
        it('return a lower case string', () => {
            expect(FieldTransform.toLowerCase('UPPERCASE')).toBe('uppercase');
            expect(FieldTransform.toLowerCase('11111')).toBe('11111');
            expect(FieldTransform.toLowerCase('MixEdCAsE')).toBe('mixedcase');
        });

        it('converts an array of values to lowercase, ignores undefined/null', () => {
            expect(FieldTransform.toLowerCase(['MixEdCAsE', undefined, 'UPPERCASE'] as any)).toEqual(['mixedcase', 'uppercase']);
        });
    });

    describe('setDefault should', () => {
        it('return a value if nothing is provided', () => {
            expect(FieldTransform.setDefault('foo', {}, { value: true })).toEqual('foo');
            expect(FieldTransform.setDefault({ hello: 'world' }, {}, { value: true })).toEqual({ hello: 'world' });
            expect(FieldTransform.setDefault(null, {}, { value: true })).toEqual(true);
            expect(FieldTransform.setDefault(undefined, {}, { value: true })).toEqual(true);
        });
    });

    describe('map should', () => {
        it('map a field FieldTransform function to an array', () => {
            const array = ['hello', 'world', 'goodbye'];
            const results1 = array.map((data) => FieldTransform.toUpperCase(data));
            const results2 = array.map((data) => FieldTransform.truncate(data, {}, { size: 2 }));

            expect(FieldTransform.map(array, array, { fn: 'toUpperCase' })).toEqual(results1);
            expect(FieldTransform.map(array, array, { fn: 'truncate', options: { size: 2 } })).toEqual(results2);
        });
    });

    describe('extract should', () => {
        it('return whats between start and end', () => {
            const results = FieldTransform.extract('<hello>', {}, { start: '<', end: '>' });
            expect(results).toEqual('hello');
        });

        it('can run a jexl expression', () => {
            const results = FieldTransform.extract('bar', { foo: 'bar' }, { jexlExp: '[foo]' });
            expect(results).toEqual(['bar']);
        });

        it('can run a jexl expression with data-mate functions', () => {
            const results = FieldTransform.extract('bar', { foo: 'bar' }, { jexlExp: 'foo|toUpperCase' });
            expect(results).toEqual('BAR');
        });

        it('run a regex to extract a value', () => {
            const results = FieldTransform.extract('hello', {}, { regex: 'he.*' });
            expect(results).toEqual(['hello']);
        });

        it('can return a singular value', () => {
            const results = FieldTransform.extract('hello', {}, { regex: 'he.*', isMultiValue: false });
            expect(results).toEqual('hello');
        });

        it('should not throw if it cannot extract anything', () => {
            const results = FieldTransform.extract('boo', {}, { regex: 'he.*', isMultiValue: false });
            expect(results).toEqual(null);
        });
    });

    describe('trim should', () => {
        it('trim left and right spaces from a string', () => {
            expect(FieldTransform.trim('   string    ')).toBe('string');
            expect(FieldTransform.trim('   left')).toBe('left');
            expect(FieldTransform.trim('right    ')).toBe('right');
            expect(FieldTransform.trim('fast cars race fast', {}, { char: 'fast' })).toBe(' cars race ');
            expect(FieldTransform.trim('.*.*a regex test.*.*.*.*', {}, { char: '.*' })).toBe('a regex test');
            expect(FieldTransform.trim('\t\r\rtrim this\r\r', {}, { char: '\r' })).toBe('\t\r\rtrim this');
            expect(FieldTransform.trim('        ')).toBe('');
        });

        it('should return the string if char is not found', () => {
            expect(FieldTransform.trim('this is a string', {}, { char: 'b' })).toBe('this is a string');
        });

        it('trims an array of values, ignores undefined/null', () => {
            expect(FieldTransform.trim(['   string    ', undefined, 'right    '] as any)).toEqual(['string', 'right']);
        });
    });

    describe('trimStart should', () => {
        it('should return the string trimmed from the start', () => {
            expect(FieldTransform.trimStart('thisisastring', {}, { char: 'this' })).toBe('astring');
            expect(FieldTransform.trimStart('    Hello Bob    ')).toBe('Hello Bob    ');
            expect(FieldTransform.trimStart('iiii-wordiwords-iii', {}, { char: 'i' })).toBe('-wordiwords-iii');
            expect(FieldTransform.trimStart('__--__--__some__--__word', {}, { char: '__--' })).toBe('some__--__word');
            expect(FieldTransform.trimStart('fast cars race fast', {}, { char: 'fast' })).toBe(' cars race fast');
            expect(FieldTransform.trimStart('        ')).toBe('');
            expect(FieldTransform.trimStart('start    ')).toBe('start    ');
            expect(FieldTransform.trimStart('     start')).toBe('start');
        });

        it('should return the string if char is not found', () => {
            expect(FieldTransform.trimStart('this is a string', {}, { char: 'b' })).toBe('this is a string');
        });

        it('trims an array of values at start, ignores undefined/null', () => {
            expect(FieldTransform.trimStart(['    Hello Bob    ', undefined, '     start'] as any)).toEqual(['Hello Bob    ', 'start']);
        });
    });

    describe('trimEnd should', () => {
        it('should return the string trimmed from the end', () => {
            expect(FieldTransform.trimEnd('this is a string', {}, { char: 's' })).toBe('this is a string');
            expect(FieldTransform.trimEnd('    Hello Bob    ')).toBe('    Hello Bob');
            expect(FieldTransform.trimEnd('*****Hello****Bob*****', {}, { char: '*' })).toBe('*****Hello****Bob');
            expect(FieldTransform.trimEnd('fast cars race fast', {}, { char: 'fast' })).toBe('fast cars race ');
            expect(FieldTransform.trimEnd('        ')).toBe('');
            expect(FieldTransform.trimEnd('    end')).toBe('    end');
            expect(FieldTransform.trimEnd('end    ')).toBe('end');
        });

        it('should return the string if char is not found', () => {
            expect(FieldTransform.trimEnd('this is a string', {}, { char: 'b' })).toBe('this is a string');
        });

        it('trims an array of values at end, ignores undefined/null', () => {
            expect(FieldTransform.trimEnd(['    Hello Bob    ', undefined, 'end    '] as any)).toEqual(['    Hello Bob', 'end']);
        });
    });

    describe('truncate should', () => {
        it('return string of designated length', () => {
            expect(FieldTransform.truncate('thisisalongstring', {}, { size: 4 })).toBe('this');
        });

        it('throw an error if args does not have a valid size', () => {
            try {
                expect(FieldTransform.truncate('astring', {}, { size: -120 })).toBe('astring');
            } catch (e) {
                expect(e.message).toBe('Invalid size paramter for truncate');
            }
        });

        it('trim the size of an array of values, ignores undefined/null', () => {
            expect(FieldTransform.truncate(['hello', undefined, 'world'] as any, {}, { size: 2 })).toEqual(['he', 'wo']);
        });
    });

    describe('splitString', () => {
        it('should return an array from a string', () => {
            expect(FieldTransform.splitString('astring')).toEqual(['a', 's', 't', 'r', 'i', 'n', 'g']);
            expect(FieldTransform.splitString('astring', {}, { delimiter: ',' })).toEqual(['astring']);
            expect(FieldTransform.splitString('a-stri-ng', {}, { delimiter: '-' })).toEqual(['a', 'stri', 'ng']);
            expect(FieldTransform.splitString('a string', {}, { delimiter: ' ' })).toEqual(['a', 'string']);
        });
    });

    describe('toNumber should', () => {
        it('return a number from a number string or number', () => {
            expect(FieldTransform.toNumber(12321)).toBe(12321);
            expect(FieldTransform.toNumber('12321')).toBe(12321);
            expect(FieldTransform.toNumber('000011')).toBe(11);
            expect(FieldTransform.toNumber('000011.9834')).toBe(11.9834);
            expect(FieldTransform.toNumber(-34.23432)).toBe(-34.23432);
            expect(FieldTransform.toNumber(Infinity)).toBe(Infinity);
            expect(FieldTransform.toNumber(true)).toBe(1);
        });

        it('return a number for boolean like if selected in args', () => {
            expect(FieldTransform.toNumber(undefined, {}, { booleanLike: true })).toBe(0);
            expect(FieldTransform.toNumber('true', {}, { booleanLike: true })).toBe(1);
            expect(FieldTransform.toNumber('no', {}, { booleanLike: true })).toBe(0);
            expect(FieldTransform.toNumber(null, {}, { booleanLike: true })).toBe(0);
        });

        it('throw an error if input cannot be coerced to a number', () => {
            try {
                expect(FieldTransform.toNumber('bobsyouruncle')).toBe(12321);
            } catch (e) {
                expect(e.message).toBe('Could not convert input of type String to a number');
            }

            try {
                expect(FieldTransform.toNumber({})).toBe(12321);
            } catch (e) {
                expect(e.message).toBe('Could not convert input of type Object to a number');
            }
        });

        it('will return null when given undefined or null', () => {
            expect(FieldTransform.toNumber(undefined)).toBe(null);
            expect(FieldTransform.toNumber(null)).toBe(null);
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toNumber(['1', undefined, '2'])).toEqual([1, 2]);
        });
    });

    describe('replaceLiteral', () => {
        it('should find and replace values in string', () => {
            expect(FieldTransform.replaceLiteral('Hi bob', {}, { search: 'bob', replace: 'mel' })).toBe('Hi mel');
            expect(FieldTransform.replaceLiteral('Hi Bob', {}, { search: 'bob', replace: 'Mel ' })).toBe('Hi Bob');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.replaceLiteral(['Hi bob', undefined] as any, {}, { search: 'bob', replace: 'mel' })).toEqual(['Hi mel']);
        });
    });

    describe('replaceRegex', () => {
        it('should return string with replaced values', () => {
            expect(FieldTransform.replaceRegex('somestring', {}, { regex: 's|e', replace: 'd' })).toBe('domestring');
            expect(FieldTransform.replaceRegex('somestring', {}, { regex: 's|e', replace: 'd', global: true })).toBe('domddtring');
            expect(FieldTransform.replaceRegex('soMesTring', {}, {
                regex: 'm|t', replace: 'W', global: true, ignoreCase: true
            })).toBe('soWesWring');
            expect(FieldTransform.replaceRegex('a***a***a', {}, { regex: '\\*', replace: '', global: true })).toBe('aaa');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.replaceRegex(['somestring', undefined] as any, {}, { regex: 's|e', replace: 'd' })).toEqual(['domestring']);
        });
    });

    describe('toUnixTime should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const milli = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(FieldTransform.toUnixTime(testDate)).toBe(Math.floor(milli / 1000));
            expect(FieldTransform.toUnixTime(isoTime)).toBe(Math.floor(milli / 1000));
            expect(FieldTransform.toUnixTime(milli)).toBe(Math.floor(milli / 1000));
            expect(FieldTransform.toUnixTime(milli, {}, { ms: true })).toBe(milli);
        });

        it('convert date time in milliseconds to unix time s', () => {
            expect(FieldTransform.toUnixTime(1580418907000)).toBe(1580418907);
        });

        it('convert date time in milliseconds to unix time ms', () => {
            expect(FieldTransform.toUnixTime(1580418907000, {}, { ms: true })).toBe(1580418907000);
        });

        it('convert string dates to unix time', () => {
            expect(FieldTransform.toUnixTime('2020-01-01')).toBe(1577836800);
            expect(FieldTransform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800);
            expect(FieldTransform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800);
        });

        it('invalid dates will throw errors', () => {
            expect.hasAssertions();

            try {
                expect(FieldTransform.toUnixTime('notADate')).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform notADate to unix time');
            }

            try {
                expect(FieldTransform.toUnixTime(true)).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform true to unix time');
            }

            try {
                expect(FieldTransform.toUnixTime({})).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform [object Object] to unix time');
            }
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toUnixTime(['2020-01-01', undefined])).toEqual([1577836800]);
        });
    });

    describe('toISO8601 should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const unixTime = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(FieldTransform.toISO8601(testDate)).toBe(isoTime);
            expect(FieldTransform.toISO8601(isoTime)).toBe(isoTime);
            expect(FieldTransform.toISO8601(unixTime)).toBe(isoTime);
        });

        it('convert date time in seconds to unix time', () => {
            expect(FieldTransform.toISO8601(1580418907, {}, { resolution: 'seconds' })).toBe('2020-01-30T21:15:07.000Z');
        });

        it('convert string dates to unix time', () => {
            expect(FieldTransform.toISO8601('2020-01-01')).toBe('2020-01-01T00:00:00.000Z');
            expect(FieldTransform.toISO8601('Jan 1, 2020 UTC')).toBe('2020-01-01T00:00:00.000Z');
            expect(FieldTransform.toISO8601('2020 Jan, 1 UTC')).toBe('2020-01-01T00:00:00.000Z');
        });

        it('invalid dates will throw errors', () => {
            try {
                FieldTransform.toUnixTime('notADate');
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform notADate to unix time');
            }
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toISO8601(['2020-01-01', undefined])).toEqual(['2020-01-01T00:00:00.000Z']);
        });
    });

    describe('formatDate', () => {
        it('should return the formated date from a date object', () => {
            const config = { format: 'MM-dd-yyyy' };

            expect(FieldTransform.formatDate(new Date(2020, 2, 18), {}, config)).toBe('03-18-2020');
            expect(FieldTransform.formatDate(new Date('Jan 3 2001'), {}, config)).toBe('01-03-2001');
        });

        it('should return the formated date from a valid string date', () => {
            expect(FieldTransform.formatDate('2020-01-14T20:34:01.034Z', {}, { format: 'MMM do yy' })).toBe('Jan 14th 20');
            expect(FieldTransform.formatDate('March 3, 2019', {}, { format: 'M/d/yyyy' })).toBe('3/3/2019');
        });

        it('should return formated date from millitime time', () => {
            expect(FieldTransform.formatDate(1581013130856, {}, { format: 'yyyy-MM-dd' })).toBe('2020-02-06');
            expect(FieldTransform.formatDate(1581013130, {}, { format: 'yyyy-MM-dd', resolution: 'seconds' })).toBe('2020-02-06');
        });

        it('should throw error if date cannot be formated', () => {
            try {
                expect(FieldTransform.formatDate('bad date', {}, { format: 'yyyy-MM-dd' })).toBe('2020-02-06');
            } catch (e) {
                expect(e.message).toBe('Input is not valid date');
            }
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.formatDate([1581013130856, undefined], {}, { format: 'yyyy-MM-dd' })).toEqual(['2020-02-06']);
        });
    });

    describe('parseDate', () => {
        it('should return date object from date string', () => {
            expect(FieldTransform.parseDate('2020-01-10-00:00', {}, { format: 'yyyy-MM-ddxxx' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            expect(FieldTransform.parseDate('Jan 10, 2020-00:00', {}, { format: 'MMM dd, yyyyxxx' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            expect(FieldTransform.parseDate(1581025950223, {}, { format: 'T' })).toStrictEqual(new Date('2020-02-06T21:52:30.223Z'));
            expect(FieldTransform.parseDate(1581025950, {}, { format: 't' })).toStrictEqual(new Date('2020-02-06T21:52:30.000Z'));
            expect(FieldTransform.parseDate('1581025950', {}, { format: 't' })).toStrictEqual(new Date('2020-02-06T21:52:30.000Z'));
        });

        it('should throw error if cannot parse', () => {
            try {
                expect(FieldTransform.parseDate('2020-01-10', {}, { format: 't' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            } catch (e) {
                expect(e.message).toBe('Cannot parse date');
            }
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.parseDate(['1581025950', undefined], {}, { format: 't' })).toEqual([new Date('2020-02-06T21:52:30.000Z')]);
        });
    });

    describe('formatPhoneNumber should', () => {
        it('return phone number without dashes, spaces, or +', () => {
            expect(FieldTransform.toISDN('4917600000000')).toBe('4917600000000');
            expect(FieldTransform.toISDN('    1 (555) 555 2311     ')).toBe('15555552311');
            expect(FieldTransform.toISDN('+33-1-22-33-44-55')).toBe('33122334455');
            expect(FieldTransform.toISDN('+11 7 812 222 2323')).toBe('178122222323');
            expect(FieldTransform.toISDN('1.555.555.2311')).toBe('15555552311');
            expect(FieldTransform.toISDN('1234')).toBe('1234');
            expect(FieldTransform.toISDN('86 591 83123456')).toBe('8659183123456');
            expect(FieldTransform.toISDN('33 08 54 23 12 00')).toBe('33854231200');
            expect(FieldTransform.toISDN('+330854231200')).toBe('33854231200');
            expect(FieldTransform.toISDN('49 116 4331 12348')).toBe('49116433112348');
            expect(FieldTransform.toISDN('1(800)FloWErs')).toBe('18003569377');
            expect(FieldTransform.toISDN('86 598 13411-859395')).toBe('8659813411859395');
            expect(FieldTransform.toISDN('467*(070)1.23[45]/67')).toBe('4670701234567');
        });

        it('return phone number if input is a number', () => {
            expect(FieldTransform.toISDN(4917600000000)).toBe('4917600000000');
            expect(FieldTransform.toISDN(49187484)).toBe('49187484');
        });

        it('throw an error when it can not determine the phone number', () => {
            try {
                FieldTransform.toISDN('34');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }

            try {
                FieldTransform.toISDN('notAphoneNumber');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }

            try {
                FieldTransform.toISDN('n/a');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }

            try {
                FieldTransform.toISDN('+467+070+123+4567');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }
        });

        it('convert of an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toISDN(['1(800)FloWErs', undefined, '467*(070)1.23[45]/67'])).toEqual(['18003569377', '4670701234567']);
        });
    });

    describe('decodeBase64', () => {
        it('should parse encoded values', () => {
            const str = 'hello world';
            const value = encodeBase64(str);

            expect(FieldTransform.decodeBase64(value)).toBe(str);
            expect(FieldTransform.decodeBase64(null)).toBe(null);
            expect(FieldTransform.decodeBase64(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            const str = 'hello world';
            const str2 = 'some string';

            const value = encodeBase64(str);
            const value2 = encodeBase64(str2);

            expect(FieldTransform.decodeBase64([value, null, value2])).toEqual([str, str2]);
        });
    });

    describe('encodeBase64', () => {
        it('should encoded values', () => {
            const str = 'hello world';

            expect(FieldTransform.encodeBase64(str)).toEqual(encodeBase64(str));
            expect(FieldTransform.encodeBase64(null)).toBe(null);
            expect(FieldTransform.encodeBase64(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            const str = 'hello world';
            const str2 = 'some string';

            expect(FieldTransform.encodeBase64([str, null, str2])).toEqual([
                encodeBase64(str),
                encodeBase64(str2)
            ]);
        });
    });

    describe('decodeUrl', () => {
        const source = 'HELLO AND GOODBYE';
        const encoded = 'HELLO%20AND%20GOODBYE';

        it('should decode values', () => {
            expect(FieldTransform.decodeURL(encoded)).toEqual(source);
            expect(FieldTransform.decodeURL(null)).toBe(null);
            expect(FieldTransform.decodeURL(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            expect(FieldTransform.decodeURL([encoded, null] as any)).toEqual([
                source,
            ]);
        });
    });

    describe('encodeUrl', () => {
        const source = 'google.com?q=HELLO AND GOODBYE';
        const encoded = encodeUrl(source);

        it('should encoded values', () => {
            expect(FieldTransform.encodeURL(source)).toEqual(encoded);
            expect(FieldTransform.encodeURL(null)).toBe(null);
            expect(FieldTransform.encodeURL(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            expect(FieldTransform.encodeURL([source, null] as any)).toEqual([
                encoded
            ]);
        });
    });

    describe('encodeHex', () => {
        const str = 'hello world';

        it('should encode values', () => {
            expect(FieldTransform.encodeHex(str)).toEqual(encodeHex(str));
            expect(FieldTransform.encodeHex(null)).toBe(null);
            expect(FieldTransform.encodeHex(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            expect(FieldTransform.encodeHex([str, null])).toEqual([
                encodeHex(str),
            ]);
        });
    });

    describe('decodeHex', () => {
        const source = 'hello world';
        const encoded = encodeHex(source);

        it('should decode values', () => {
            expect(FieldTransform.decodeHex(encoded)).toEqual(source);
            expect(FieldTransform.decodeHex(null)).toBe(null);
            expect(FieldTransform.decodeHex(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            expect(FieldTransform.decodeHex([encoded, null])).toEqual([
                source
            ]);
        });
    });

    describe('parseJSON', () => {
        const obj = { hello: 'world' };
        const json = JSON.stringify(obj);

        it('should parse values', () => {
            expect(FieldTransform.parseJSON(json)).toEqual(obj);
            expect(FieldTransform.parseJSON(null)).toBe(null);
            expect(FieldTransform.parseJSON(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            expect(FieldTransform.parseJSON([json, null])).toEqual([
                obj
            ]);
        });
    });

    describe('toJSON', () => {
        const obj = { hello: 'world' };
        const json = JSON.stringify(obj);
        const prettyJson = JSON.stringify(obj, null, 2);

        it('should stringify values', () => {
            expect(FieldTransform.toJSON(obj)).toEqual(json);
            expect(FieldTransform.toJSON(null)).toBe(null);
            expect(FieldTransform.toJSON(undefined)).toBe(null);
        });

        it('can prettyify results', () => {
            expect(FieldTransform.toJSON(obj, {}, { pretty: true })).toEqual(prettyJson);
        });

        it('should stringify values in an array', () => {
            expect(FieldTransform.toJSON([obj, null])).toEqual([
                json
            ]);
        });
    });

    describe('toGeoPoint', () => {
        it('should parse values', () => {
            expect(FieldTransform.toGeoPoint('60, 40')).toEqual({ lon: 40, lat: 60 });
            expect(FieldTransform.toGeoPoint([40, 60])).toEqual({ lon: 40, lat: 60 });
            expect(FieldTransform.toGeoPoint({ lat: 40, lon: 60 })).toEqual({ lon: 60, lat: 40 });
            expect(FieldTransform.toGeoPoint({ latitude: 40, longitude: 60 }))
                .toEqual({ lon: 60, lat: 40 });
        });

        it('should parse values in an array', () => {
            expect(FieldTransform.toGeoPoint(['60, 40', null, [50, 60]])).toEqual([
                { lon: 40, lat: 60 },
                { lon: 50, lat: 60 }
            ]);
        });
    });

    describe('encodeMD5', () => {
        const source = 'hello world';

        it('should encode values', () => {
            expect(FieldTransform.encodeMD5(source)).toBeDefined();
            expect(FieldTransform.encodeMD5(null)).toBe(null);
            expect(FieldTransform.encodeMD5(undefined)).toBe(null);
        });

        it('should encode values in an array', () => {
            expect(FieldTransform.encodeMD5([source, null])).toBeArrayOfSize(1);
        });
    });

    describe('encodeSHA', () => {
        const source = 'hello world';

        it('should encode values', () => {
            expect(FieldTransform.encodeSHA(source)).toBeDefined();
            expect(FieldTransform.encodeSHA(null)).toBe(null);
            expect(FieldTransform.encodeSHA(undefined)).toBe(null);
        });

        it('should encode values in an array', () => {
            expect(FieldTransform.encodeSHA([source, null])).toBeArrayOfSize(1);
        });
    });

    describe('encodeSHA1', () => {
        const source = 'hello world';

        it('should encode values', () => {
            expect(FieldTransform.encodeSHA1(source)).toBeDefined();
            expect(FieldTransform.encodeSHA1(null)).toBe(null);
            expect(FieldTransform.encodeSHA1(undefined)).toBe(null);
        });

        it('should encode values in an array', () => {
            expect(FieldTransform.encodeSHA1([source, null])).toBeArrayOfSize(1);
        });
    });

    describe('toCamelCase', () => {
        it('should return a camel case string', () => {
            expect(FieldTransform.toCamelCase('I need camel case')).toBe('iNeedCamelCase');
            expect(FieldTransform.toCamelCase('happyBirthday')).toBe('happyBirthday');
            expect(FieldTransform.toCamelCase('what_is_this')).toBe('whatIsThis');
            expect(FieldTransform.toCamelCase('this-should-be-camel')).toBe('thisShouldBeCamel');
            expect(FieldTransform.toCamelCase('Cased   to Pass---this_____TEST')).toBe('casedToPassThisTest');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toCamelCase(['I need camel case', undefined] as any)).toEqual(['iNeedCamelCase']);
        });
    });

    describe('toKebabCase', () => {
        it('should return a kebab case string', () => {
            expect(FieldTransform.toKebabCase('I need kebab case')).toBe('i-need-kebab-case');
            expect(FieldTransform.toKebabCase('happyBirthday')).toBe('happy-birthday');
            expect(FieldTransform.toKebabCase('what_is_this')).toBe('what-is-this');
            expect(FieldTransform.toKebabCase('this-should-be-kebab')).toBe('this-should-be-kebab');
            expect(FieldTransform.toKebabCase('Cased   to Pass---this_____TEST')).toBe('cased-to-pass-this-test');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toKebabCase(['I need kebab case', undefined] as any)).toEqual(['i-need-kebab-case']);
        });
    });

    describe('toPascalCase', () => {
        it('should return a pascal case string', () => {
            expect(FieldTransform.toPascalCase('I need pascal case')).toBe('INeedPascalCase');
            expect(FieldTransform.toPascalCase('happyBirthday')).toBe('HappyBirthday');
            expect(FieldTransform.toPascalCase('what_is_this')).toBe('WhatIsThis');
            expect(FieldTransform.toPascalCase('this-should-be-pascal')).toBe('ThisShouldBePascal');
            expect(FieldTransform.toPascalCase('Cased   to Pass---this_____TEST')).toBe('CasedToPassThisTest');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toPascalCase(['happyBirthday', undefined] as any)).toEqual(['HappyBirthday']);
        });
    });

    describe('toSnakeCase', () => {
        it('should return a pascal case string', () => {
            expect(FieldTransform.toSnakeCase('I need snake case')).toBe('i_need_snake_case');
            expect(FieldTransform.toSnakeCase('happyBirthday')).toBe('happy_birthday');
            expect(FieldTransform.toSnakeCase('what_is_this')).toBe('what_is_this');
            expect(FieldTransform.toSnakeCase('this-should-be-snake')).toBe('this_should_be_snake');
            expect(FieldTransform.toSnakeCase('Cased   to Pass---this_____TEST')).toBe('cased_to_pass_this_test');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toSnakeCase(['happyBirthday', undefined] as any)).toEqual(['happy_birthday']);
        });
    });

    describe('toTitleCase', () => {
        it('should return a string with every word capitalized', () => {
            expect(FieldTransform.toTitleCase('I need some capitols')).toBe('I Need Some Capitols');
            expect(FieldTransform.toTitleCase('happyBirthday')).toBe('Happy Birthday');
            expect(FieldTransform.toTitleCase('what_is_this')).toBe('What Is This');
            expect(FieldTransform.toTitleCase('this-should-be-capital')).toBe('This Should Be Capital');
            expect(FieldTransform.toTitleCase('Cased   to Pass---this_____TEST')).toBe('Cased To Pass This TEST');
        });

        it('convert an array of values, ignores undefined/null', () => {
            expect(FieldTransform.toTitleCase(['happyBirthday', undefined] as any)).toEqual(['Happy Birthday']);
        });
    });
});
