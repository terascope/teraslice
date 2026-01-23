import 'jest-extended';
import { escapeString } from '../src/deps.js';
import {
    toSafeString,
    unescapeString,
    getWordParts,
    toCamelCase,
    toPascalCase,
    toSnakeCase,
    toKebabCase,
    parseList,
    joinList,
    isString,
    isEmail,
    isMACAddress,
    isURL,
    isUUID,
    isBase64,
    isFQDN,
    isCountryCode,
    isAlphaNumeric,
    isPostalCode,
    isPort,
    isMIMEType,
    contains,
    trim,
    trimStart,
    trimEnd,
    isAlpha,
    toTitleCase,
    stringEntropy,
    StringEntropy,
    shannonEntropy
} from '../src/strings.js';

describe('String Utils', () => {
    describe('isString', () => {
        test.each([
            ['hello there', true],
            ['123', true],
            [true, false],
            [123, false],
            [['not a string'], false],
            [{ foo: 'bar' }, false],
            [undefined, false],
            [null, false],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(isString(input)).toEqual(expected);
        });
    });

    describe('toSafeString', () => {
        test.each([
            ['hello-there', 'hello-there'],
            ['++_--hello', 'hello'],
            ['Hello_Hi THERE', 'hello_hi_there'],
            ['Howdy-Hi?+ you', 'howdy-hi-you'],
            ['Hi there#*', 'hi-there'],
            ['<HI> 3', 'hi-3'],
            ['123', '123'],
            [123, '123'],
            [null, ''],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toSafeString(input)).toEqual(expected);
        });
    });

    describe('getWordParts', () => {
        test.each([
            ['hello-there', ['hello', 'there']],
            ['++_--hello', ['hello']],
            ['GraphQL', ['GraphQL']],
            ['Howdy-Hi?+ you', ['Howdy', 'Hi', 'you']],
            ['123', ['123']],
            ['DataTypes', ['Data', 'Types']],
            ['Data_Type', ['Data', 'Type']],
            ['Foo Bar', ['Foo', 'Bar']],
            ['foo_bar', ['foo', 'bar']],
            ['_key', ['_key']],
            ['-key', ['key']],
            ['__example', ['__example']],
            ['SomeASTNode123', ['SomeAST', 'Node123']],
            ['foo _ bar   baz 123', ['foo', 'bar', 'baz', '123']],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(getWordParts(input)).toStrictEqual(expected);
        });
    });

    describe('toCamelCase', () => {
        test.each([
            ['_key', 'key'],
            ['hello-there', 'helloThere'],
            ['helloThere', 'helloThere'],
            ['HelloThere', 'helloThere'],
            ['hello_there', 'helloThere'],
            ['hello there', 'helloThere'],
            ['hello THERE', 'helloThere'],
            ['HELLO THERE', 'helloThere'],
            ['SystemCRT', 'systemCrt'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toCamelCase(input)).toEqual(expected);
        });
    });

    describe('toPascalCase', () => {
        test.each([
            ['_key', 'Key'],
            ['hello-there', 'HelloThere'],
            ['helloThere', 'HelloThere'],
            ['HelloThere', 'HelloThere'],
            ['hello_there', 'HelloThere'],
            ['hello there', 'HelloThere'],
            ['SystemCRT', 'SystemCrt'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toPascalCase(input)).toEqual(expected);
        });
    });

    describe('toTitleCase', () => {
        test.each([
            ['_key', 'Key'],
            ['hello-there', 'Hello There'],
            ['helloThere', 'Hello There'],
            ['HelloThere', 'Hello There'],
            ['hello_there', 'Hello There'],
            ['hello there', 'Hello There'],
            ['SystemCRT', 'System CRT'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toTitleCase(input)).toEqual(expected);
        });
    });

    describe('toKebabCase', () => {
        test.each([
            ['_key', 'key'],
            ['hello-there', 'hello-there'],
            ['helloThere', 'hello-there'],
            ['HelloThere', 'hello-there'],
            ['hello_there', 'hello-there'],
            ['hello there', 'hello-there'],
            ['SystemCRT', 'system-crt'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toKebabCase(input)).toEqual(expected);
        });
    });

    describe('toSnakeCase', () => {
        test.each([
            ['_key', 'key'],
            ['hello-there', 'hello_there'],
            ['helloThere', 'hello_there'],
            ['HelloThere', 'hello_there'],
            ['hello_there', 'hello_there'],
            ['hello there', 'hello_there'],
            ['SystemCRT', 'system_crt'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toSnakeCase(input)).toEqual(expected);
        });
    });

    const escapeTests: (string[])[] = [
        ['hello', 'hello'],
        ['hello.', 'hello.'],
        ['hello\\.', 'hello\\\\.'],
        [' \' " ', ' \\\' \\" '],
        ['something-xy40\\" value \\\' 8008', 'something-xy40\\\\\\" value \\\\\\\' 8008'],
        ['\\\\.', '\\\\\\\\.'],
        ['\\ ', '\\\\ '],
        ['/value\\\\', '/value\\\\\\\\'],
        ['', ''],
    ];

    describe('escapeString', () => {
        test.each(escapeTests)('should convert %j to %j', (input: string, expected: string) => {
            expect(escapeString(input)).toEqual(expected);
        });
    });

    describe('unescapeString', () => {
        test.each(escapeTests)('should convert the original string %j to %j', (expected: string, input: string) => {
            expect(unescapeString(input)).toEqual(expected);
        });
    });

    describe('parseList', () => {
        test.each([
            ['a', ['a']],
            ['a,b,c', ['a', 'b', 'c']],
            ['a , b,c,   ', ['a', 'b', 'c']],
            [['a ', ' b ', 'c ', false, '', null], ['a', 'b', 'c']],
            [null, []]
        ])('should parse %j to be %j', (input, expected) => {
            expect(parseList(input)).toEqual(expected);
        });
    });

    describe('joinList', () => {
        test.each([
            [['foo'], 'foo'],
            [['foo', 'bar'], 'foo and bar'],
            [['foo zie', 'bar', 'baz'], 'foo zie, bar and baz'],
            [['foo1', 'bar1', 'baz1', 'foo2', 'bar2', 'baz2'], 'foo1, bar1, baz1, foo2, bar2 and baz2'],
            [['foo', null, 'baz', ''], 'foo and baz'],
            [['foo', 'foo', 'baz', 'baz', 'foo'], 'foo and baz'],
            [[1, 2, 3, true, false, Symbol('bar')], '1, 2, 3, true, false and Symbol(bar)'],
        ])('should parse %j to be %j', (input, expected) => {
            expect(joinList(input)).toEqual(expected);
        });
    });

    describe('isEmail', () => {
        test.each([
            ['string@gmail.com', true],
            ['non.us.email@thing.com.uk', true],
            ['Abc@def@example.com', true],
            ['cal+henderson@iamcalx.com', true],
            ['customer/department=shipping@example.com', true],
            ['user@blah.com/junk.junk?a=<tag value="junk"', false],
            ['Abc@def  @  example.com', false],
            ['bad email address', false],
            [undefined, false],
            [12345, false],
            [true, false]
        ])('should validate email addresses', (input, expected) => {
            expect(isEmail(input)).toEqual(expected);
        });
    });

    describe('isMACAddress', () => {
        test.each([
            ['00:1f:f3:5b:2b:1f'],
            ['00-1f-f3-5b-2b-1f'],
            ['001f.f35b.2b1f'],
            ['00 1f f3 5b 2b 1f'],
            ['001ff35b2b1f']
        ])('should return true for valid mac address', (input) => {
            expect(isMACAddress(input)).toEqual(true);
        });

        test.each([
            ['00:1:f:5b:2b:1f'],
            ['00.1f.f3.5b.2b.1f'],
            ['00-1Z-fG-5b-2b-1322f'],
            ['23423423'],
            ['00_1Z_fG_5b_2b_13'],
            [1233456],
            [{}],
            [true]
        ])('should return false for invalid mac address', (input) => {
            expect(isMACAddress(input)).toEqual(false);
        });

        test.each([
            ['001ff35b2b1f', 'any', true],
            ['00:1f:f3:5b:2b:1f', 'colon', true],
            ['00-1f-f3-5b-2b-1f', 'dash', true],
            ['00 1f f3 5b 2b 1f', 'space', true],
            ['001f.f35b.2b1f', 'dot', true],
            ['001ff35b2b1f', 'none', true],
            ['00:1f:f3:5b:2b:1f', 'colon', true],
            ['00:1f:f3:5b:2b:1f', 'dash', false],
            ['00 1f f3 5b 2b 1f', 'colon', false],
            ['001ff35b2b1f', 'colon', false],
            ['001ff35b2b1f', 'dash', false]

        ])('should validate based on delimiter', (input, delimiter: any, expected) => {
            expect(isMACAddress(input, delimiter)).toEqual(expected);
        });
    });

    describe('isURL', () => {
        test.each([
            ['http://someurl.com', true],
            ['http://someurl.com.uk', true],
            ['https://someurl.cc.ru.ch', true],
            ['ftp://someurl.bom:8080?some=bar&hi=bob', true],
            ['http://xn--fsqu00a.xn--3lr804guic', true],
            ['http://example.com/hello%20world', true],
            ['bob.com', true],
            ['somerandomstring', false],
            [null, false],
            [true, false],
            ['isthis_valid_uri.com', false],
            ['http://sthis valid uri.com', false],
            ['htp://validuri.com', false],
            ['hello://validuri.com', false],
            [{ url: 'http:thisisaurl.com' }, false],
            [12345, false],
        ])('should return true for valid urls', (input, expected) => {
            expect(isURL(input)).toEqual(expected);
        });
    });

    describe('isUUID', () => {
        test.each([
            ['95ecc380-afe9-11e4-9b6c-751b66dd541e', true],
            ['0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B', false],
            ['0668CF8B-27F8-2F4D-8F2D-763AC7C8F68B', true],
            ['123e4567-e89b-82d3-f456-426655440000', false],
            ['123e4567-e89b-82d3-A456-426655440000', true],
            ['', false],
            ['95ecc380:afe9:11e4:9b6c:751b66dd541e', false],
            ['123e4567-e89b-x2d3-0456-426655440000', false],
            ['123e4567-e89b-12d3-a456-42600', false],
            [undefined, false],
            ['randomstring', false],
            [true, false],
            [{}, false],
        ])('input %s should return %s', (input, expected) => {
            expect(isUUID(input)).toEqual(expected);
        });
    });

    describe('isBase64', () => {
        test.each([
            ['ZnJpZW5kbHlOYW1lNw==', true],
            ['bW9kZWxVUkwx', true],
            ['manufacturerUrl7', false],
            ['undefined', false],
            [true, false],
            [12345, false],
            [undefined, false],
            ['randomstring', false],
            [{}, false],
        ])('should return true for valid base64 strings', (input, expected) => {
            expect(isBase64(input)).toEqual(expected);
        });
    });

    describe('isFQDN', () => {
        test.each([
            ['example.com', true],
            ['international-example.com.br', true],
            ['some.other.domain.uk', true],
            ['1234.com', true],
            ['no_underscores.com', false],
            ['undefined', false],
            [true, false],
            [12345, false],
            [undefined, false],
            ['**.bad.domain.com', false],
            ['example.0', false],
            [{}, false],
        ])('should return true for valid domains', (input, expected) => {
            expect(isFQDN(input)).toEqual(expected);
        });
    });

    describe('isCountryCode', () => {
        test.each([
            ['US', true],
            ['IN', true],
            ['GB', true],
            ['JP', true],
            ['ZM', true],
            ['USA', false],
            ['UK', false],
            [true, false],
            [null, false],
            ['II', false],
            ['longerstring', false],
            ['12345US234', false],
            [12345, false],
            ['', false],
            [{ in: 'US' }, false]
        ])('should return true for valid ISO31661Alpha2 country codes', (input, expected) => {
            expect(isCountryCode(input)).toEqual(expected);
        });
    });

    describe('isAlphanumeric', () => {
        test.each([
            ['example', true],
            ['123456', true],
            ['example123456', true],
            ['no_underscores.com', false],
            [true, false],
            [123456, false],
            [undefined, false],
            [{}, false],
        ])('should return true for valid alphanumeric inputs and no locale', (input, expected) => {
            expect(isAlphaNumeric(input)).toEqual(expected);
        });

        test.each([
            ['ThisiZĄĆĘŚŁ1234', 'pl-Pl', true],
            ['ThisiZĄĆĘŚŁ1234', 'en-HK', false]
        ])('should return true for valid alphanumeric inputs with a locale', (input, locale, expected) => {
            expect(isAlphaNumeric(input as any, locale as any)).toEqual(expected);
        });
    });

    describe('isAlpha', () => {
        test.each([
            ['example', true],
            ['123456', false],
            ['example123456', false],
            ['no_underscores.com', false],
            [true, false],
            [123456, false],
            [undefined, false],
            [{}, false],
        ])('should return true for valid alphabetical inputs and no locale', (input, expected) => {
            expect(isAlpha(input)).toEqual(expected);
        });

        test.each([
            ['ThisiZĄĆĘŚŁ1234', 'pl-Pl', false],
            ['ThisiZĄĆĘŚŁ', 'pl-Pl', true],
            ['ThisiZĄĆĘŚŁ', 'en-HK', false]
        ])('should return true for valid alphabetical inputs with a locale', (input, locale, expected) => {
            expect(isAlpha(input as any, locale as any)).toEqual(expected);
        });
    });

    describe('isPostalCode', () => {
        test.each([
            ['85249', true],
            [85249, true],
            ['75008', true],
            [12345689, true],
            [123456789, false],
            [false, false],
            ['bobsyouruncle', false],
            [undefined, false],
            ['somebadstring', false],
            [[], false],
            [{ code: '12345' }, false],
        ])('should return true for valid postal codes and no locale, %s should be %s', (input, expected) => {
            expect(isPostalCode(input)).toEqual(expected);
        });

        test.each([
            ['85249', 'US', true],
            ['75008', 'FR', true],
            ['191123', 'RU', true],
            ['85249', 'RU', false],
            ['8524933', 'US', false],
            ['8524', 'CN', false],
            ['this is not a postal code', 'CN', false],
            [undefined, 'US', false]
        ])('should return true for valid postal codes with locale', (input, locale, expected) => {
            expect(isPostalCode(input, locale as any)).toEqual(expected);
        });
    });

    describe('isPort', () => {
        test.each([
            ['49151', true],
            ['0', true],
            [8080, true],
            [80, true],
            ['65536', false],
            ['-110', false],
            ['not a port', false],
            [808000, false],
            [false, false],
            [null, false],
        ])('should return true valid port number or number string', (input, expected) => {
            expect(isPort(input)).toEqual(expected);
        });
    });

    describe('isMIMEType', () => {
        test.each([
            ['application/javascript', true],
            ['application/graphql', true],
            ['text/html', true],
            ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true],
            ['application', false],
            ['', false],
            [false, false],
            [{}, false],
            [12345, false],
        ])('should return true for valid MIME types', (input, expected) => {
            expect(isMIMEType(input)).toEqual(expected);
        });
    });

    describe('contains', () => {
        test.each([
            ['thisisastring', 'this', true],
            ['a new string', 'new', true],
            ['12345', '23', true],
            ['this is a string', 'foo', false],
            ['', 'foo', false],
            [['one', 'two', 'three'], 'one', false],
            [undefined, 'hello', false],
            [12345, '123', false]
        ])('should return true for strings that contains  the substring', (input, substr, expected) => {
            expect(contains(input, substr)).toEqual(expected);
        });
    });

    describe('trim', () => {
        test.each([
            ['  _key    ', '_key', undefined],
            ['      hello-there', 'hello-there', undefined],
            ['helloThere', 'Ther', 'hello'],
            ['aastuffaa', 'stuff', 'a'],
            ['abastuffa a', 'bastuffa ', 'a'],
        ])('should convert %s to be %s', (input: any, expected: any, char?: string) => {
            expect(trim(input, char)).toEqual(expected);
        });
    });

    describe('trimStart', () => {
        test.each([
            ['  _key    ', '_key    ', undefined],
            ['      hello-there', 'hello-there', undefined],
            ['helloThere', 'There', 'hello'],
            ['aastuffaa', 'stuffaa', 'a'],
            ['abastuffa a', 'bastuffa a', 'a'],
        ])('should convert %s to be %s', (input: any, expected: any, char?: string) => {
            expect(trimStart(input, char)).toEqual(expected);
        });
    });

    describe('trimEnd', () => {
        test.each([
            ['  _key    ', '  _key', undefined],
            ['      hello-there', '      hello-there', undefined],
            ['helloTherehello', 'helloTher', 'hello'],
            ['aastuffaa', 'aastuff', 'a'],
            ['abastuffa a', 'abastuffa ', 'a'],
        ])('should convert %s to be %s', (input: any, expected: any, char?: string) => {
            expect(trimEnd(input, char)).toEqual(expected);
        });
    });

    describe('shannonEntropy', () => {
        test.each([
            ['1223334444', 1.8464393446710154],
            ['0', 0],
            ['01', 1],
            ['0123', 2],
            ['01234567', 3],
            ['0123456789abcdef', 4],
            ['1035830701', 2.4464393446710155],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(shannonEntropy(input)).toEqual(expected);
        });
    });

    describe('entropy', () => {
        describe(`${StringEntropy.shannon}`, () => {
            test.each([
                ['1223334444', 1.8464393446710154],
                ['0', 0],
                ['01', 1],
                ['0123', 2],
                ['01234567', 3],
                ['0123456789abcdef', 4],
                ['1035830701', 2.4464393446710155],
            ])('should convert %s to be %s', (input: any, expected: any) => {
                const fn = stringEntropy(StringEntropy.shannon);
                expect(fn(input)).toEqual(expected);
            });
        });
    });
});
