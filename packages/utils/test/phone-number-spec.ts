import { parsePhoneNumber } from '../src';

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
