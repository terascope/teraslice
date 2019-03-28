import 'jest-extended';
import { toSafeString } from '../src';

describe('String Utils', () => {
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
        ])('should convert %s to be %s', (input, expected) => {
            expect(toSafeString(input)).toEqual(expected);
        });
    });
});
