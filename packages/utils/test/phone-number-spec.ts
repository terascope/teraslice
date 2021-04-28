import { parsePhoneNumber, isISDN, isPhoneNumberLike } from '../src';

describe('parsePhoneNumber', () => {
    it('return phone number without dashes, spaces, or +', () => {
        expect(parsePhoneNumber('4917600000000')).toBe('4917600000000');
        expect(parsePhoneNumber('    1 (555) 555 2311     ')).toBe('15555552311');
        expect(parsePhoneNumber('+33-1-22-33-44-55')).toBe('33122334455');
        expect(parsePhoneNumber('+11 7 812 222 2323')).toBe('178122222323');
        expect(parsePhoneNumber('1.555.555.2311')).toBe('15555552311');
        expect(parsePhoneNumber('1234')).toBe('1234');
        expect(parsePhoneNumber('86 591 83123456')).toBe('8659183123456');
        expect(parsePhoneNumber('33 08 54 23 12 00')).toBe('33854231200');
        expect(parsePhoneNumber('+330854231200')).toBe('33854231200');
        expect(parsePhoneNumber('49 116 4331 12348')).toBe('49116433112348');
        expect(parsePhoneNumber('1(800)FloWErs')).toBe('18003569377');
        expect(parsePhoneNumber('86 598 13411-859395')).toBe('8659813411859395');
        expect(parsePhoneNumber('467*(070)1.23[45]/67')).toBe('4670701234567');
    });

    it('return phone number if input is a number', () => {
        expect(parsePhoneNumber(4917600000000)).toBe('4917600000000');
        expect(parsePhoneNumber(49187484)).toBe('49187484');
    });

    it('throw an error when it can not determine the phone number', () => {
        try {
            parsePhoneNumber('34');
        } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

        try {
            parsePhoneNumber('notAphoneNumber');
        } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

        try {
            parsePhoneNumber('n/a');
        } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

        try {
            parsePhoneNumber('+467+070+123+4567');
        } catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }
    });
});

describe('isISDN', () => {
    test.each([
        ['46707123456', true],
        ['1 808 915 6800', true],
        ['1-808-915-6800', true],
        ['+18089156800', true],
        ['+7-952-5554-602', true],
        ['79525554602', true],
        [79525554602, true],
        ['unknown', false],
        ['52', false],
        ['34000000000', false],
        ['4900000000000', false],
        ['1234', false],
        ['22345', false],
        ['223457', false],
        ['2234578', false],
        ['123', false],
        ['5', false],
        ['011', false],
        [7, false],
        [true, false],
        [{}, false],
        [[], false],
    ])('validate ISDN numbers', (input, expected) => {
        expect(isISDN(input)).toEqual(expected);
    });
});

describe('isPhoneNumberLike', () => {
    test.each([
        ['46707123456', true],
        ['1 808 915 6800', true],
        ['1-808-915-6800', true],
        ['+18089156800', true],
        ['+7-952-5554-602', true],
        [79525554602, true],
        ['4900000000000', true],
        ['2234578', true],
        ['223457823432432423324', false],
        ['unknown', false],
        ['52', false],
        ['123', false],
        [7, false],
        [true, false],
        [{}, false],
        [[], false],
    ])('validate inputs that resemble phone numbers, less strict than isISDN', (input, expected) => {
        expect(isPhoneNumberLike(input)).toEqual(expected);
    });
});
