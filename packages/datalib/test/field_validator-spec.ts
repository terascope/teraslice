import * as valid from '../src/validations/field-validator';

describe('field validators', () => {
    describe('validValue should', () => {
        it('validate against null and undefined', () => {
            expect(valid.validValue(undefined)).toBe(false);
            expect(valid.validValue(null)).toBe(false);
            expect(valid.validValue(false)).toBe(true);
            expect(valid.validValue(324324)).toBe(true);
            expect(valid.validValue('bob')).toBe(true);
        });

        it('validate using options.invalidValues', () => {
            const options = {
                invalidValues: ['', 'n/a', 'NA', 12345]
            };
            expect(valid.validValue('bob', options)).toBe(true);
            expect(valid.validValue(true, options)).toBe(true);
            expect(valid.validValue('', options)).toBe(false);
            expect(valid.validValue('n/a', options)).toBe(false);
            expect(valid.validValue('NA', options)).toBe(false);
            expect(valid.validValue(12345, options)).toBe(false);
        });
    });

    describe('isInteger should', () => {
        it('validate ints', () => {
            expect(valid.isInteger(3)).toBe(true);
            expect(valid.isInteger('3')).toBe(true);
            expect(valid.isInteger('0003433')).toBe(true);
            expect(valid.isInteger('-12321')).toBe(true);
            expect(valid.isInteger(0)).toBe(true);

            expect(valid.isInteger(3.14159)).toBe(false);
            expect(valid.isInteger('3.14159')).toBe(false);
            expect(valid.isInteger(true)).toBe(false);
            expect(valid.isInteger(['1232', 343])).toBe(false);
            expect(valid.isInteger(undefined)).toBe(false);
            expect(valid.isInteger('bob')).toBe(false);
        });

        it('validate ints with a options', () => {
            expect(valid.isInteger('3', { min: 0, max: 100 })).toBe(true);
            expect(valid.isInteger(1032, { min: 100 })).toBe(true);
            expect(valid.isInteger('12', { max: 100 })).toBe(true);
            expect(valid.isInteger('-1343', { min: 0, max: 100 })).toBe(false);
            expect(valid.isInteger('bob', { min: 0, max: 100 })).toBe(false);
            expect(valid.isInteger(undefined, { min: 0, max: 100 })).toBe(false);
            expect(valid.isInteger(true, { min: 0 })).toBe(false);
            expect(valid.isInteger(1032, { max: 100 })).toBe(false);
        });
    });

    describe('isTimestamp should', () => {
        it('validate timestamps', () => {
             // iso8601 string dates
            expect(valid.isTimestamp('2019-03-07T23:08:59.673Z')).toBe(true);
            expect(valid.isTimestamp('2019-03-07')).toBe(true);
            expect(valid.isTimestamp('2019-03-07T23:08:59')).toBe(true);

            // different string date formats
            expect(valid.isTimestamp('03/07/2019')).toBe(true);
            expect(valid.isTimestamp('03-07-2019')).toBe(true);
            expect(valid.isTimestamp('Jan 12, 2012')).toBe(true);
            expect(valid.isTimestamp('23 Jan 2012')).toBe(true);
            expect(valid.isTimestamp('12.03.2012')).toBe(true);

            // timestamp will milliseconds
            expect(valid.isTimestamp('1552000139673')).toBe(true);

            // timestamp with seconds
            expect(valid.isTimestamp('1552000139')).toBe(true);

            // date object
            expect(valid.isTimestamp(new Date())).toBe(true);

            // bad dates
            expect(valid.isTimestamp('2020-23-09')).toBe(false);
            expect(valid.isTimestamp('21.03.2012')).toBe(false); 
            expect(valid.isTimestamp('21/01/2019')).toBe(false);           
            expect(valid.isTimestamp('123432as;ldkfjasoej293432423')).toBe(false);
            expect(valid.isTimestamp('1552000        139673')).toBe(false);
            expect(valid.isTimestamp('unknown')).toBe(false);
            expect(valid.isTimestamp('1')).toBe(false);
            expect(valid.isTimestamp('undefined')).toBe(false);
            expect(valid.isTimestamp(0)).toBe(false);
            expect(valid.isTimestamp('baddate')).toBe(false);
            expect(valid.isTimestamp(null)).toBe(false);
            expect(valid.isTimestamp(undefined)).toBe(false);
            expect(valid.isTimestamp(true)).toBe(false);
            expect(valid.isTimestamp(false)).toBe(false);
            expect(valid.isTimestamp('')).toBe(false);
            expect(valid.isTimestamp('    ')).toBe(false);
            // 9 digits
            expect(valid.isTimestamp('155200013')).toBe(false);
            // 14 digits
            expect(valid.isTimestamp('15520001333212')).toBe(false);
        });
    });

    describe('isPublicIp should', () => {
        it('check if an ip is public', () => {
            // private ips
            expect(valid.isPublicIp('192.168.0.1')).toBe(false);
            expect(valid.isPublicIp('fc00:db8::1')).toBe(false);

            // public ips
            expect(valid.isPublicIp('8.8.8.8')).toBe(true);
            expect(valid.isPublicIp('2001:db8::1')).toBe(true);
            expect(valid.isPublicIp('172.194.0.1')).toBe(true);

            // bad ip address
            expect(valid.isPublicIp('badIpaddress')).toBe(false);
        });

        it('check if an ip is prive based on options', () => {
            // private ips
            expect(valid.isPublicIp('192.168.0.1', { private: true })).toBe(true);
            expect(valid.isPublicIp('fc00:db8::1', { private: true })).toBe(true);

            // public ips
            expect(valid.isPublicIp('8.8.8.8', { private: true })).toBe(false);
            expect(valid.isPublicIp('2001:db8::1', { private: true })).toBe(false);
            expect(valid.isPublicIp('172.194.0.1', { private: true })).toBe(false);

            // bad ip address
            expect(valid.isPublicIp('badIpaddress', { private: true })).toBe(false);
        });
    });
});
