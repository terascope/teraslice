import * as transform from '../src/transforms/field-transform';

describe('field transforms', () => {
    describe('removeIpZoneId should', () => {
        it('remove zone id and return ip address', () => {
            expect(transform.removeIpZoneId('8.8.8.8')).toBe('8.8.8.8');
            expect(transform.removeIpZoneId('172.35.12.18')).toBe('172.35.12.18');
            expect(transform.removeIpZoneId('2001:db8::1')).toBe('2001:db8::1');
            expect(transform.removeIpZoneId('fe80::1ff:fe23:4567:890a%eth2')).toBe('fe80::1ff:fe23:4567:890a');
            expect(transform.removeIpZoneId('2001:DB8::1')).toBe('2001:DB8::1');
        });
    });

    describe('replace should', () => {
        it('find and replace values in string', () => {
            expect(transform.replace('this-is-a-string', { searchValue: '-', replaceValue: ' ' })).toBe('this is-a-string');
            expect(transform.replace('this-is-a-string', { searchValue: '-', replaceValue: ' ', global: true })).toBe('this is a string');
            expect(transform.replace('this-is-a-string', { searchValue: 'can', replaceValue: ' ' })).toBe('this-is-a-string');
            expect(transform.replace('this*is*a*string', { searchValue: '\\*', replaceValue: '.', global: true })).toBe('this.is.a.string');
            expect(transform.replace('this CAN be a string', { searchValue: 'can ', replaceValue: '', global: true, ignoreCase: true })).toBe('this be a string');
        });
    });

    describe('toUnixTime should', () => {
        it('convert date iso strings and date objects to unix time', () => { 
            const testDate = new Date();
            const unixTime = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(transform.toUnixTime(testDate)).toBe(unixTime);
            expect(transform.toUnixTime(isoTime)).toBe(unixTime);
            expect(transform.toUnixTime(unixTime)).toBe(unixTime);
        });

        it('convert date time in seconds to unix time', () => {
            expect(transform.toUnixTime(1580418907)).toBe(1580418907000);
            expect(transform.toUnixTime('1580418907')).toBe(1580418907000);
        });

        it('convert string dates to unix time', () => {
            expect(transform.toUnixTime('2020-01-01')).toBe(1577836800000);
            expect(transform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800000);
            expect(transform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800000);
        });

        it('invalid dates will throw errors', () => {
            try {
                transform.toUnixTime('notADate'); 
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time')
            }
        });
    });

    describe('formatPhoneNumber should', () => {
        it('return phone number without dashes, spaces, or +', () => {
            expect(transform.phoneNumber('4917600000000')).toBe('4917600000000');
            expect(transform.phoneNumber('    1 (555) 555 2311     ')).toBe('15555552311');
            expect(transform.phoneNumber('+33-1-22-33-44-55')).toBe('33122334455');
            // second 1 is not returned
            expect(transform.phoneNumber('+11 7 812 222 2323')).toBe('178122222323');
            expect(transform.phoneNumber('1.555.555.2311')).toBe('15555552311');
            expect(transform.phoneNumber('1234')).toBe('1234');
            expect(transform.phoneNumber('86 591 83123456')).toBe('8659183123456');
            // the leading 0 in the second group is removed
            expect(transform.phoneNumber('33 08 54 23 12 00')).toBe('33854231200');
            // same 0 is removed but without the international formating
            expect(transform.phoneNumber('+330854231200')).toBe('33854231200');
            expect(transform.phoneNumber('49 116 4331 12348')).toBe('49116433112348');
            expect(transform.phoneNumber('1(800)FloWErs')).toBe('18003569377');
            expect(transform.phoneNumber('86 598 13411-859395')).toBe('8659813411859395');
            expect(transform.phoneNumber('467*(070)1.23[45]/67')).toBe('4670701234567');
        });

        it('throw an error when it can not determine the phone number', () => {
            try { transform.phoneNumber('34'); }
            catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try { transform.phoneNumber('notAphoneNumber'); }
            catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try { transform.phoneNumber('n/a'); }
            catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }

            try { transform.phoneNumber('+467+070+123+4567'); }
            catch (e) { expect(e.message).toBe('Could not determine the incoming phone number'); }
        });
    });

    describe('toUUID should', () => {
        it('return a valid UUID', () => {
            expect(transform.toUUID('95ecc380-afe9-11e4-9b6c-751b66dd541e')).toBe('95ecc380-afe9-11e4-9b6c-751b66dd541e');
            expect(transform.toUUID('95ecc380afe911e49b6c751b66dd541e')).toBe('95ecc380-afe9-11e4-9b6c-751b66dd541e');
            expect(transform.toUUID('95ecc380afe911e49B6C751B66DD541E')).toBe('95ecc380-afe9-11e4-9B6C-751B66DD541E');
        });

        it('return lowercased UUID if specified', () => {
            expect(transform.toUUID('95ecc380afe911e49B6C751B66DD541E', { lowercase: true })).toBe('95ecc380-afe9-11e4-9b6c-751b66dd541e');
        });

        it('thow an error for a bad UUID', () => {
            try { 
                expect(transform.toUUID('95ecc49B6C751B66DD541E', { lowercase: true })).toBe(false);
            } catch (e) {
                expect(e.message).toBe('Cannot create a valid UUID number');
            }

            try {
                expect(transform.toUUID('95ecc380afe911e49B6C751B66DD541Z', { lowercase: true })).toBe(false);
            } catch (e) {
                expect(e.message).toBe('Cannot create a valid UUID number');
            }

            try {
                expect(transform.toUUID('95XXX380afe911eW9B6C751B66DD541A', { lowercase: true })).toBe(false);
            } catch (e) {
                expect(e.message).toBe('Cannot create a valid UUID number');
            }
        });
    });
});
