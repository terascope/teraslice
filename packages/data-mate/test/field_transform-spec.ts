import * as fieldTransform from '../src/transforms/field-transform';

function encodeBase64(input: any) {
    return Buffer.from(input).toString('base64');
}

function encodeUrl(input: any) {
    return encodeURIComponent(input);
}

function encodeHex(input: any) {
    return Buffer.from(input).toString('hex');
}

describe('field fieldTransforms', () => {
    describe('toBoolean should', () => {
        it('return true for truthy values', () => {
            [32, '1', 'string', true, {}, Infinity, new Date(), -87]
                .forEach((v) => expect(fieldTransform.toBoolean(v)).toBe(true));
        });

        it('return false for falsy values', () => {
            [0, false, NaN, '']
                .forEach((v) => expect(fieldTransform.toBoolean(v)).toBe(false));
        });

        it('return false for defined falsy values', () => {
            ['0', 'false', 'no']
                .forEach((v) => expect(fieldTransform.toBoolean(v)).toBe(false));
        });

        it('converts an array values to strings, ignores undefined/null', () => {
            expect(fieldTransform.toBoolean(['foo', 'false', null])).toEqual([true, false]);
        });
    });

    describe('toString should', () => {
        it('convert values to strings', () => {
            expect(fieldTransform.toString('lowercase')).toEqual('lowercase');
            expect(fieldTransform.toString(11111)).toEqual('11111');
            expect(fieldTransform.toString(true)).toEqual('true');
            expect(fieldTransform.toString({ foo: 'bar' })).toEqual('{"foo":"bar"}');
        });

        it('undefined/null returns null', () => {
            expect(fieldTransform.toString(null)).toBe(null);
            expect(fieldTransform.toString(undefined)).toBe(null);
        });

        it('converts an array values to strings, ignores undefined/null', () => {
            expect(fieldTransform.toString([1, 2])).toEqual(['1', '2']);
            expect(fieldTransform.toString([true, undefined, false])).toEqual(['true', 'false']);
            expect(fieldTransform.toString([{ foo: 'bar' }, null])).toEqual(['{"foo":"bar"}']);
        });
    });

    describe('toUpperCase should', () => {
        it('return an upper case string', () => {
            expect(fieldTransform.toUpperCase('lowercase')).toBe('LOWERCASE');
            expect(fieldTransform.toUpperCase('11111')).toBe('11111');
            expect(fieldTransform.toUpperCase('MixEdCAsE')).toBe('MIXEDCASE');
        });

        it('converts an array of values to uppercase, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toUpperCase(['MixEdCAsE', undefined, 'lowercase'])).toEqual(['MIXEDCASE', 'LOWERCASE']);
        });
    });

    describe('toLowerCase should', () => {
        it('return a lower case string', () => {
            expect(fieldTransform.toLowerCase('UPPERCASE')).toBe('uppercase');
            expect(fieldTransform.toLowerCase('11111')).toBe('11111');
            expect(fieldTransform.toLowerCase('MixEdCAsE')).toBe('mixedcase');
        });

        it('converts an array of values to lowercase, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toLowerCase(['MixEdCAsE', undefined, 'UPPERCASE'])).toEqual(['mixedcase', 'uppercase']);
        });
    });

    describe('setDefault should', () => {
        it('return a value if nothing is provided', () => {
            expect(fieldTransform.setDefault('foo', { value: true })).toEqual('foo');
            expect(fieldTransform.setDefault({ hello: 'world' }, { value: true })).toEqual({ hello: 'world' });
            expect(fieldTransform.setDefault(null, { value: true })).toEqual(true);
            expect(fieldTransform.setDefault(undefined, { value: true })).toEqual(true);
        });
    });

    describe('map should', () => {
        it('map a field fieldTransform function to an array', () => {
            const array = ['hello', 'world', 'goodbye'];
            const results1 = array.map(fieldTransform.toUpperCase);
            const results2 = array.map((data) => fieldTransform.truncate(data, { size: 2 }));

            expect(fieldTransform.map(array, { fn: 'toUpperCase' })).toEqual(results1);
            expect(fieldTransform.map(array, { fn: 'truncate', options: { size: 2 } })).toEqual(results2);
        });
    });

    describe('extract should', () => {
        it('return whats between start and end', () => {
            const results = fieldTransform.extract('<hello>', { start: '<', end: '>' });
            expect(results).toEqual('hello');
        });

        it('can run a jexl expression', () => {
            const results = fieldTransform.extract({ foo: 'bar' }, { jexlExp: '[foo]' });
            expect(results).toEqual(['bar']);
        });

        it('run a regex to extract a value', () => {
            const results = fieldTransform.extract('hello', { regex: 'he.*' });
            expect(results).toEqual(['hello']);
        });

        it('can return a singular value', () => {
            const results = fieldTransform.extract('hello', { regex: 'he.*', isMultiValue: false });
            expect(results).toEqual('hello');
        });

        it('should not throw if it cannot extract anything', () => {
            const results = fieldTransform.extract('boo', { regex: 'he.*', isMultiValue: false });
            expect(results).toEqual(null);
        });
    });

    describe('trim should', () => {
        it('trim left and right spaces from a string', () => {
            expect(fieldTransform.trim('   string    ')).toBe('string');
            expect(fieldTransform.trim('   left')).toBe('left');
            expect(fieldTransform.trim('right    ')).toBe('right');
            expect(fieldTransform.trim('fast cars race fast', { char: 'fast' })).toBe(' cars race ');
            expect(fieldTransform.trim('.*.*a regex test.*.*.*.* stuff', { char: '.*' })).toBe('a regex test');
            expect(fieldTransform.trim('\t\r\rtrim this\r\r', { char: '\r' })).toBe('trim this');
            expect(fieldTransform.trim('        ')).toBe('');
        });

        it('should return the string if char is not found', () => {
            expect(fieldTransform.trim('this is a string', { char: 'b' })).toBe('this is a string');
        });

        it('trims an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.trim(['   string    ', undefined, 'right    '])).toEqual(['string', 'right']);
        });
    });

    describe('trimStart should', () => {
        it('should return the string trimmed from the start', () => {
            expect(fieldTransform.trimStart('thisisastring', { char: 's' })).toBe('isastring');
            expect(fieldTransform.trimStart('thisisastring', { char: 'isa' })).toBe('string');
            expect(fieldTransform.trimStart('    Hello Bob    ')).toBe('Hello Bob    ');
            expect(fieldTransform.trimStart('iiii-wordiwords-iii', { char: 'i' })).toBe('-wordiwords-iii');
            expect(fieldTransform.trimStart('__--__--__some__--__word', { char: '__--' })).toBe('__some__--__word');
            expect(fieldTransform.trimStart('fast cars race fast', { char: 'fast' })).toBe(' cars race fast');
            expect(fieldTransform.trimStart('        ')).toBe('');
            expect(fieldTransform.trimStart('start    ')).toBe('start    ');
            expect(fieldTransform.trimStart('     start')).toBe('start');
        });

        it('should return the string if char is not found', () => {
            expect(fieldTransform.trimStart('this is a string', { char: 'b' })).toBe('this is a string');
        });

        it('trims an array of values at start, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.trimStart(['    Hello Bob    ', undefined, '     start'])).toEqual(['Hello Bob    ', 'start']);
        });
    });

    describe('trimEnd should', () => {
        it('should return the string trimmed from the end', () => {
            expect(fieldTransform.trimEnd('this is a string', { char: 's' })).toBe('this is a ');
            expect(fieldTransform.trimEnd('    Hello Bob    ')).toBe('    Hello Bob');
            expect(fieldTransform.trimEnd('*****Hello****Bob*****', { char: '*' })).toBe('*****Hello****Bob');
            expect(fieldTransform.trimEnd('fast cars race fast', { char: 'fast' })).toBe('fast cars race ');
            expect(fieldTransform.trimEnd('        ')).toBe('');
            expect(fieldTransform.trimEnd('    end')).toBe('    end');
            expect(fieldTransform.trimEnd('end    ')).toBe('end');
        });

        it('should return the string if char is not found', () => {
            expect(fieldTransform.trimEnd('this is a string', { char: 'b' })).toBe('this is a string');
        });

        it('trims an array of values at end, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.trimEnd(['    Hello Bob    ', undefined, 'end    '])).toEqual(['    Hello Bob', 'end']);
        });
    });

    describe('truncate should', () => {
        it('return string of designated length', () => {
            expect(fieldTransform.truncate('thisisalongstring', { size: 4 })).toBe('this');
        });

        it('throw an error if args does not have a valid size', () => {
            try {
                expect(fieldTransform.truncate('astring', { size: -120 })).toBe('astring');
            } catch (e) {
                expect(e.message).toBe('Invalid size paramter for truncate');
            }
        });

        it('trim the size of an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.truncate(['hello', undefined, 'world'], { size: 2 })).toEqual(['he', 'wo']);
        });
    });

    describe('toArray', () => {
        it('should return an array from a string', () => {
            expect(fieldTransform.toArray('astring')).toEqual(['a', 's', 't', 'r', 'i', 'n', 'g']);
            expect(fieldTransform.toArray('astring', { delimiter: ',' })).toEqual(['astring']);
            expect(fieldTransform.toArray('a-stri-ng', { delimiter: '-' })).toEqual(['a', 'stri', 'ng']);
            expect(fieldTransform.toArray('a string', { delimiter: ' ' })).toEqual(['a', 'string']);
        });
    });

    describe('toNumber should', () => {
        it('return a number from a number string or number', () => {
            expect(fieldTransform.toNumber(12321)).toBe(12321);
            expect(fieldTransform.toNumber('12321')).toBe(12321);
            expect(fieldTransform.toNumber('000011')).toBe(11);
            expect(fieldTransform.toNumber('000011.9834')).toBe(11.9834);
            expect(fieldTransform.toNumber(-34.23432)).toBe(-34.23432);
            expect(fieldTransform.toNumber(Infinity)).toBe(Infinity);
            expect(fieldTransform.toNumber(true)).toBe(1);
        });

        it('return a number for boolean like if selected in args', () => {
            expect(fieldTransform.toNumber(undefined, { booleanLike: true })).toBe(0);
            expect(fieldTransform.toNumber('true', { booleanLike: true })).toBe(1);
            expect(fieldTransform.toNumber('no', { booleanLike: true })).toBe(0);
            expect(fieldTransform.toNumber(null, { booleanLike: true })).toBe(0);
        });

        it('throw an error if input cannot be coerced to a number', () => {
            try {
                expect(fieldTransform.toNumber('bobsyouruncle')).toBe(12321);
            } catch (e) { expect(e.message).toBe('Could not convert input of type String to a number'); }

            try {
                expect(fieldTransform.toNumber({})).toBe(12321);
            } catch (e) { expect(e.message).toBe('Could not convert input of type Object to a number'); }
        });

        it('will return null when given undefined or null', () => {
            expect(fieldTransform.toNumber(undefined)).toBe(null);
            expect(fieldTransform.toNumber(null)).toBe(null);
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toNumber(['1', undefined, '2'])).toEqual([1, 2]);
        });
    });

    describe('replaceLiteral', () => {
        it('should find and replace values in string', () => {
            expect(fieldTransform.replaceLiteral('Hi bob', { search: 'bob', replace: 'mel' })).toBe('Hi mel');
            expect(fieldTransform.replaceLiteral('Hi Bob', { search: 'bob', replace: 'Mel ' })).toBe('Hi Bob');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.replaceLiteral(['Hi bob', undefined], { search: 'bob', replace: 'mel' })).toEqual(['Hi mel']);
        });
    });

    describe('replaceRegex', () => {
        it('should return string with replaced values', () => {
            expect(fieldTransform.replaceRegex('somestring', { regex: 's|e', replace: 'd' })).toBe('domestring');
            expect(fieldTransform.replaceRegex('somestring', { regex: 's|e', replace: 'd', global: true })).toBe('domddtring');
            expect(fieldTransform.replaceRegex('soMesTring', {
                regex: 'm|t', replace: 'W', global: true, ignoreCase: true
            })).toBe('soWesWring');
            expect(fieldTransform.replaceRegex('a***a***a', { regex: '\\*', replace: '', global: true })).toBe('aaa');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.replaceRegex(['somestring', undefined], { regex: 's|e', replace: 'd' })).toEqual(['domestring']);
        });
    });

    describe('toUnixTime should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const milli = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(fieldTransform.toUnixTime(testDate)).toBe(Math.floor(milli / 1000));
            expect(fieldTransform.toUnixTime(isoTime)).toBe(Math.floor(milli / 1000));
            expect(fieldTransform.toUnixTime(milli)).toBe(Math.floor(milli / 1000));
            expect(fieldTransform.toUnixTime(milli, { ms: true })).toBe(milli);
        });

        it('convert date time in milliseconds to unix time s', () => {
            expect(fieldTransform.toUnixTime(1580418907000)).toBe(1580418907);
        });

        it('convert date time in milliseconds to unix time ms', () => {
            expect(fieldTransform.toUnixTime(1580418907000, { ms: true })).toBe(1580418907000);
        });

        it('convert string dates to unix time', () => {
            expect(fieldTransform.toUnixTime('2020-01-01')).toBe(1577836800);
            expect(fieldTransform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800);
            expect(fieldTransform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800);
        });

        it('invalid dates will throw errors', () => {
            expect.hasAssertions();

            try {
                expect(fieldTransform.toUnixTime('notADate')).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot fieldTransform to unix time'); }

            try {
                expect(fieldTransform.toUnixTime(true)).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot fieldTransform to unix time'); }

            try {
                expect(fieldTransform.toUnixTime({})).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot fieldTransform to unix time'); }
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toUnixTime(['2020-01-01', undefined])).toEqual([1577836800]);
        });
    });

    describe('toISO8601 should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const unixTime = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(fieldTransform.toISO8601(testDate)).toBe(isoTime);
            expect(fieldTransform.toISO8601(isoTime)).toBe(isoTime);
            expect(fieldTransform.toISO8601(unixTime)).toBe(isoTime);
        });

        it('convert date time in seconds to unix time', () => {
            expect(fieldTransform.toISO8601(1580418907, { resolution: 'seconds' })).toBe('2020-01-30T21:15:07.000Z');
        });

        it('convert string dates to unix time', () => {
            expect(fieldTransform.toISO8601('2020-01-01')).toBe('2020-01-01T00:00:00.000Z');
            expect(fieldTransform.toISO8601('Jan 1, 2020 UTC')).toBe('2020-01-01T00:00:00.000Z');
            expect(fieldTransform.toISO8601('2020 Jan, 1 UTC')).toBe('2020-01-01T00:00:00.000Z');
        });

        it('invalid dates will throw errors', () => {
            try {
                fieldTransform.toUnixTime('notADate');
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot fieldTransform to unix time');
            }
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toISO8601(['2020-01-01', undefined])).toEqual(['2020-01-01T00:00:00.000Z']);
        });
    });

    describe('formatDate', () => {
        it('should return the formated date from a date object', () => {
            const config = { format: 'MM-dd-yyyy' };

            expect(fieldTransform.formatDate(new Date(2020, 2, 18), config)).toBe('03-18-2020');
            expect(fieldTransform.formatDate(new Date('Jan 3 2001'), config)).toBe('01-03-2001');
        });

        it('should return the formated date from a valid string date', () => {
            expect(fieldTransform.formatDate('2020-01-14T20:34:01.034Z', { format: 'MMM do yy' })).toBe('Jan 14th 20');
            expect(fieldTransform.formatDate('March 3, 2019', { format: 'M/d/yyyy' })).toBe('3/3/2019');
        });

        it('should return formated date from millitime time', () => {
            expect(fieldTransform.formatDate(1581013130856, { format: 'yyyy-MM-dd' })).toBe('2020-02-06');
            expect(fieldTransform.formatDate(1581013130, { format: 'yyyy-MM-dd', resolution: 'seconds' })).toBe('2020-02-06');
        });

        it('should throw error if date cannot be formated', () => {
            try {
                expect(fieldTransform.formatDate('bad date', { format: 'yyyy-MM-dd' })).toBe('2020-02-06');
            } catch (e) { expect(e.message).toBe('Input is not valid date'); }
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.formatDate([1581013130856, undefined], { format: 'yyyy-MM-dd' })).toEqual(['2020-02-06']);
        });
    });

    describe('parseDate', () => {
        it('should return date object from date string', () => {
            expect(fieldTransform.parseDate('2020-01-10-00:00', { format: 'yyyy-MM-ddxxx' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            expect(fieldTransform.parseDate('Jan 10, 2020-00:00', { format: 'MMM dd, yyyyxxx' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            expect(fieldTransform.parseDate(1581025950223, { format: 'T' })).toStrictEqual(new Date('2020-02-06T21:52:30.223Z'));
            expect(fieldTransform.parseDate(1581025950, { format: 't' })).toStrictEqual(new Date('2020-02-06T21:52:30.000Z'));
            expect(fieldTransform.parseDate('1581025950', { format: 't' })).toStrictEqual(new Date('2020-02-06T21:52:30.000Z'));
        });

        it('should throw error if cannot parse', () => {
            try {
                expect(fieldTransform.parseDate('2020-01-10', { format: 't' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            } catch (e) { expect(e.message).toBe('Cannot parse date'); }
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.parseDate(['1581025950', undefined], { format: 't' })).toEqual([new Date('2020-02-06T21:52:30.000Z')]);
        });
    });

    describe('formatPhoneNumber should', () => {
        it('return phone number without dashes, spaces, or +', () => {
            expect(fieldTransform.toISDN('4917600000000')).toBe('4917600000000');
            expect(fieldTransform.toISDN('    1 (555) 555 2311     ')).toBe('15555552311');
            expect(fieldTransform.toISDN('+33-1-22-33-44-55')).toBe('33122334455');
            expect(fieldTransform.toISDN('+11 7 812 222 2323')).toBe('178122222323');
            expect(fieldTransform.toISDN('1.555.555.2311')).toBe('15555552311');
            expect(fieldTransform.toISDN('1234')).toBe('1234');
            expect(fieldTransform.toISDN('86 591 83123456')).toBe('8659183123456');
            expect(fieldTransform.toISDN('33 08 54 23 12 00')).toBe('33854231200');
            expect(fieldTransform.toISDN('+330854231200')).toBe('33854231200');
            expect(fieldTransform.toISDN('49 116 4331 12348')).toBe('49116433112348');
            expect(fieldTransform.toISDN('1(800)FloWErs')).toBe('18003569377');
            expect(fieldTransform.toISDN('86 598 13411-859395')).toBe('8659813411859395');
            expect(fieldTransform.toISDN('467*(070)1.23[45]/67')).toBe('4670701234567');
        });

        it('return phone number if input is a number', () => {
            expect(fieldTransform.toISDN(4917600000000)).toBe('4917600000000');
            expect(fieldTransform.toISDN(49187484)).toBe('49187484');
        });

        it('throw an error when it can not determine the phone number', () => {
            try {
                fieldTransform.toISDN('34');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try {
                fieldTransform.toISDN('notAphoneNumber');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try {
                fieldTransform.toISDN('n/a');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try {
                fieldTransform.toISDN('+467+070+123+4567');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }
        });

        it('convert of an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toISDN(['1(800)FloWErs', undefined, '467*(070)1.23[45]/67'])).toEqual(['18003569377', '4670701234567']);
        });
    });

    describe('decodeBase64', () => {
        it('should parse encoded values', () => {
            const str = 'hello world';
            const value = encodeBase64(str);

            expect(fieldTransform.decodeBase64(value)).toBe(str);
            expect(fieldTransform.decodeBase64(null)).toBe(null);
            expect(fieldTransform.decodeBase64(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            const str = 'hello world';
            const str2 = 'some string';

            const value = encodeBase64(str);
            const value2 = encodeBase64(str2);

            expect(fieldTransform.decodeBase64([value, null, value2])).toEqual([str, str2]);
        });
    });

    describe('encodeBase64', () => {
        it('should encoded values', () => {
            const str = 'hello world';

            expect(fieldTransform.encodeBase64(str)).toEqual(encodeBase64(str));
            expect(fieldTransform.encodeBase64(null)).toBe(null);
            expect(fieldTransform.encodeBase64(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            const str = 'hello world';
            const str2 = 'some string';

            expect(fieldTransform.encodeBase64([str, null, str2])).toEqual([
                encodeBase64(str),
                encodeBase64(str2)
            ]);
        });
    });

    describe('decodeUrl', () => {
        const source = 'HELLO AND GOODBYE';
        const encoded = 'HELLO%20AND%20GOODBYE';

        it('should decode values', () => {
            expect(fieldTransform.decodeUrl(encoded)).toEqual(source);
            expect(fieldTransform.decodeUrl(null)).toBe(null);
            expect(fieldTransform.decodeUrl(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.decodeUrl([encoded, null])).toEqual([
                source,
            ]);
        });
    });

    describe('encodeUrl', () => {
        const source = 'google.com?q=HELLO AND GOODBYE';
        const encoded = encodeUrl(source);

        it('should encoded values', () => {
            expect(fieldTransform.encodeUrl(source)).toEqual(encoded);
            expect(fieldTransform.encodeUrl(null)).toBe(null);
            expect(fieldTransform.encodeUrl(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.encodeUrl([source, null])).toEqual([
                encoded
            ]);
        });
    });

    describe('encodeHex', () => {
        const str = 'hello world';

        it('should encode values', () => {
            expect(fieldTransform.encodeHex(str)).toEqual(encodeHex(str));
            expect(fieldTransform.encodeHex(null)).toBe(null);
            expect(fieldTransform.encodeHex(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.encodeHex([str, null])).toEqual([
                encodeHex(str),
            ]);
        });
    });

    describe('decodeHex', () => {
        const source = 'hello world';
        const encoded = encodeHex(source);

        it('should decode values', () => {
            expect(fieldTransform.decodeHex(encoded)).toEqual(source);
            expect(fieldTransform.decodeHex(null)).toBe(null);
            expect(fieldTransform.decodeHex(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.decodeHex([encoded, null])).toEqual([
                source
            ]);
        });
    });

    describe('parseJSON', () => {
        const obj = { hello: 'world' };
        const json = JSON.stringify(obj);

        it('should parse values', () => {
            expect(fieldTransform.parseJSON(json)).toEqual(obj);
            expect(fieldTransform.parseJSON(null)).toBe(null);
            expect(fieldTransform.parseJSON(undefined)).toBe(null);
        });

        it('should parse encoded values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.parseJSON([json, null])).toEqual([
                obj
            ]);
        });
    });

    describe('toJSON', () => {
        const obj = { hello: 'world' };
        const json = JSON.stringify(obj);
        const prettyJson = JSON.stringify(obj, null, 2);

        it('should stringify values', () => {
            expect(fieldTransform.toJSON(obj)).toEqual(json);
            expect(fieldTransform.toJSON(null)).toBe(null);
            expect(fieldTransform.toJSON(undefined)).toBe(null);
        });

        it('can prettyify results', () => {
            expect(fieldTransform.toJSON(obj, { pretty: true })).toEqual(prettyJson);
        });

        it('should stringify values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.toJSON([obj, null])).toEqual([
                json
            ]);
        });
    });

    describe('dedupe', () => {
        it('should dedupe array values', () => {
            expect(
                fieldTransform.dedupe([1, 2, 2, 3, 3, 3, undefined, 4])
            ).toEqual([1, 2, 3, undefined, 4]);
            // @ts-ignore
            expect(fieldTransform.dedupe(null)).toBe(null);
            // @ts-ignore
            expect(fieldTransform.dedupe(undefined)).toBe(null);
        });
    });

    describe('toGeoPoint', () => {
        it('should parse values', () => {
            expect(fieldTransform.toGeoPoint('60, 40')).toEqual({ lon: 40, lat: 60 });
            expect(fieldTransform.toGeoPoint([40, 60])).toEqual({ lon: 40, lat: 60 });
            expect(fieldTransform.toGeoPoint({ lat: 40, lon: 60 })).toEqual({ lon: 60, lat: 40 });
            expect(fieldTransform.toGeoPoint({ latitude: 40, longitude: 60 }))
                .toEqual({ lon: 60, lat: 40 });
        });

        it('should parse values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.toGeoPoint(['60, 40', null, [50, 60]])).toEqual([
                { lon: 40, lat: 60 },
                { lon: 50, lat: 60 }
            ]);
        });
    });

    describe('encodeMD5', () => {
        const source = 'hello world';

        it('should encode values', () => {
            expect(fieldTransform.encodeMD5(source)).toBeDefined();
            expect(fieldTransform.encodeMD5(null)).toBe(null);
            expect(fieldTransform.encodeMD5(undefined)).toBe(null);
        });

        it('should encode values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.encodeMD5([source, null])).toBeArrayOfSize(1);
        });
    });

    describe('encodeSHA', () => {
        const source = 'hello world';

        it('should encode values', () => {
            expect(fieldTransform.encodeSHA(source)).toBeDefined();
            expect(fieldTransform.encodeSHA(null)).toBe(null);
            expect(fieldTransform.encodeSHA(undefined)).toBe(null);
        });

        it('should encode values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.encodeSHA([source, null])).toBeArrayOfSize(1);
        });
    });

    describe('encodeSHA1', () => {
        const source = 'hello world';

        it('should encode values', () => {
            expect(fieldTransform.encodeSHA1(source)).toBeDefined();
            expect(fieldTransform.encodeSHA1(null)).toBe(null);
            expect(fieldTransform.encodeSHA1(undefined)).toBe(null);
        });

        it('should encode values in an array', () => {
            // @ts-ignore
            expect(fieldTransform.encodeSHA1([source, null])).toBeArrayOfSize(1);
        });
    });

    describe('toCamelCase', () => {
        it('should return a camel case string', () => {
            expect(fieldTransform.toCamelCase('I need camel case')).toBe('iNeedCamelCase');
            expect(fieldTransform.toCamelCase('happyBirthday')).toBe('happyBirthday');
            expect(fieldTransform.toCamelCase('what_is_this')).toBe('whatIsThis');
            expect(fieldTransform.toCamelCase('this-should-be-camel')).toBe('thisShouldBeCamel');
            expect(fieldTransform.toCamelCase('Cased   to Pass---this_____TEST')).toBe('casedToPassThisTEST');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toCamelCase(['I need camel case', undefined])).toEqual(['iNeedCamelCase']);
        });
    });

    describe('toKebabCase', () => {
        it('should return a kebab case string', () => {
            expect(fieldTransform.toKebabCase('I need kebab case')).toBe('i-need-kebab-case');
            expect(fieldTransform.toKebabCase('happyBirthday')).toBe('happy-birthday');
            expect(fieldTransform.toKebabCase('what_is_this')).toBe('what-is-this');
            expect(fieldTransform.toKebabCase('this-should-be-kebab')).toBe('this-should-be-kebab');
            expect(fieldTransform.toKebabCase('Cased   to Pass---this_____TEST')).toBe('cased-to-pass-this-test');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toKebabCase(['I need kebab case', undefined])).toEqual(['i-need-kebab-case']);
        });
    });

    describe('toPascalCase', () => {
        it('should return a pascal case string', () => {
            expect(fieldTransform.toPascalCase('I need pascal case')).toBe('INeedPascalCase');
            expect(fieldTransform.toPascalCase('happyBirthday')).toBe('HappyBirthday');
            expect(fieldTransform.toPascalCase('what_is_this')).toBe('WhatIsThis');
            expect(fieldTransform.toPascalCase('this-should-be-pascal')).toBe('ThisShouldBePascal');
            expect(fieldTransform.toPascalCase('Cased   to Pass---this_____TEST')).toBe('CasedToPassThisTEST');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toPascalCase(['happyBirthday', undefined])).toEqual(['HappyBirthday']);
        });
    });

    describe('toSnakeCase', () => {
        it('should return a pascal case string', () => {
            expect(fieldTransform.toSnakeCase('I need snake case')).toBe('i_need_snake_case');
            expect(fieldTransform.toSnakeCase('happyBirthday')).toBe('happy_birthday');
            expect(fieldTransform.toSnakeCase('what_is_this')).toBe('what_is_this');
            expect(fieldTransform.toSnakeCase('this-should-be-snake')).toBe('this_should_be_snake');
            expect(fieldTransform.toSnakeCase('Cased   to Pass---this_____TEST')).toBe('cased_to_pass_this_test');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toSnakeCase(['happyBirthday', undefined])).toEqual(['happy_birthday']);
        });
    });

    describe('toTitleCase', () => {
        it('should return a string with every word capitalized', () => {
            expect(fieldTransform.toTitleCase('I need some capitols')).toBe('I Need Some Capitols');
            expect(fieldTransform.toTitleCase('happyBirthday')).toBe('Happy Birthday');
            expect(fieldTransform.toTitleCase('what_is_this')).toBe('What Is This');
            expect(fieldTransform.toTitleCase('this-should-be-capital')).toBe('This Should Be Capital');
            expect(fieldTransform.toTitleCase('Cased   to Pass---this_____TEST')).toBe('Cased To Pass This TEST');
        });

        it('convert an array of values, ignores undefined/null', () => {
            // @ts-ignore
            expect(fieldTransform.toTitleCase(['happyBirthday', undefined])).toEqual(['Happy Birthday']);
        });
    });
});
