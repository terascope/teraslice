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

    fdescribe('toUnixTime should', () => {
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

        fit('invalid dates will throw errors', () => {
            try {
                transform.toUnixTime('notADate'); 
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time')
            }
        });
    });
});
