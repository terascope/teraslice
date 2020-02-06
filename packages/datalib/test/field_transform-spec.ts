import * as transform from '../src/transforms/field-transform';

describe('field transforms', () => {
    describe('toBoolean should', () => {
        it('return true for truthy values', () => {
            [32, '1', 'string', true, [], {}, Infinity, new Date(), -87]
                .forEach((v) => expect(transform.toBoolean(v)).toBe(true));
        });

        it('return false for falsy values', () => {
            [0, false, undefined, null, NaN, '', "", ``]
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
                expect(e.message).toBe('Invalid size paramter for truncate')
            }
        });
    });

    describe('normalize mac address should', () => {
        it('return the mac address with no changes', () => {
            expect(transform.normalizeMacAddress('00:1f:f3:5b:2b:1f')).toBe('00:1f:f3:5b:2b:1f');
            expect(transform.normalizeMacAddress('00-1f-f3-5b-2b-1f')).toBe('00-1f-f3-5b-2b-1f');
            expect(transform.normalizeMacAddress('001f.f35b.2b1f')).toBe('001f.f35b.2b1f');
            expect(transform.normalizeMacAddress('001ff35b2b1f')).toBe('001ff35b2b1f');
        });

        it('return the mac address with proper casing', () => {
            expect(transform.normalizeMacAddress('00 1f f3 5b 2b 1f', { casing: 'uppercase' })).toBe('00 1F F3 5B 2B 1F');
            expect(transform.normalizeMacAddress('00-1f-3f-5b-2b-1f', { casing: 'uppercase' })).toBe('00-1F-3F-5B-2B-1F');
            expect(transform.normalizeMacAddress('001F.F35B.2B1F', { casing: 'lowercase' })).toBe('001f.f35b.2b1f');
            expect(transform.normalizeMacAddress('001Ff35B2b1F', { casing: 'lowercase' })).toBe('001ff35b2b1f');
            expect(transform.normalizeMacAddress('001Ff35B2b1F', { casing: 'uppercase' })).toBe('001FF35B2B1F');
        });

        it('return the mac address and strip the delimiter', () => {
            expect(transform.normalizeMacAddress('00 1f f3 5b 2b 1f', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
            expect(transform.normalizeMacAddress('00-1f-3f-5b-2b-1f', { casing: 'uppercase', removeGroups: true })).toBe('001F3F5B2B1F');
            expect(transform.normalizeMacAddress('001F.F35B.2B1F', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
            expect(transform.normalizeMacAddress('00:1f:f3:5b:2b:1f', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
        });

        it('return the mac address and remove group delimiter', () => {
            expect(transform.normalizeMacAddress('00 1f f3 5b 2b 1f', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
            expect(transform.normalizeMacAddress('00-1f-3f-5b-2b-1f', { casing: 'uppercase', removeGroups: true })).toBe('001F3F5B2B1F');
            expect(transform.normalizeMacAddress('001F.F35B.2B1F', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
            expect(transform.normalizeMacAddress('00:1f:f3:5b:2b:1f', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
        });

        it('throw an error if an invalid mac address', () => {
            try {
                expect(transform.normalizeMacAddress('thisisabadmacaddress', { casing: 'lowercase', removeGroups: true })).toBe('001ff35b2b1f');
            } catch (e) {
                expect(e.message).toBe('Not a valid mac address')
            }

            try {
                expect(transform.normalizeMacAddress(true)).toBe('001ff35b2b1f');
            } catch (e) {
                expect(e.message).toBe('Not a valid mac address')
            }

            try {
                expect(transform.normalizeMacAddress(23423432)).toBe('001ff35b2b1f');
            } catch (e) {
                expect(e.message).toBe('Not a valid mac address')
            }
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
            try { expect(transform.toNumber('bobsyouruncle')).toBe(12321); }
            catch(e) { expect(e.message).toBe('could not convert to a number'); }

            try { expect(transform.toNumber({})).toBe(12321); }
            catch(e) { expect(e.message).toBe('could not convert to a number'); }

            try { expect(transform.toNumber(undefined)).toBe(12321); }
            catch(e) { expect(e.message).toBe('could not convert to a number'); }
        });
    });

    describe('removeIpZoneId should', () => {
        it('remove zone id and return ip address', () => {
            expect(transform.removeIpZoneId('8.8.8.8')).toBe('8.8.8.8');
            expect(transform.removeIpZoneId('172.35.12.18')).toBe('172.35.12.18');
            expect(transform.removeIpZoneId('2001:db8::1')).toBe('2001:db8::1');
            expect(transform.removeIpZoneId('fe80::1ff:fe23:4567:890a%eth2')).toBe('fe80::1ff:fe23:4567:890a');
            expect(transform.removeIpZoneId('2001:DB8::1')).toBe('2001:DB8::1');
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
            expect(transform.replaceRegex('soMesTring', { regex: 'm|t', replace: 'W', global: true, ignore_case: true })).toBe('soWesWring');
            expect(transform.replaceRegex('a***a***a', { regex: '\\*', replace: '', global: true })).toBe('aaa');
        });
    });

    fdescribe('toUnixTime should', () => {
        it('convert date iso strings and date objects to unix time', () => {
            const testDate = new Date();
            const milli = testDate.getTime();
            const isoTime = testDate.toISOString();

            expect(transform.toUnixTime(testDate)).toBe(Math.floor(milli/1000));
            expect(transform.toUnixTime(isoTime)).toBe(Math.floor(milli/1000));
            expect(transform.toUnixTime(milli)).toBe(Math.floor(milli/1000));
        });

        it('convert date time in milliseconds to unix time', () => {
            expect(transform.toUnixTime(1580418907000)).toBe(1580418907);
            expect(transform.toUnixTime('1580418907000')).toBe(1580418907);
        });

        it('convert string dates to unix time', () => {
            expect(transform.toUnixTime('2020-01-01')).toBe(1577836800);
            expect(transform.toUnixTime('Jan 1, 2020 UTC')).toBe(1577836800);
            expect(transform.toUnixTime('2020 Jan, 1 UTC')).toBe(1577836800);
        });

        it('invalid dates will throw errors', () => {
            try {
                expect(transform.toUnixTime('notADate')).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time');
            }

            try {
                expect(transform.toUnixTime(true)).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time');
            }

            try {
                expect(transform.toUnixTime(undefined)).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time');
            }

            try {
                expect(transform.toUnixTime({})).toBe(1577836800);
            } catch (e) {
                expect(e.message).toBe('Not a valid date, cannot transform to unix time');
            }
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
            expect(transform.toISO8601(1580418907)).toBe('2020-01-30T21:15:07.000Z');
            expect(transform.toISO8601('1580418907')).toBe('2020-01-30T21:15:07.000Z');
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
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }

            try {
                transform.toISDN('notAphoneNumber');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }

            try {
                transform.toISDN('n/a');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }

            try {
                transform.toISDN('+467+070+123+4567');
            } catch (e) {
                expect(e.message).toBe('Could not determine the incoming phone number');
            }
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
