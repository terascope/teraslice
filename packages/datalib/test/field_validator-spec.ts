import { FieldValidator } from '../src/validations';
import * as i from '../src/interfaces';

const multiPolygon: i.GeoShapeMultiPolygon = {
    type: i.GeoShapeType.MultiPolygon,
    coordinates: [
        [
            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
        ],
        [
            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
        ]
    ]
};

const polygon: i.GeoShapePolygon = {
    type: i.GeoShapeType.Polygon,
    coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
    ]
};

const polygonWithHoles: i.GeoShapePolygon = {
    type: i.GeoShapeType.Polygon,
    coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
    ]
};

const matchingPoint: i.GeoShapePoint = {
    type: i.GeoShapeType.Point,
    coordinates: [12, 12]
};

describe('field validators', () => {
    describe('isNumber should', () => {
        it('return true for a valid number', () => {
            expect(FieldValidator.isNumber(1)).toBe(true);
            expect(FieldValidator.isNumber(-11232)).toBe(true);
            expect(FieldValidator.isNumber(0o32)).toBe(true);
            expect(FieldValidator.isNumber(17.343)).toBe(true);
            expect(FieldValidator.isNumber(Infinity)).toBe(true);
        });

        it('return false for not a number', () => {
            expect(FieldValidator.isNumber('1')).toBe(false);
            expect(FieldValidator.isNumber(true)).toBe(false);
            expect(FieldValidator.isNumber({})).toBe(false);
            expect(FieldValidator.isNumber([])).toBe(false);
            expect(FieldValidator.isNumber(null)).toBe(false);
            expect(FieldValidator.isNumber(undefined)).toBe(false);
            expect(FieldValidator.isNumber('astring')).toBe(false);
        })

        it('validate a number string if args set', () => {
            expect(FieldValidator.isNumber('1', { coerceStrings: true })).toBe(true);
            expect(FieldValidator.isNumber('-11343.343', { coerceStrings: true })).toBe(true);
            expect(FieldValidator.isNumber('0034598348554784', { coerceStrings: true })).toBe(true);
        })

        it('validate an int if args set', () => {
            expect(FieldValidator.isNumber(10, { integer: true })).toBe(true);
            expect(FieldValidator.isNumber('1', { integer: true })).toBe(false);
            expect(FieldValidator.isNumber(true, { integer: true })).toBe(false);
            expect(FieldValidator.isNumber('-11343.343', { coerceStrings: true, integer: true })).toBe(false);
            expect(FieldValidator.isNumber('0034598348554784', { coerceStrings: true, integer: true })).toBe(true);
        })

        it('validate if num in a range and args set', () => {
            expect(FieldValidator.isNumber('1', { coerceStrings: true, min: -10, max: 5 })).toBe(true);
            expect(FieldValidator.isNumber(1232, { coerceStrings: true, min: -10, max: 5 })).toBe(false);
            expect(FieldValidator.isNumber(11343.343, { min: 10 })).toBe(true);
            expect(FieldValidator.isNumber(11343.343, { min: 10, integer: true })).toBe(false);
        })
    });

    describe('inRange should', () => {
        it('return true if number in range', () => {
            expect(FieldValidator.inRange(44, { min: 0, max: 45 })).toBe(true);
            expect(FieldValidator.inRange(-12, { min: -100, max: 45 })).toBe(true);
            expect(FieldValidator.inRange(0, { max: 45 })).toBe(true);
            expect(FieldValidator.inRange(0, { min: -45 })).toBe(true);
        });

        it('return false if number out of range', () => {
            expect(FieldValidator.inRange(44, { min: 0, max: 25 })).toBe(false);
            expect(FieldValidator.inRange(-12, { min: -10, max: 45 })).toBe(false);
            expect(FieldValidator.inRange(0, { max: -45 })).toBe(false);
            expect(FieldValidator.inRange(0, { min: 45 })).toBe(false);
        });

        it('throw error if not a min and a max', () => {
            try { expect(FieldValidator.inRange(44, {})).toBe(true); }
            catch (e) { expect(e.message).toBe('Options must contain min or max'); }
        });
    });

    describe('isIp should', () => {
        it('return true for valid ips', () => {
            expect(FieldValidator.isIp('8.8.8.8')).toBe(true);
            expect(FieldValidator.isIp('192.172.1.18')).toBe(true);
            expect(FieldValidator.isIp('11.0.1.18')).toBe(true);
            expect(FieldValidator.isIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
            expect(FieldValidator.isIp('fe80::1ff:fe23:4567:890a%eth2')).toBe(true);
            expect(FieldValidator.isIp('2001:DB8::1')).toBe(true);
            expect(FieldValidator.isIp('172.16.0.1')).toBe(true);
            expect(FieldValidator.isIp('10.168.0.1')).toBe(true);
            expect(FieldValidator.isIp('fc00:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
        });

        it('return true for private or public ips if specified', () => {
            expect(FieldValidator.isIp('8.8.8.8', { public: true })).toBe(true);
            expect(FieldValidator.isIp('192.172.1.18', { public: false })).toBe(false);
            expect(FieldValidator.isIp('2001:db8:85a3:8d3:1319:8a2e:370:7348', { public: true })).toBe(true);
            expect(FieldValidator.isIp('fe80::1ff:fe23:4567:890a%eth2', { public: false })).toBe(false);

            expect(FieldValidator.isIp('172.16.0.1', { public: true })).toBe(false);
            expect(FieldValidator.isIp('10.168.0.1', { public: false })).toBe(true);
            expect(FieldValidator.isIp('fc00:db8:85a3:8d3:1319:8a2e:370:7348', { public: false })).toBe(true);
            expect(FieldValidator.isIp('fc00:db8::1', { public: true })).toBe(false);
        });

        it('return false for invalid ip addresses', () => {
            expect(FieldValidator.isIp('NA')).toBe(false);
            expect(FieldValidator.isIp('')).toBe(false);
            expect(FieldValidator.isIp('172.394.0.1')).toBe(false);
            expect(FieldValidator.isIp(undefined)).toBe(false);
            expect(FieldValidator.isIp('ZXXY:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(false);
            expect(FieldValidator.isIp('::192.168.1.18')).toBe(false);
            expect(FieldValidator.isIp('11.222.33.001')).toBe(false);
            expect(FieldValidator.isIp('87')).toBe(false);
            expect(FieldValidator.isIp('02751178')).toBe(false);
            expect(FieldValidator.isIp(true)).toBe(false);
            expect(FieldValidator.isIp({})).toBe(false);
            expect(FieldValidator.isIp([])).toBe(false);
            expect(FieldValidator.isIp(123456678)).toBe(false);
            expect(FieldValidator.isIp(12.4345)).toBe(false);
        });
    });

    describe('isPublicIp should', () => {
        it('check if an ip is public', () => {
            // private ips
            expect(FieldValidator.isPublicIp('192.168.0.1')).toBe(false);
            expect(FieldValidator.isPublicIp('fc00:db8::1')).toBe(false);

            // public ips
            expect(FieldValidator.isPublicIp('8.8.8.8')).toBe(true);
            expect(FieldValidator.isPublicIp('2001:db8::1')).toBe(true);
            expect(FieldValidator.isPublicIp('172.194.0.1')).toBe(true);

            // bad ip address
            expect(FieldValidator.isPublicIp('badIpaddress')).toBe(false);
        });

        it('check if an ip is prive based on options', () => {
            // private ips
            expect(FieldValidator.isPublicIp('192.168.0.1', { private: true })).toBe(true);
            expect(FieldValidator.isPublicIp('fc00:db8::1', { private: true })).toBe(true);

            // public ips
            expect(FieldValidator.isPublicIp('8.8.8.8', { private: true })).toBe(false);
            expect(FieldValidator.isPublicIp('2001:db8::1', { private: true })).toBe(false);
            expect(FieldValidator.isPublicIp('172.194.0.1', { private: true })).toBe(false);

            // bad ip address
            expect(FieldValidator.isPublicIp('badIpaddress', { private: true })).toBe(false);
        });
    });

    describe('isIpCidr should', () => {
        it('return true for valid ips with cidr notation', () => {
            expect(FieldValidator.isIpCidr('1.2.3.4/32')).toBe(true);
            expect(FieldValidator.isIpCidr('8.8.0.0/12')).toBe(true);
            expect(FieldValidator.isIpCidr('2001:0db8:0123:4567:89ab:cdef:1234:5678/128')).toBe(true);
            expect(FieldValidator.isIpCidr('2001::1234:5678/128')).toBe(true);
        });

        it('return false for invalid ips with cidr notation', () => {
            expect(FieldValidator.isIpCidr('1.2.3.4/128')).toBe(false);
            expect(FieldValidator.isIpCidr('notanipaddress/12')).toBe(false);
            expect(FieldValidator.isIpCidr('2001:0db8:0123:4567:89ab:cdef:1234:5678/412')).toBe(false);
            expect(FieldValidator.isIpCidr('2001::1234:5678/b')).toBe(false);
            expect(FieldValidator.isIpCidr('8.8.8.10')).toBe(false);
            expect(FieldValidator.isIpCidr(true)).toBe(false);
            expect(FieldValidator.isIpCidr({})).toBe(false);
        });
    });

    fdescribe('inIpRange should', () => {
        it('return true for ip addresses in a given range using cidr notation', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { cidr: '8.8.8.0/24'})).toBe(true);
            // expect(FieldValidator.inIpRange('8.8.8.8/32', { cidr: '8.8.8.0/24'})).toBe(true);
            expect(FieldValidator.inIpRange('2001:0db8:0123:4567:89ab:cdef:1234:5678', { cidr: '2001:0db8:0123:4567:89ab:cdef:1234:0/112'})).toBe(true);
        });

        it('return true for valid ips in a range with max and min', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.0', max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.8', { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.0', { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIpRange('8.8.8.64', { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::123', max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::b000', max: 'fd00::ea00' })).toBe(true)
        });

        it('return false for ips out of the ranges, cidr notation defined range', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { cidr: '8.8.8.10/32'})).toBe(false);
            expect(FieldValidator.inIpRange('1.2.3.4', { cidr: '8.8.2.0/24'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { cidr: '8.8.2.0/24'})).toBe(false);
            expect(FieldValidator.inIpRange('badIpAddress', { cidr: '8.8.2.0/24'})).toBe(false);
            expect(FieldValidator.inIpRange('8.8.1.12', { cidr: '8.8.2.0/23'})).toBe(false);
            expect(FieldValidator.inIpRange('8.8.1.12', { cidr: 'badCidr'})).toBe(false);
        });

        it('return false for ips out of range, min and max defined range', () => {
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.102', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('badIpAddress', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: 'badIpAddress', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.24', max: 'badIpAddress' })).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: 'fd00::b000', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: '8.8.8.0', max: 'fd00::b000' })).toBe(false);
            expect(FieldValidator.inIpRange('8.8.8.8', { min: 'fd00::a000', max: 'fd00::b000' })).toBe(false);

            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::c000', max: 'fd00::f000'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::f000', max: 'fd00::1000'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: '8.8.8.24', max: 'fd00::b000'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::a000', max: '8.8.8.24'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: '8.8.8.0', max: '8.8.8.24'})).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { max: 'fd00::1000' })).toBe(false);
            expect(FieldValidator.inIpRange('fd00::b000', { min: 'fd00::f000' })).toBe(false);
        });
    });

    describe('isMacAddress should', () => {
        it('return true for a valid mac address', () => {
            expect(FieldValidator.isMacAddress('00:1f:f3:5b:2b:1f')).toBe(true);
            expect(FieldValidator.isMacAddress('00-1f-f3-5b-2b-1f')).toBe(true);
            expect(FieldValidator.isMacAddress('001f.f35b.2b1f')).toBe(true);
            expect(FieldValidator.isMacAddress('00 1f f3 5b 2b 1f')).toBe(true);
            expect(FieldValidator.isMacAddress('001ff35b2b1f')).toBe(true);
        });

        it('return false for a invalid mac address', () => {
            expect(FieldValidator.isMacAddress('00:1:f:5b:2b:1f')).toBe(false);
            expect(FieldValidator.isMacAddress('00-1Z-fG-5b-2b-1322f')).toBe(false);
            expect(FieldValidator.isMacAddress('23423423')).toBe(false);
            expect(FieldValidator.isMacAddress('00_1Z_fG_5b_2b_13')).toBe(false);
        });
    });

    describe('validValue', () => {
        it('should validate against null and undefined', () => {
            expect(FieldValidator.validValue(undefined)).toBe(false);
            expect(FieldValidator.validValue(null)).toBe(false);
            expect(FieldValidator.validValue(false)).toBe(true);
            expect(FieldValidator.validValue(324324)).toBe(true);
            expect(FieldValidator.validValue('bob')).toBe(true);
        });

        it('should validate using options.invalidValues', () => {
            const options = {
                invalidValues: ['', 'n/a', 'NA', 12345]
            };
            expect(FieldValidator.validValue('bob', options)).toBe(true);
            expect(FieldValidator.validValue(true, options)).toBe(true);
            expect(FieldValidator.validValue('', options)).toBe(false);
            expect(FieldValidator.validValue('n/a', options)).toBe(false);
            expect(FieldValidator.validValue('NA', options)).toBe(false);
            expect(FieldValidator.validValue(12345, options)).toBe(false);
        });
    });

    describe('isTimestamp should', () => {
        it('validate timestamps', () => {
            // iso8601 string dates
            expect(FieldValidator.isTimestamp('2019-03-07T23:08:59.673Z')).toBe(true);
            expect(FieldValidator.isTimestamp('2019-03-07')).toBe(true);
            expect(FieldValidator.isTimestamp('2019-03-07T23:08:59')).toBe(true);

            // different string date formats
            expect(FieldValidator.isTimestamp('03/07/2019')).toBe(true);
            expect(FieldValidator.isTimestamp('03-07-2019')).toBe(true);
            expect(FieldValidator.isTimestamp('Jan 12, 2012')).toBe(true);
            expect(FieldValidator.isTimestamp('23 Jan 2012')).toBe(true);
            expect(FieldValidator.isTimestamp('12.03.2012')).toBe(true);

            // millisecond and second timestamps
            expect(FieldValidator.isTimestamp('1552000139673')).toBe(true);
            expect(FieldValidator.isTimestamp('1552000139')).toBe(true);

            // date object
            expect(FieldValidator.isTimestamp(new Date())).toBe(true);

            // bad dates
            expect(FieldValidator.isTimestamp('2020-23-09')).toBe(false);
            expect(FieldValidator.isTimestamp('21.03.2012')).toBe(false);
            expect(FieldValidator.isTimestamp('21/01/2019')).toBe(false);
            expect(FieldValidator.isTimestamp('123432as;ldkfjasoej293432423')).toBe(false);
            expect(FieldValidator.isTimestamp('1552000        139673')).toBe(false);
            expect(FieldValidator.isTimestamp('unknown')).toBe(false);
            expect(FieldValidator.isTimestamp('1')).toBe(false);
            expect(FieldValidator.isTimestamp('undefined')).toBe(false);
            expect(FieldValidator.isTimestamp(0)).toBe(false);
            expect(FieldValidator.isTimestamp('baddate')).toBe(false);
            expect(FieldValidator.isTimestamp(null)).toBe(false);
            expect(FieldValidator.isTimestamp(undefined)).toBe(false);
            expect(FieldValidator.isTimestamp(true)).toBe(false);
            expect(FieldValidator.isTimestamp(false)).toBe(false);
            expect(FieldValidator.isTimestamp('')).toBe(false);
            expect(FieldValidator.isTimestamp('    ')).toBe(false);
            // 9 digits
            expect(FieldValidator.isTimestamp('155200013')).toBe(false);
            // 14 digits
            expect(FieldValidator.isTimestamp('15520001333212')).toBe(false);
        });
    });

    describe('isBoolean', () => {
        it('should check if a value is a boolean', () => {
            // @ts-ignore
            expect(FieldValidator.isBoolean()).toEqual(false);
            expect(FieldValidator.isBoolean(['asdf'])).toEqual(false);
            expect(FieldValidator.isBoolean({ one: 1 })).toEqual(false);
            expect(FieldValidator.isBoolean(3)).toEqual(false);
            expect(FieldValidator.isBoolean('hello')).toEqual(false);

            expect(FieldValidator.isBoolean(true)).toEqual(true);
            expect(FieldValidator.isBoolean(false)).toEqual(true);
        });
    });

    describe('isBooleanLike', () => {
        it('should check if a value is programatically a boolean', () => {
            expect(FieldValidator.isBooleanLike(['asdf'])).toEqual(false);
            expect(FieldValidator.isBooleanLike({ one: 1 })).toEqual(false);
            expect(FieldValidator.isBooleanLike(3)).toEqual(false);
            expect(FieldValidator.isBooleanLike('hello')).toEqual(false);

            expect(FieldValidator.isBooleanLike(true)).toEqual(true);
            expect(FieldValidator.isBooleanLike(false)).toEqual(true);
            // @ts-ignore
            expect(FieldValidator.isBooleanLike()).toEqual(true);
            expect(FieldValidator.isBooleanLike(null)).toEqual(true);
            expect(FieldValidator.isBooleanLike(0)).toEqual(true);
            expect(FieldValidator.isBooleanLike('0')).toEqual(true);
            expect(FieldValidator.isBooleanLike('false')).toEqual(true);
            expect(FieldValidator.isBooleanLike('no')).toEqual(true);

            expect(FieldValidator.isBooleanLike(1)).toEqual(true);
            expect(FieldValidator.isBooleanLike('1')).toEqual(true);
            expect(FieldValidator.isBooleanLike('true')).toEqual(true);
            expect(FieldValidator.isBooleanLike('yes')).toEqual(true);
        });
    });

    describe('isEmail', () => {
        it('should check if a value is an email', () => {
            // @ts-ignore
            expect(FieldValidator.isEmail()).toEqual(false);
            expect(FieldValidator.isEmail(['asdf'])).toEqual(false);
            expect(FieldValidator.isEmail({ one: 1 })).toEqual(false);
            expect(FieldValidator.isEmail(3)).toEqual(false);
            expect(FieldValidator.isEmail('hello')).toEqual(false);

            const list = [
                'ha3ke5@pawnage.com',
                'ha3ke5@pawnage.com',
                'user@blah@blah.com',
                'junk user@blah.com',
                'user@blah.com/junk.morejunk',
                'user@blah.com&value=junk',
                'user@blah.com/junk.junk?a=<tag value="junk"'
            ];

            const results = list.map(FieldValidator.isEmail);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        it('should check if a value is GeoJSON', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoJSON()).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const list = [
                matchingPoint,
                polygon,
                polygonWithHoles,
                multiPolygon
            ];

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isGeoShapePoint', () => {
        it('should check if a value is GeoShapePoint', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint()).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint(['asdf'])).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint({ one: 1 })).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint(3)).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePoint('hello')).toEqual(false);

            expect(FieldValidator.isGeoShapePoint(matchingPoint)).toEqual(true);
            expect(FieldValidator.isGeoShapePoint(polygon)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(polygonWithHoles)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(multiPolygon)).toEqual(false);
        });
    });

    describe('isGeoShapePolygon', () => {
        it('should check if a value is GeoShapePolygon', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon()).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon(['asdf'])).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon({ one: 1 })).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon(3)).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapePolygon('hello')).toEqual(false);

            expect(FieldValidator.isGeoShapePolygon(matchingPoint)).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon(polygon)).toEqual(true);
            expect(FieldValidator.isGeoShapePolygon(polygonWithHoles)).toEqual(true);
            expect(FieldValidator.isGeoShapePolygon(multiPolygon)).toEqual(false);
        });
    });

    describe('isGeoShapeMultiPolygon', () => {
        it('should check if a value is GeoShapeMultiPolygon', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon()).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon(['asdf'])).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon({ one: 1 })).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon(3)).toEqual(false);
            // @ts-ignore
            expect(FieldValidator.isGeoShapeMultiPolygon('hello')).toEqual(false);

            expect(FieldValidator.isGeoShapeMultiPolygon(matchingPoint)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(polygon)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(polygonWithHoles)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(multiPolygon)).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        it('should check if a value is GeoJSON', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoJSON()).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const list = [
                matchingPoint,
                polygon,
                polygonWithHoles,
                multiPolygon
            ];

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        it('should check if a value is GeoJSON', () => {
            // @ts-ignore
            expect(FieldValidator.isGeoJSON()).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const list = [
                matchingPoint,
                polygon,
                polygonWithHoles,
                multiPolygon
            ];

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });
    });
});
