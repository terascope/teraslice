import * as transform from '../src/transforms/field-transform';

describe('field transforms', () => {
    describe('toBoolean should', () => {
        it('return true for truthy values', () => {
            [32, '1', 'string', true, [], {}, Infinity, new Date(), -87]
                .forEach((v) => expect(transform.toBoolean(v)).toBe(true));
        });

        it('return false for falsy values', () => {
            [0, false, undefined, null, NaN, '']
                .forEach((v) => expect(transform.toBoolean(v)).toBe(false));
        });

        it('return false for defined falsy values', () => {
            ['0', 'false', 'no']
                .forEach((v) => expect(transform.toBoolean(v)).toBe(false));
        });
    });

    describe('toUpperCase should', () => {
        it('return an upper case string', () => {
            expect(transform.toUpperCase('lowercase')).toBe('LOWERCASE');
            expect(transform.toUpperCase('11111')).toBe('11111');
            expect(transform.toUpperCase('MixEdCAsE')).toBe('MIXEDCASE');
        });
    });

    describe('toLowerCase should', () => {
        it('return a lower case string', () => {
            expect(transform.toLowerCase('UPPERCASE')).toBe('uppercase');
            expect(transform.toLowerCase('11111')).toBe('11111');
            expect(transform.toLowerCase('MixEdCAsE')).toBe('mixedcase');
        });
    });

    describe('trim should', () => {
        it('trim left and right spaces from a string', () => {
            expect(transform.trim('   string    ')).toBe('string');
            expect(transform.trim('   left')).toBe('left');
            expect(transform.trim('right    ')).toBe('right');
            expect(transform.trim('fast cars race fast', { char: 'fast' })).toBe(' cars race ');
            expect(transform.trim('.*.*a regex test.*.*.*.* stuff', { char: '.*' })).toBe('a regex test');
            expect(transform.trim('\t\r\rtrim this\r\r', { char: '\r' })).toBe('trim this');
            expect(transform.trim('        ')).toBe('');
        });

        it('should return the string if char is not found', () => {
            expect(transform.trim('this is a string', { char: 'b' })).toBe('this is a string');
        });
    });

    describe('trimStart should', () => {
        it('should return the string trimmed from the start', () => {
            expect(transform.trimStart('thisisastring', { char: 's' })).toBe('isastring');
            expect(transform.trimStart('thisisastring', { char: 'isa' })).toBe('string');
            expect(transform.trimStart('    Hello Bob    ')).toBe('Hello Bob    ');
            expect(transform.trimStart('iiii-wordiwords-iii', { char: 'i' })).toBe('-wordiwords-iii');
            expect(transform.trimStart('__--__--__some__--__word', { char: '__--' })).toBe('__some__--__word');
            expect(transform.trimStart('fast cars race fast', { char: 'fast' })).toBe(' cars race fast');
            expect(transform.trimStart('        ')).toBe('');
            expect(transform.trimStart('start    ')).toBe('start    ');
            expect(transform.trimStart('     start')).toBe('start');
        });

        it('should return the string if char is not found', () => {
            expect(transform.trimStart('this is a string', { char: 'b' })).toBe('this is a string');
        });
    });

    describe('trimEnd should', () => {
        it('should return the string trimmed from the end', () => {
            expect(transform.trimEnd('this is a string', { char: 's' })).toBe('this is a ');
            expect(transform.trimEnd('    Hello Bob    ')).toBe('    Hello Bob');
            expect(transform.trimEnd('*****Hello****Bob*****', { char: '*' })).toBe('*****Hello****Bob');
            expect(transform.trimEnd('fast cars race fast', { char: 'fast' })).toBe('fast cars race ');
            expect(transform.trimEnd('        ')).toBe('');
            expect(transform.trimEnd('    end')).toBe('    end');
            expect(transform.trimEnd('end    ')).toBe('end');
        });

        it('should return the string if char is not found', () => {
            expect(transform.trimEnd('this is a string', { char: 'b' })).toBe('this is a string');
        });
    });

    describe('truncate should', () => {
        it('return string of designated length', () => {
            expect(transform.truncate('thisisalongstring', { size: 4 })).toBe('this');
        });

        it('throw an error if args does not have a valid size', () => {
            try {
                expect(transform.truncate('astring', { size: -120 })).toBe('astring');
            } catch (e) {
                expect(e.message).toBe('Invalid size paramter for truncate');
            }
        });
    });

    describe('toArray', () => {
        it('should return an array from a string', () => {
            expect(transform.toArray('astring')).toEqual(['a', 's', 't', 'r', 'i', 'n', 'g']);
            expect(transform.toArray('astring', { delimiter: ',' })).toEqual(['astring']);
            expect(transform.toArray('a-stri-ng', { delimiter: '-' })).toEqual(['a', 'stri', 'ng']);
            expect(transform.toArray('a string', { delimiter: ' ' })).toEqual(['a', 'string']);
        });
    });

    describe('toNumber should', () => {
        it('return a number from a number string or number', () => {
            expect(transform.toNumber(12321)).toBe(12321);
            expect(transform.toNumber('12321')).toBe(12321);
            expect(transform.toNumber('000011')).toBe(11);
            expect(transform.toNumber('000011.9834')).toBe(11.9834);
            expect(transform.toNumber(-34.23432)).toBe(-34.23432);
            expect(transform.toNumber(Infinity)).toBe(Infinity);
            expect(transform.toNumber(true)).toBe(1);
        });

        it('return a number for boolean like if selected in args', () => {
            expect(transform.toNumber(undefined, { booleanLike: true })).toBe(0);
            expect(transform.toNumber('true', { booleanLike: true })).toBe(1);
            expect(transform.toNumber('no', { booleanLike: true })).toBe(0);
            expect(transform.toNumber(null, { booleanLike: true })).toBe(0);
        });

        it('throw an error if input cannot be coerced to a number', () => {
            try {
                expect(transform.toNumber('bobsyouruncle')).toBe(12321);
            } catch (e) { expect(e.message).toBe('could not convert to a number'); }

            try {
                expect(transform.toNumber({})).toBe(12321);
            } catch (e) { expect(e.message).toBe('could not convert to a number'); }

            try {
                expect(transform.toNumber(undefined)).toBe(12321);
            } catch (e) { expect(e.message).toBe('could not convert to a number'); }
        });
    });

    describe('replaceLiteral', () => {
        it('should find and replace values in string', () => {
            expect(transform.replaceLiteral('Hi bob', { search: 'bob', replace: 'mel' })).toBe('Hi mel');
            expect(transform.replaceLiteral('Hi Bob', { search: 'bob', replace: 'Mel ' })).toBe('Hi Bob');
        });
    });

    describe('replaceRegex', () => {
        it('should return string with replaced values', () => {
            expect(transform.replaceRegex('somestring', { regex: 's|e', replace: 'd' })).toBe('domestring');
            expect(transform.replaceRegex('somestring', { regex: 's|e', replace: 'd', global: true })).toBe('domddtring');
            expect(transform.replaceRegex('soMesTring', {
                regex: 'm|t', replace: 'W', global: true, ignoreCase: true
            })).toBe('soWesWring');
            expect(transform.replaceRegex('a***a***a', { regex: '\\*', replace: '', global: true })).toBe('aaa');
        });
    });

    describe('toUnixTime should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const milli = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(transform.toUnixTime(testDate)).toBe(Math.floor(milli / 1000));
            expect(transform.toUnixTime(isoTime)).toBe(Math.floor(milli / 1000));
            expect(transform.toUnixTime(milli)).toBe(Math.floor(milli / 1000));
            expect(transform.toUnixTime(milli, { ms: true })).toBe(milli);
        });

        it('convert date time in milliseconds to unix time s', () => {
            expect(transform.toUnixTime(1580418907000)).toBe(1580418907);
        });

        it('convert date time in milliseconds to unix time ms', () => {
            expect(transform.toUnixTime(1580418907000, { ms: true })).toBe(1580418907000);
        });

        it('convert string dates to unix time', () => {
            expect(transform.toUnixTime('2020-01-01')).toBe(1577836800);
            expect(transform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800);
            expect(transform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800);
        });

        it('invalid dates will throw errors', () => {
            try {
                expect(transform.toUnixTime('notADate')).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot transform to unix time'); }

            try {
                expect(transform.toUnixTime(true)).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot transform to unix time'); }

            try {
                expect(transform.toUnixTime(undefined)).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot transform to unix time'); }

            try {
                expect(transform.toUnixTime({})).toBe(1577836800);
            } catch (e) { expect(e.message).toBe('Not a valid date, cannot transform to unix time'); }
        });
    });

    describe('toISO8601 should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const unixTime = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(transform.toISO8601(testDate)).toBe(isoTime);
            expect(transform.toISO8601(isoTime)).toBe(isoTime);
            expect(transform.toISO8601(unixTime)).toBe(isoTime);
        });

        it('convert date time in seconds to unix time', () => {
            expect(transform.toISO8601(1580418907, { resolution: 'seconds' })).toBe('2020-01-30T21:15:07.000Z');
        });

        it('convert string dates to unix time', () => {
            expect(transform.toISO8601('2020-01-01')).toBe('2020-01-01T00:00:00.000Z');
            expect(transform.toISO8601('Jan 1, 2020 UTC')).toBe('2020-01-01T00:00:00.000Z');
            expect(transform.toISO8601('2020 Jan, 1 UTC')).toBe('2020-01-01T00:00:00.000Z');
        });

        it('invalid dates will throw errors', () => {
            try {
                transform.toUnixTime('notADate');
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time');
            }
        });
    });

    describe('formatDate', () => {
        it('should return the formated date from a date object', () => {
            const config = { format: 'MM-dd-yyyy' };

            expect(transform.formatDate(new Date(2020, 2, 18), config)).toBe('03-18-2020');
            expect(transform.formatDate(new Date('Jan 3 2001'), config)).toBe('01-03-2001');
        });

        it('should return the formated date from a valid string date', () => {
            expect(transform.formatDate('2020-01-14T20:34:01.034Z', { format: 'MMM do yy' })).toBe('Jan 14th 20');
            expect(transform.formatDate('March 3, 2019', { format: 'M/d/yyyy' })).toBe('3/3/2019');
        });

        it('should return formated date from millitime time', () => {
            expect(transform.formatDate(1581013130856, { format: 'yyyy-MM-dd' })).toBe('2020-02-06');
            expect(transform.formatDate(1581013130, { format: 'yyyy-MM-dd', resolution: 'seconds' })).toBe('2020-02-06');
        });

        it('should throw error if date cannot be formated', () => {
            try {
                expect(transform.formatDate('bad date', { format: 'yyyy-MM-dd' })).toBe('2020-02-06');
            } catch (e) { expect(e.message).toBe('Not a valid date'); }
        });
    });

    describe('parseDate', () => {
        it('should return date object from date string', () => {
            expect(transform.parseDate('2020-01-10-00:00', { format: 'yyyy-MM-ddxxx' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            expect(transform.parseDate('Jan 10, 2020-00:00', { format: 'MMM dd, yyyyxxx' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            expect(transform.parseDate(1581025950223, { format: 'T' })).toStrictEqual(new Date('2020-02-06T21:52:30.223Z'));
            expect(transform.parseDate(1581025950, { format: 't' })).toStrictEqual(new Date('2020-02-06T21:52:30.000Z'));
            expect(transform.parseDate('1581025950', { format: 't' })).toStrictEqual(new Date('2020-02-06T21:52:30.000Z'));
        });

        it('should throw error if cannot parse', () => {
            try {
                expect(transform.parseDate('2020-01-10', { format: 't' })).toStrictEqual(new Date('2020-01-10T00:00:00.000Z'));
            } catch (e) { expect(e.message).toBe('Cannot parse date'); }
        });
    });

    describe('formatPhoneNumber should', () => {
        it('return phone number without dashes, spaces, or +', () => {
            expect(transform.toISDN('4917600000000')).toBe('4917600000000');
            expect(transform.toISDN('    1 (555) 555 2311     ')).toBe('15555552311');
            expect(transform.toISDN('+33-1-22-33-44-55')).toBe('33122334455');
            expect(transform.toISDN('+11 7 812 222 2323')).toBe('178122222323');
            expect(transform.toISDN('1.555.555.2311')).toBe('15555552311');
            expect(transform.toISDN('1234')).toBe('1234');
            expect(transform.toISDN('86 591 83123456')).toBe('8659183123456');
            expect(transform.toISDN('33 08 54 23 12 00')).toBe('33854231200');
            expect(transform.toISDN('+330854231200')).toBe('33854231200');
            expect(transform.toISDN('49 116 4331 12348')).toBe('49116433112348');
            expect(transform.toISDN('1(800)FloWErs')).toBe('18003569377');
            expect(transform.toISDN('86 598 13411-859395')).toBe('8659813411859395');
            expect(transform.toISDN('467*(070)1.23[45]/67')).toBe('4670701234567');
        });

        it('return phone number if input is a number', () => {
            expect(transform.toISDN(4917600000000)).toBe('4917600000000');
            expect(transform.toISDN(49187484)).toBe('49187484');
        });

        it('throw an error when it can not determine the phone number', () => {
            try {
                transform.toISDN('34');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try {
                transform.toISDN('notAphoneNumber');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try {
                transform.toISDN('n/a');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try {
                transform.toISDN('+467+070+123+4567');
            } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }
        });
    });

    describe('toCamelCase', () => {
        it('should return a camel case string', () => {
            expect(transform.toCamelCase('I need camel case')).toBe('iNeedCamelCase');
            expect(transform.toCamelCase('happyBirthday')).toBe('happyBirthday');
            expect(transform.toCamelCase('what_is_this')).toBe('whatIsThis');
            expect(transform.toCamelCase('this-should-be-camel')).toBe('thisShouldBeCamel');
            expect(transform.toCamelCase('Cased   to Pass---this_____TEST')).toBe('casedToPassThisTEST');
        });
    });

    describe('toKebabCase', () => {
        it('should return a kebab case string', () => {
            expect(transform.toKebabCase('I need kebab case')).toBe('i-need-kebab-case');
            expect(transform.toKebabCase('happyBirthday')).toBe('happy-birthday');
            expect(transform.toKebabCase('what_is_this')).toBe('what-is-this');
            expect(transform.toKebabCase('this-should-be-kebab')).toBe('this-should-be-kebab');
            expect(transform.toKebabCase('Cased   to Pass---this_____TEST')).toBe('cased-to-pass-this-test');
        });
    });

    describe('toPascalCase', () => {
        it('should return a pascal case string', () => {
            expect(transform.toPascalCase('I need pascal case')).toBe('INeedPascalCase');
            expect(transform.toPascalCase('happyBirthday')).toBe('HappyBirthday');
            expect(transform.toPascalCase('what_is_this')).toBe('WhatIsThis');
            expect(transform.toPascalCase('this-should-be-pascal')).toBe('ThisShouldBePascal');
            expect(transform.toPascalCase('Cased   to Pass---this_____TEST')).toBe('CasedToPassThisTEST');
        });
    });

    describe('toSnakeCase', () => {
        it('should return a pascal case string', () => {
            expect(transform.toSnakeCase('I need snake case')).toBe('i_need_snake_case');
            expect(transform.toSnakeCase('happyBirthday')).toBe('happy_birthday');
            expect(transform.toSnakeCase('what_is_this')).toBe('what_is_this');
            expect(transform.toSnakeCase('this-should-be-snake')).toBe('this_should_be_snake');
            expect(transform.toSnakeCase('Cased   to Pass---this_____TEST')).toBe('cased_to_pass_this_test');
        });
    });

    describe('toTitleCase', () => {
        it('should return a string with every word capitalized', () => {
            expect(transform.toTitleCase('I need some capitols')).toBe('I Need Some Capitols');
            expect(transform.toTitleCase('happyBirthday')).toBe('Happy Birthday');
            expect(transform.toTitleCase('what_is_this')).toBe('What Is This');
            expect(transform.toTitleCase('this-should-be-capital')).toBe('This Should Be Capital');
            expect(transform.toTitleCase('Cased   to Pass---this_____TEST')).toBe('Cased To Pass This TEST');
        });
    });
});
