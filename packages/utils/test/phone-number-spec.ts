import { parsePhoneNumber, isISDN, isPhoneNumberLike } from '../src/index.js';

describe('parsePhoneNumber', () => {
    test.each([
        ['4917600000000', '4917600000000'],
        ['    1 (555) 555 2311     ', '15555552311'],
        ['+33-1-22-33-44-55', '33122334455'],
        ['+11 7 812 222 2323', '178122222323'],
        ['1.555.555.2311', '15555552311'],
        ['1234', '1234'],
        ['86 591 83123456', '8659183123456'],
        ['33 08 54 23 12 00', '33854231200'],
        ['+330854231200', '33854231200'],
        ['49 116 4331 12348', '49116433112348'],
        ['1(800)FloWErs', '18003569377'],
        ['86 598 13411-859395', '8659813411859395'],
        ['467*(070)1.23[45]/67', '4670701234567'],
        [4917600000000, '4917600000000'],
        [49187484, '49187484']
    ])('should return a string of digits from the ISDN input', (input, expected) => {
        expect(parsePhoneNumber(input)).toEqual(expected);
    });

    it('should throw an error when it can not determine the phone number', () => {
        try {
            parsePhoneNumber('34');
        } catch (e) {
            expect(e.message).toBe('Could not determine the incoming phone number');
        }

        try {
            parsePhoneNumber('notAphoneNumber');
        } catch (e) {
            expect(e.message).toBe('Could not determine the incoming phone number');
        }

        try {
            parsePhoneNumber('n/a');
        } catch (e) {
            expect(e.message).toBe('Could not determine the incoming phone number');
        }

        try {
            parsePhoneNumber('+467+070+123+4567');
        } catch (e) {
            expect(e.message).toBe('Could not determine the incoming phone number');
        }
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
    ])('validate ISDN numbers without country code', (input, expected) => {
        expect(isISDN(input)).toEqual(expected);
    });

    test.each([
        ['46707123456', 'SE', true],
        ['1 808 915 6800', 'US', true],
        ['+18089156800', 'US', true],
        [79525554602, 'RU', true],
        ['46707123456', 'US', false],
        ['1 808 915 6800', 'RU', false],
        [79525554602, 'FR', false],
        ['unknown', 'US', false],
        ['18089156800', 'InvalidCountryCode', false]
    ])('validate ISDN numbers with country code', (input, country, expected) => {
        expect(isISDN(input, country)).toEqual(expected);
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
