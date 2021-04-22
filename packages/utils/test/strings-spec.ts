import 'jest-extended';
import {
    escapeString
} from '../src/deps';
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
    isMacAddress,
    isUrl,
    isUUID,
    contains,
    trim,
    trimStart,
    trimEnd
} from '../src/strings';

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
            ['_key', '_key'],
            ['hello-there', 'helloThere'],
            ['helloThere', 'helloThere'],
            ['HelloThere', 'helloThere'],
            ['hello_there', 'helloThere'],
            ['hello there', 'helloThere'],
            ['hello THERE', 'helloThere'],
            ['HELLO THERE', 'helloThere'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toCamelCase(input)).toEqual(expected);
        });
    });

    describe('toPascalCase', () => {
        test.each([
            ['_key', '_Key'],
            ['hello-there', 'HelloThere'],
            ['helloThere', 'HelloThere'],
            ['HelloThere', 'HelloThere'],
            ['hello_there', 'HelloThere'],
            ['hello there', 'HelloThere'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toPascalCase(input)).toEqual(expected);
        });
    });

    describe('toKebabCase', () => {
        test.each([
            ['_key', '_key'],
            ['hello-there', 'hello-there'],
            ['helloThere', 'hello-there'],
            ['HelloThere', 'hello-there'],
            ['hello_there', 'hello-there'],
            ['hello there', 'hello-there'],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toKebabCase(input)).toEqual(expected);
        });
    });

    describe('toSnakeCase', () => {
        test.each([
            ['_key', '_key'],
            ['hello-there', 'hello_there'],
            ['helloThere', 'hello_there'],
            ['HelloThere', 'hello_there'],
            ['hello_there', 'hello_there'],
            ['hello there', 'hello_there'],
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

    describe('isMacAddress', () => {
        test.each([
            ['00:1f:f3:5b:2b:1f'],
            ['00-1f-f3-5b-2b-1f'],
            ['001f.f35b.2b1f'],
            ['00 1f f3 5b 2b 1f'],
            ['001ff35b2b1f']
        ])('should return true for valid mac address', (input) => {
            expect(isMacAddress(input)).toEqual(true);
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
            expect(isMacAddress(input)).toEqual(false);
        });

        test.each([
            ['001ff35b2b1f', 'any', true],
            ['00:1f:f3:5b:2b:1f', 'colon', true],
            ['00-1f-f3-5b-2b-1f', 'dash', true],
            ['00 1f f3 5b 2b 1f', 'space', true],
            ['001f.f35b.2b1f', 'dot', true],
            ['001ff35b2b1f', 'none', true],
            ['00:1f:f3:5b:2b:1f', ['dash', 'colon'], true],
            ['00:1f:f3:5b:2b:1f', 'dash', false],
            ['00 1f f3 5b 2b 1f', 'colon', false],
            ['001ff35b2b1f', 'colon', false],
            ['001ff35b2b1f', ['dash', 'colon'], false]

        ])('should validate based on delimiter', (input, delimiter: any, expected) => {
            expect(isMacAddress(input, delimiter)).toEqual(expected);
        });
    });

    describe('isUrl', () => {
        test.each([
            ['http://someurl.com'],
            ['http://someurl.com.uk'],
            ['https://someurl.cc.ru.ch'],
            ['ftp://someurl.bom:8080?some=bar&hi=bob'],
            ['http://xn--fsqu00a.xn--3lr804guic'],
            ['http://example.com/hello%20world'],
            ['bob.com'],
        ])('should return true for valid urls', (input) => {
            expect(isUrl(input)).toEqual(true);
        });

        test.each([
            ['somerandomstring'],
            [null],
            [true],
            ['isthis_valid_uri.com'],
            ['http://sthis valid uri.com'],
            ['htp://validuri.com'],
            ['hello://validuri.com'],
            [{ url: 'http:thisisaurl.com' }],
            [12345],
        ])('should return false for invalid urls', (input) => {
            expect(isUrl(input)).toEqual(false);
    });

    describe('isUUID', () => {
        test.each([
            ['95ecc380-afe9-11e4-9b6c-751b66dd541e'],
            ['0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B'],
            ['123e4567-e89b-82d3-f456-426655440000']
        ])('should return true for valid UUIDs', (input) => {
            expect(isUUID(input)).toEqual(true);
        });

        test.each([
            [''],
            ['95ecc380:afe9:11e4:9b6c:751b66dd541e'],
            ['123e4567-e89b-x2d3-0456-426655440000'],
            ['123e4567-e89b-12d3-a456-42600'],
            [undefined],
            ['randomstring'],
            [true],
            [{}],
        ])('should return false for non UUIDs', (input) => {
            expect(isUUID(input)).toEqual(false);
        });
    });

    describe('contains', () => {
        test.each([
            ['thisisastring', 'this'],
            ['a new string', 'new'],
            ['12345', '23']
        ])('should return true for strings that contains  the substring', (input, substr) => {
            expect(contains(input, substr)).toEqual(true);
        });

        test.each([
            ['this is a string', 'foo'],
            ['', 'foo'],
            [['one', 'two', 'three'], 'one'],
            [undefined, 'hello'],
            [12345, '123']
        ])('should return false if input is not a string or does not contain substring', (input, substr) => {
            expect(contains(input, substr)).toEqual(false);
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
});
