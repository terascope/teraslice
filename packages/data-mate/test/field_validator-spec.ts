import * as i from '@terascope/types';
import { FieldValidator } from '../src/validations';

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

    describe('isIp should', () => {
        it('return true for valid ips', () => {
            expect(FieldValidator.isIP('8.8.8.8')).toBe(true);
            expect(FieldValidator.isIP('192.172.1.18')).toBe(true);
            expect(FieldValidator.isIP('11.0.1.18')).toBe(true);
            expect(FieldValidator.isIP('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
            expect(FieldValidator.isIP('fe80::1ff:fe23:4567:890a%eth2')).toBe(true);
            expect(FieldValidator.isIP('2001:DB8::1')).toBe(true);
            expect(FieldValidator.isIP('172.16.0.1')).toBe(true);
            expect(FieldValidator.isIP('10.168.0.1')).toBe(true);
            expect(FieldValidator.isIP('fc00:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(true);
        });

        it('return false for invalid ip addresses', () => {
            expect(FieldValidator.isIP('NA')).toBe(false);
            expect(FieldValidator.isIP('')).toBe(false);
            expect(FieldValidator.isIP('172.394.0.1')).toBe(false);
            expect(FieldValidator.isIP(undefined)).toBe(false);
            expect(FieldValidator.isIP('ZXXY:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(false);
            expect(FieldValidator.isIP('::192.168.1.18')).toBe(false);
            expect(FieldValidator.isIP('11.222.33.001')).toBe(false);
            expect(FieldValidator.isIP('87')).toBe(false);
            expect(FieldValidator.isIP('02751178')).toBe(false);
            expect(FieldValidator.isIP(true)).toBe(false);
            expect(FieldValidator.isIP({})).toBe(false);
            expect(FieldValidator.isIP([])).toBe(false);
            expect(FieldValidator.isIP(123456678)).toBe(false);
            expect(FieldValidator.isIP(12.4345)).toBe(false);
        });
    });

    describe('isRoutableIP', () => {
        it('should return true for a routable ip address', () => {
            // public ips
            expect(FieldValidator.isRoutableIP('8.8.8.8')).toBe(true);
            expect(FieldValidator.isRoutableIP('2001:db8::1')).toBe(true);
            expect(FieldValidator.isRoutableIP('172.194.0.1')).toBe(true);
        });

        it('should return false for a non-routable ip address or invalid ip address', () => {
            expect(FieldValidator.isRoutableIP('192.168.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('fc00:db8::1')).toBe(false);
            expect(FieldValidator.isRoutableIP('badIpaddress')).toBe(false);
        });
    });

    describe('isNonRoutableIP', () => {
        it('should return true for a non routable ip address', () => {
            expect(FieldValidator.isNonRoutableIP('192.168.0.1')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('10.16.32.210')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('172.18.12.74')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('fc00:db8::1')).toBe(true);
        });

        it('should return false for a routable ip address or invalid ip address', () => {
            expect(FieldValidator.isNonRoutableIP('8.8.8.8')).toBe(false);
            expect(FieldValidator.isNonRoutableIP('2001:db8::1')).toBe(false);
            expect(FieldValidator.isNonRoutableIP('172.194.0.1')).toBe(false);
            expect(FieldValidator.isNonRoutableIP('badIpaddress')).toBe(false);
        });
    });

    describe('isIpCidr', () => {
        it('should return true for valid ips with cidr notation', () => {
            expect(FieldValidator.isIPCidr('1.2.3.4/32')).toBe(true);
            expect(FieldValidator.isIPCidr('8.8.0.0/12')).toBe(true);
            expect(FieldValidator.isIPCidr('2001:0db8:0123:4567:89ab:cdef:1234:5678/128')).toBe(true);
            expect(FieldValidator.isIPCidr('2001::1234:5678/128')).toBe(true);
        });

        it('should return false for invalid ips with cidr notation', () => {
            expect(FieldValidator.isIPCidr('1.2.3.4/128')).toBe(false);
            expect(FieldValidator.isIPCidr('notanipaddress/12')).toBe(false);
            expect(FieldValidator.isIPCidr('2001:0db8:0123:4567:89ab:cdef:1234:5678/412')).toBe(false);
            expect(FieldValidator.isIPCidr('2001::1234:5678/b')).toBe(false);
            expect(FieldValidator.isIPCidr('8.8.8.10')).toBe(false);
            expect(FieldValidator.isIPCidr(true)).toBe(false);
            expect(FieldValidator.isIPCidr({})).toBe(false);
        });
    });

    describe('inIPRange', () => {
        it('return true for ip addresses in a given range using cidr notation', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', { cidr: '8.8.8.0/24' })).toBe(true);
            expect(FieldValidator.inIPRange('2001:0db8:0123:4567:89ab:cdef:1234:5678', { cidr: '2001:0db8:0123:4567:89ab:cdef:1234:0/112' })).toBe(true);
        });

        it('should return true for valid ips in a range with max and min', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0', max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.8', { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.0', { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.64', { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', { min: 'fd00::123', max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', { min: 'fd00::b000', max: 'fd00::ea00' })).toBe(true);
        });

        it('should return false for ips out of the ranges, cidr notation defined range', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', { cidr: '8.8.8.10/32' })).toBe(false);
            expect(FieldValidator.inIPRange('1.2.3.4', { cidr: '8.8.2.0/24' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { cidr: '8.8.2.0/24' })).toBe(false);
            expect(FieldValidator.inIPRange('badIpAddress', { cidr: '8.8.2.0/24' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.1.12', { cidr: '8.8.2.0/23' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.1.12', { cidr: 'badCidr' })).toBe(false);
        });

        it('should return false for ips out of range, min and max defined range', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.102', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('badIpAddress', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: 'badIpAddress', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.24', max: 'badIpAddress' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: 'fd00::b000', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: '8.8.8.0', max: 'fd00::b000' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', { min: 'fd00::a000', max: 'fd00::b000' })).toBe(false);

            expect(FieldValidator.inIPRange('fd00::b000', { min: 'fd00::c000', max: 'fd00::f000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { min: 'fd00::f000', max: 'fd00::1000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { min: '8.8.8.24', max: 'fd00::b000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { min: 'fd00::a000', max: '8.8.8.24' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { min: '8.8.8.0', max: '8.8.8.24' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { max: 'fd00::1000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', { min: 'fd00::f000' })).toBe(false);
        });
    });

    describe('isValidDate', () => {
        it('should return true for strings that can be parsed into a date', () => {
            expect(FieldValidator.isValidDate('2019-03-17T23:08:59.673Z')).toBe(true);
            expect(FieldValidator.isValidDate('2019-03-17')).toBe(true);
            expect(FieldValidator.isValidDate('2019-03-17T23:08:59')).toBe(true);
            expect(FieldValidator.isValidDate('03/17/2019')).toBe(true);
            expect(FieldValidator.isValidDate('03-17-2019')).toBe(true);
            expect(FieldValidator.isValidDate('Jan 22, 2012')).toBe(true);
            expect(FieldValidator.isValidDate('23 Jan 2012')).toBe(true);
            expect(FieldValidator.isValidDate('12.23.2012')).toBe(true);
            expect(FieldValidator.isValidDate('12.23.12')).toBe(true);
            expect(FieldValidator.isValidDate('2020/01/23')).toBe(true);
            expect(FieldValidator.isValidDate('01/23/20')).toBe(true);
        });

        it('should return true for integers that can be parsed to a date', () => {
            expect(FieldValidator.isValidDate(1552000139)).toBe(true);
        });

        it('should return true for date objects that can be parsed to a date', () => {
            expect(FieldValidator.isValidDate(new Date())).toBe(true);
        });

        it('should return false for anything that cannot be parsed to a date', () => {
            expect(FieldValidator.isValidDate('20/01/23')).toBe(false);
            expect(FieldValidator.isValidDate('2020-23-09')).toBe(false);
            expect(FieldValidator.isValidDate('21.03.2012')).toBe(false);
            expect(FieldValidator.isValidDate('21/01/2019')).toBe(false);
            expect(FieldValidator.isValidDate('123432as;ldkfjasoej293432423')).toBe(false);
            expect(FieldValidator.isValidDate('1552000        139673')).toBe(false);
            expect(FieldValidator.isValidDate('unknown')).toBe(false);
            expect(FieldValidator.isValidDate('undefined')).toBe(false);
            expect(FieldValidator.isValidDate('baddate')).toBe(false);
            expect(FieldValidator.isValidDate(null)).toBe(false);
            expect(FieldValidator.isValidDate('1581461626643')).toBe(false);
            expect(FieldValidator.isValidDate(43546577754.434)).toBe(false);
            expect(FieldValidator.isValidDate(undefined)).toBe(false);
            expect(FieldValidator.isValidDate(true)).toBe(false);
            expect(FieldValidator.isValidDate(false)).toBe(false);
            expect(FieldValidator.isValidDate('')).toBe(false);
            expect(FieldValidator.isValidDate('    ')).toBe(false);
        });
    });

    describe('isISDN', () => {
        it('should validate isdn numbers', () => {
            expect(FieldValidator.isISDN('46707123456')).toBe(true);
            expect(FieldValidator.isISDN('1 808 915 6800')).toBe(true);
            expect(FieldValidator.isISDN('1-808-915-6800')).toBe(true);
            expect(FieldValidator.isISDN('+18089156800')).toBe(true);
            expect(FieldValidator.isISDN('+7-952-5554-602')).toBe(true);
            expect(FieldValidator.isISDN('79525554602')).toBe(true);
            expect(FieldValidator.isISDN(79525554602)).toBe(true);
            expect(FieldValidator.isISDN('unknown')).toBe(false);
            expect(FieldValidator.isISDN('52')).toBe(false);
            expect(FieldValidator.isISDN('34000000000')).toBe(false);
            expect(FieldValidator.isISDN('4900000000000')).toBe(false);
            expect(FieldValidator.isISDN('1234')).toBe(false);
            expect(FieldValidator.isISDN('22345')).toBe(false);
            expect(FieldValidator.isISDN('223457')).toBe(false);
            expect(FieldValidator.isISDN('2234578')).toBe(false);
            expect(FieldValidator.isISDN('123')).toBe(false);
            expect(FieldValidator.isISDN('5')).toBe(false);
            expect(FieldValidator.isISDN('011')).toBe(false);
            expect(FieldValidator.isISDN(7)).toBe(false);
            expect(FieldValidator.isISDN(true)).toBe(false);
            expect(FieldValidator.isISDN({})).toBe(false);
            expect(FieldValidator.isISDN([])).toBe(false);
        });
    });

    describe('isMacAddress', () => {
        it('should return true for a valid mac address', () => {
            expect(FieldValidator.isMacAddress('00:1f:f3:5b:2b:1f')).toBe(true);
            expect(FieldValidator.isMacAddress('00-1f-f3-5b-2b-1f')).toBe(true);
            expect(FieldValidator.isMacAddress('001f.f35b.2b1f')).toBe(true);
            expect(FieldValidator.isMacAddress('00 1f f3 5b 2b 1f')).toBe(true);
            expect(FieldValidator.isMacAddress('001ff35b2b1f')).toBe(true);
        });

        it('should return false for a invalid mac address', () => {
            expect(FieldValidator.isMacAddress('00:1:f:5b:2b:1f')).toBe(false);
            expect(FieldValidator.isMacAddress('00.1f.f3.5b.2b.1f')).toBe(false);
            expect(FieldValidator.isMacAddress('00-1Z-fG-5b-2b-1322f')).toBe(false);
            expect(FieldValidator.isMacAddress('23423423')).toBe(false);
            expect(FieldValidator.isMacAddress('00_1Z_fG_5b_2b_13')).toBe(false);
            expect(FieldValidator.isMacAddress(1233456)).toBe(false);
            expect(FieldValidator.isMacAddress({})).toBe(false);
            expect(FieldValidator.isMacAddress(true)).toBe(false);
        });

        it('should validate based on specified delimiter', () => {
            expect(FieldValidator.isMacAddress('001ff35b2b1f', { delimiter: 'any' })).toBe(true);
            expect(FieldValidator.isMacAddress('00:1f:f3:5b:2b:1f', { delimiter: 'colon' })).toBe(true);
            expect(FieldValidator.isMacAddress('00-1f-f3-5b-2b-1f', { delimiter: 'dash' })).toBe(true);
            expect(FieldValidator.isMacAddress('00 1f f3 5b 2b 1f', { delimiter: 'space' })).toBe(true);
            expect(FieldValidator.isMacAddress('001f.f35b.2b1f', { delimiter: 'dot' })).toBe(true);
            expect(FieldValidator.isMacAddress('001ff35b2b1f', { delimiter: 'none' })).toBe(true);
            expect(FieldValidator.isMacAddress('00:1f:f3:5b:2b:1f', { delimiter: ['dash', 'colon'] })).toBe(true);
            expect(FieldValidator.isMacAddress('00:1f:f3:5b:2b:1f', { delimiter: 'dash' })).toBe(false);
            expect(FieldValidator.isMacAddress('00 1f f3 5b 2b 1f', { delimiter: 'colon' })).toBe(false);
            expect(FieldValidator.isMacAddress('001ff35b2b1f', { delimiter: 'colon' })).toBe(false);
            expect(FieldValidator.isMacAddress('001ff35b2b1f', { delimiter: ['dash', 'colon'] })).toBe(false);
        });
    });

    describe('inNumberRange', () => {
        it('should return true if number in range', () => {
            expect(FieldValidator.inNumberRange(44, { min: 0, max: 45 })).toBe(true);
            expect(FieldValidator.inNumberRange(-12, { min: -100, max: 45 })).toBe(true);
            expect(FieldValidator.inNumberRange(0, { max: 45 })).toBe(true);
            expect(FieldValidator.inNumberRange(0, { min: -45 })).toBe(true);
        });

        it('should return false if number out of range', () => {
            expect(FieldValidator.inNumberRange(44, { min: 0, max: 25 })).toBe(false);
            expect(FieldValidator.inNumberRange(-12, { min: -10, max: 45 })).toBe(false);
            expect(FieldValidator.inNumberRange(0, { max: -45 })).toBe(false);
            expect(FieldValidator.inNumberRange(0, { min: 45 })).toBe(false);
        });
    });

    describe('isNumber', () => {
        it('should return true for a valid number', () => {
            expect(FieldValidator.isNumber(1)).toBe(true);
            expect(FieldValidator.isNumber(-11232)).toBe(true);
            expect(FieldValidator.isNumber(0o32)).toBe(true);
            expect(FieldValidator.isNumber(17.343)).toBe(true);
            expect(FieldValidator.isNumber(Infinity)).toBe(true);
        });

        it('should return false if not a number', () => {
            expect(FieldValidator.isNumber('1')).toBe(false);
            expect(FieldValidator.isNumber(true)).toBe(false);
            expect(FieldValidator.isNumber({})).toBe(false);
            expect(FieldValidator.isNumber([])).toBe(false);
            expect(FieldValidator.isNumber(null)).toBe(false);
            expect(FieldValidator.isNumber(undefined)).toBe(false);
            expect(FieldValidator.isNumber('astring')).toBe(false);
        });
    });

    describe('isInteger', () => {
        it('should return true for a valid integer', () => {
            expect(FieldValidator.isInteger(1)).toBe(true);
            expect(FieldValidator.isInteger(-11232)).toBe(true);
            expect(FieldValidator.isInteger(0o32)).toBe(true);
        });

        it('should return false if not an integer', () => {
            expect(FieldValidator.isInteger(Infinity)).toBe(false);
            expect(FieldValidator.isInteger('1')).toBe(false);
            expect(FieldValidator.isInteger(1.3432)).toBe(false);
            expect(FieldValidator.isInteger(true)).toBe(false);
            expect(FieldValidator.isInteger(false)).toBe(false);
            expect(FieldValidator.isInteger({})).toBe(false);
            expect(FieldValidator.isInteger([])).toBe(false);
            expect(FieldValidator.isInteger(null)).toBe(false);
            expect(FieldValidator.isInteger(undefined)).toBe(false);
            expect(FieldValidator.isInteger('astring')).toBe(false);
        });
    });

    describe('isString', () => {
        it('should return true for valid strings', () => {
            expect(FieldValidator.isString('this is a string')).toBe(true);
            expect(FieldValidator.isString('false')).toBe(true);
            expect(FieldValidator.isString('12345')).toBe(true);
        });

        it('should return false for non-strings', () => {
            expect(FieldValidator.isString(Buffer.from('some string', 'utf8'))).toBe(false);
            expect(FieldValidator.isString(true)).toBe(false);
            expect(FieldValidator.isString(12345)).toBe(false);
            expect(FieldValidator.isString({})).toBe(false);
            expect(FieldValidator.isString([])).toBe(false);
        });
    });

    describe('isUrl', () => {
        it('should return true for valid uris', () => {
            expect(FieldValidator.isUrl('http://someurl.com')).toBe(true);
            expect(FieldValidator.isUrl('http://someurl.com.uk')).toBe(true);
            expect(FieldValidator.isUrl('https://someurl.cc.ru.ch')).toBe(true);
            expect(FieldValidator.isUrl('ftp://someurl.bom:8080?some=bar&hi=bob')).toBe(true);
            expect(FieldValidator.isUrl('http://xn--fsqu00a.xn--3lr804guic')).toBe(true);
            expect(FieldValidator.isUrl('http://example.com/%E5%BC%95%E3%81%8D%E5%89%B2%E3%82%8A.html')).toBe(true);
        });

        it('should return false for invalid uris', () => {
            expect(FieldValidator.isUrl('')).toBe(false);
            expect(FieldValidator.isUrl('null')).toBe(false);
            expect(FieldValidator.isUrl(true)).toBe(false);
            expect(FieldValidator.isUrl({ url: 'http:thisisaurl.com' })).toBe(false);
            expect(FieldValidator.isUrl(12345)).toBe(false);
        });
    });

    describe('isUUID', () => {
        it('should return true for valid UUIDs', () => {
            expect(FieldValidator.isUUID('95ecc380-afe9-11e4-9b6c-751b66dd541e')).toBe(true);
            expect(FieldValidator.isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B')).toBe(true);
            expect(FieldValidator.isUUID('123e4567-e89b-82d3-f456-426655440000')).toBe(true);
        });

        it('should return false for invalid UUIDs', () => {
            expect(FieldValidator.isUUID('')).toBe(false);
            expect(FieldValidator.isUUID('95ecc380:afe9:11e4:9b6c:751b66dd541e')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-x2d3-0456-426655440000')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-12d3-a456-42600')).toBe(false);
            expect(FieldValidator.isUUID(undefined)).toBe(false);
            expect(FieldValidator.isUUID('randomstring')).toBe(false);
            expect(FieldValidator.isUUID(true)).toBe(false);
            expect(FieldValidator.isUUID({})).toBe(false);
        });
    });

    describe('contains', () => {
        it('should return true if string contains substring', () => {
            expect(FieldValidator.contains('hello', { value: 'hello' })).toBe(true);
            expect(FieldValidator.contains('hello', { value: 'll' })).toBe(true);
            expect(FieldValidator.contains('12345', { value: '45' })).toBe(true);
        });

        it('should return false if string does not contain substring', () => {
            expect(FieldValidator.contains('hello', { value: 'bye' })).toBe(false);
            expect(FieldValidator.contains(true, { value: 'rue' })).toBe(false);
            expect(FieldValidator.contains(12345, { value: '12' })).toBe(false);
            expect(FieldValidator.contains(['hello'], { value: 'hello' })).toBe(false);
            expect(FieldValidator.contains({}, { value: 'hello' })).toBe(false);
        });
    });

    describe('equals', () => {
        it('should return true if string is equal to a value', () => {
            expect(FieldValidator.equals('hello', { value: 'hello' })).toBe(true);
            expect(FieldValidator.equals('false', { value: 'false' })).toBe(true);
            expect(FieldValidator.equals('12345', { value: '12345' })).toBe(true);
        });

        it('should return false if string is not equal to value', () => {
            expect(FieldValidator.equals('hello', { value: 'llo' })).toBe(false);
            expect(FieldValidator.equals(true, { value: 'true' })).toBe(false);
            expect(FieldValidator.equals(12345, { value: '12345' })).toBe(false);
            expect(FieldValidator.equals(['hello'], { value: 'hello' })).toBe(false);
            expect(FieldValidator.equals({}, { value: 'hello' })).toBe(false);
        });
    });

    describe('isAlpha', () => {
        it('should return true if value is alpha characters', () => {
            expect(FieldValidator.isAlpha('ThiSisAsTRing')).toBe(true);
            expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-Pl' })).toBe(true);
        });

        it('should return false if value is not alpha characters', () => {
            expect(FieldValidator.isAlpha('ThiSisAsTRing%03$')).toBe(false);
            expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ')).toBe(false);
            expect(FieldValidator.isAlpha(false)).toBe(false);
            expect(FieldValidator.isAlpha({})).toBe(false);
            expect(FieldValidator.isAlpha('1234ThisiZĄĆĘŚŁ', { locale: 'pl-PL' })).toBe(false);
            expect(FieldValidator.isAlpha(['thisis a string'])).toBe(false);
            expect(FieldValidator.isAlpha('dude howdy')).toBe(false);
        });
    });

    describe('isAlphaNumeric', () => {
        it('should return true if string is all alphaNumeric chars for locale', () => {
            expect(FieldValidator.isAlphanumeric('alpha1234')).toBe(true);
            expect(FieldValidator.isAlphanumeric('1234')).toBe(true);
            expect(FieldValidator.isAlphanumeric('allalpa')).toBe(true);
            expect(FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' })).toBe(true);
            expect(FieldValidator.isAlphanumeric('12343534', { locale: 'ku-IQ' })).toBe(true);
            expect(FieldValidator.isAlphanumeric('فڤقک', { locale: 'ku-IQ' })).toBe(true);
        });

        it('should return false if string is not alphaNumeric chars for locale', () => {
            expect(FieldValidator.isAlphanumeric('alpha1.23%4')).toBe(false);
            expect(FieldValidator.isAlphanumeric('فڤقکگ1234')).toBe(false);
            expect(FieldValidator.isAlphanumeric(false)).toBe(false);
            expect(FieldValidator.isAlphanumeric(123456)).toBe(false);
            expect(FieldValidator.isAlphanumeric({ string: 'somestring' })).toBe(false);
        });
    });

    describe('isAscii', () => {
        it('should return true if string is all ascii chars', () => {
            expect(FieldValidator.isAscii('sim,pleAscii\t8*7!@#"\n')).toBe(true);
            expect(FieldValidator.isAscii('\x03, \x5A~')).toBe(true);
        });

        it('should return false for not ascii strings', () => {
            expect(FieldValidator.isAscii(true)).toBe(false);
            expect(FieldValidator.isAscii({})).toBe(false);
            expect(FieldValidator.isAscii(12334)).toBe(false);
            expect(FieldValidator.isAscii('˜∆˙©∂ß')).toBe(false);
            expect(FieldValidator.isAscii('ڤقک')).toBe(false);
        });
    });

    describe('isBase64', () => {
        it('should return true for base64 strings', () => {
            expect(FieldValidator.isBase64('ZWFzdXJlLg==')).toBe(true);
            expect(FieldValidator.isBase64('YW55IGNhcm5hbCBwbGVhc3Vy')).toBe(true);
        });

        it('should return false for non-base64 strings', () => {
            expect(FieldValidator.isBase64('thisisjustastring')).toBe(false);
            expect(FieldValidator.isBase64(true)).toBe(false);
            expect(FieldValidator.isBase64([])).toBe(false);
            expect(FieldValidator.isBase64(123345)).toBe(false);
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty strings, object, and arrays', () => {
            expect(FieldValidator.isEmpty('')).toBe(true);
            expect(FieldValidator.isEmpty(undefined)).toBe(true);
            expect(FieldValidator.isEmpty(null)).toBe(true);
            expect(FieldValidator.isEmpty({})).toBe(true);
            expect(FieldValidator.isEmpty([])).toBe(true);
            expect(FieldValidator.isEmpty('     ', { ignoreWhitespace: true })).toBe(true);
        });

        it('should return false for non-empty inputs', () => {
            expect(FieldValidator.isEmpty('not empty')).toBe(false);
            expect(FieldValidator.isEmpty({ a: 'something' })).toBe(false);
            expect(FieldValidator.isEmpty(['one', 2, 'three'])).toBe(false);
            expect(FieldValidator.isEmpty('     ')).toBe(false);
        });
    });

    describe('isFQDN', () => {
        it('should return true for valid fully qualified domain names', () => {
            expect(FieldValidator.isFQDN('john.com')).toBe(true);
            expect(FieldValidator.isFQDN('john.com.uk.bob')).toBe(true);
        });

        it('should return false for invalid fully qualified domain names', () => {
            expect(FieldValidator.isFQDN(true)).toBe(false);
            expect(FieldValidator.isFQDN(12345)).toBe(false);
            expect(FieldValidator.isFQDN('notadomain')).toBe(false);
            expect(FieldValidator.isFQDN([])).toBe(false);
            expect(FieldValidator.isFQDN('')).toBe(false);
            expect(FieldValidator.isFQDN('example.com/help/hello')).toBe(false);
        });
    });

    describe('isHash', () => {
        it('should return true for valid hash strings', () => {
            expect(FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', { algo: 'md5' })).toBe(true);
            expect(FieldValidator.isHash('85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33', { algo: 'sha256' })).toBe(true);
            expect(FieldValidator.isHash('98fc121ea4c749f2b06e4a768b92ef1c740625a0', { algo: 'sha1' })).toBe(true);
        });

        it('should return false for invalid hash strings', () => {
            expect(FieldValidator.isHash('6201b3d18157e00963fcf008c1e', { algo: 'md5' })).toBe(false);
            expect(FieldValidator.isHash('85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c107e33', { algo: 'sha256' })).toBe(false);
            expect(FieldValidator.isHash('98fc121easdfasdfasdfads749f2b06e4a768b92ef1c740625a0', { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash(12345, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash(true, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash([], { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash('', { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', { algo: 'sha1' })).toBe(false);
        });
    });

    describe('isCountryCode', () => {
        it('should return true for valid 2 letter country codes', () => {
            expect(FieldValidator.isCountryCode('US')).toBe(true);
            expect(FieldValidator.isCountryCode('IS')).toBe(true);
            expect(FieldValidator.isCountryCode('RU')).toBe(true);
            expect(FieldValidator.isCountryCode('ru')).toBe(true);
        });

        it('should return false for invalid 2 letter country codes', () => {
            expect(FieldValidator.isCountryCode('USA')).toBe(false);
            expect(FieldValidator.isCountryCode('')).toBe(false);
            expect(FieldValidator.isCountryCode('XX')).toBe(false);
            expect(FieldValidator.isCountryCode(12)).toBe(false);
            expect(FieldValidator.isCountryCode(true)).toBe(false);
            expect(FieldValidator.isCountryCode([])).toBe(false);
            expect(FieldValidator.isCountryCode({})).toBe(false);
        });
    });

    describe('isISO8601', () => {
        it('should return true for valid ISO8601 string dates', () => {
            expect(FieldValidator.isISO8601('2020-01-01T12:03:03.494Z')).toBe(true);
            expect(FieldValidator.isISO8601('2020-01-01')).toBe(true);
            expect(FieldValidator.isISO8601('2020-01-01T12:03:03')).toBe(true);
        });

        it('should return false for invalid ISO8601 string dates', () => {
            expect(FieldValidator.isISO8601('2020-22-01T12:03:03.494Z')).toBe(false);
            expect(FieldValidator.isISO8601('Jan 1, 2020')).toBe(false);
            expect(FieldValidator.isISO8601('2020/02/13')).toBe(false);
            expect(FieldValidator.isISO8601(true)).toBe(false);
            expect(FieldValidator.isISO8601('')).toBe(false);
            expect(FieldValidator.isISO8601([])).toBe(false);
            expect(FieldValidator.isISO8601('somestring')).toBe(false);
            expect(FieldValidator.isISO8601(12321321321123)).toBe(false);
        });
    });

    describe('isISSN', () => {
        it('should return true for valid ISSN numbers', () => {
            expect(FieldValidator.isISSN('0378-5955')).toBe(true);
            expect(FieldValidator.isISSN('03785955')).toBe(true);
            expect(FieldValidator.isISSN('0378-5955', { requireHyphen: true })).toBe(true);
            expect(FieldValidator.isISSN('0000-006x')).toBe(true);
            expect(FieldValidator.isISSN('0000-006X', { requireHyphen: true, caseSensitive: true })).toBe(true);
        });

        it('should return false for invalid ISSN numbers', () => {
            expect(FieldValidator.isISSN('0375955')).toBe(false);
            expect(FieldValidator.isISSN('03785955', { requireHyphen: true })).toBe(false);
            expect(FieldValidator.isISSN('0000-006x', { caseSensitive: true })).toBe(false);
            expect(FieldValidator.isISSN('0000-006x', { caseSensitive: true })).toBe(false);
            expect(FieldValidator.isISSN('hellothere')).toBe(false);
            expect(FieldValidator.isISSN(123456)).toBe(false);
            expect(FieldValidator.isISSN(true)).toBe(false);
            expect(FieldValidator.isISSN([])).toBe(false);
            expect(FieldValidator.isISSN('')).toBe(false);
        });
    });

    describe('isRFC3339', () => {
        it('should return true for valid RFC3339 dates', () => {
            expect(FieldValidator.isRFC3339('2020-01-01T12:05:05.001Z')).toBe(true);
            expect(FieldValidator.isRFC3339('2020-01-01 12:05:05.001Z')).toBe(true);
            expect(FieldValidator.isRFC3339('2020-01-01T12:05:05Z')).toBe(true);
        });

        it('should return false for invalid RFC3339 dates', () => {
            expect(FieldValidator.isRFC3339('2020-01-01')).toBe(false);
            expect(FieldValidator.isRFC3339('20-01-01 12:05:05.001Z')).toBe(false);
            expect(FieldValidator.isRFC3339('')).toBe(false);
            expect(FieldValidator.isRFC3339(true)).toBe(false);
            expect(FieldValidator.isRFC3339(12345)).toBe(false);
            expect(FieldValidator.isRFC3339(null)).toBe(false);
            expect(FieldValidator.isRFC3339({})).toBe(false);
        });
    });

    describe('isJSON', () => {
        it('should return true for valid JSON', () => {
            expect(FieldValidator.isJSON('{ "bob": "gibson" }')).toBe(true);
            expect(FieldValidator.isJSON('[{ "bob": "gibson" }, { "dizzy": "dean" }]')).toBe(true);
            expect(FieldValidator.isJSON('[]')).toBe(true);
            expect(FieldValidator.isJSON('{}')).toBe(true);
        });

        it('should return false for invalid JSON', () => {
            expect(FieldValidator.isJSON('{ bob: "gibson" }')).toBe(false);
            expect(FieldValidator.isJSON('[{ "bob": "gibson" }, { "dizzy": "dean" }, ]')).toBe(false);
            expect(FieldValidator.isJSON([])).toBe(false);
            expect(FieldValidator.isJSON({})).toBe(false);
            expect(FieldValidator.isJSON({ bob: 'gibson' })).toBe(false);
            expect(FieldValidator.isJSON(true)).toBe(false);
            expect(FieldValidator.isJSON('a great string')).toBe(false);
            expect(FieldValidator.isJSON(123456)).toBe(false);
            expect(FieldValidator.isJSON(null)).toBe(false);
        });
    });

    describe('isLength', () => {
        it('should return true for strings of length or strings within length min/ max', () => {
            expect(FieldValidator.isLength('astring', { size: 7 })).toBe(true);
            expect(FieldValidator.isLength('astring', { min: 4 })).toBe(true);
            expect(FieldValidator.isLength('astring', { max: 10 })).toBe(true);
            expect(FieldValidator.isLength('astring', { min: 5, max: 10 })).toBe(true);
            expect(FieldValidator.isLength('astring', { min: 7, max: 10 })).toBe(true);
            expect(FieldValidator.isLength('astring', { min: 5, max: 7 })).toBe(true);
        });

        it('should return false for strings not of length or strings outside length min/ max', () => {
            expect(FieldValidator.isLength('astring', { size: 5 })).toBe(false);
            expect(FieldValidator.isLength('astring', { min: 8 })).toBe(false);
            expect(FieldValidator.isLength('astring', { max: 6 })).toBe(false);
            expect(FieldValidator.isLength('astring', { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(true, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(['astring'], { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(undefined, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(1234, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength({ string: 'astring' }, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength('astring', {})).toBe(false);
        });
    });

    describe('isMimeType', () => {
        it('should return true for valid mime/ media types', () => {
            expect(FieldValidator.isMimeType('application/javascript')).toBe(true);
            expect(FieldValidator.isMimeType('application/graphql')).toBe(true);
            expect(FieldValidator.isMimeType('text/html')).toBe(true);
            expect(FieldValidator.isMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
        });

        it('should return false for invalid mime/ media types', () => {
            expect(FieldValidator.isMimeType('application')).toBe(false);
            expect(FieldValidator.isMimeType('')).toBe(false);
            expect(FieldValidator.isMimeType(false)).toBe(false);
            expect(FieldValidator.isMimeType({})).toBe(false);
            expect(FieldValidator.isMimeType(12345)).toBe(false);
        });
    });

    describe('isPostalCode', () => {
        it('should return true for valid postal codes', () => {
            expect(FieldValidator.isPostalCode('85249', { locale: 'any' })).toBe(true);
            expect(FieldValidator.isPostalCode('85249', { locale: 'ES' })).toBe(true);
            expect(FieldValidator.isPostalCode('85249', { locale: 'ES' })).toBe(true);
            expect(FieldValidator.isPostalCode('852', { locale: 'IS' })).toBe(true);
            expect(FieldValidator.isPostalCode('885 49', { locale: 'SE' })).toBe(true);
        });

        it('should return false for invalid postal codes', () => {
            expect(FieldValidator.isPostalCode('', { locale: 'any' })).toBe(false);
            expect(FieldValidator.isPostalCode(123345, { locale: 'ES' })).toBe(false);
            expect(FieldValidator.isPostalCode({}, { locale: 'ES' })).toBe(false);
            expect(FieldValidator.isPostalCode('8522-342', { locale: 'IS' })).toBe(false);
            expect(FieldValidator.isPostalCode('885%49', { locale: 'SE' })).toBe(false);
            expect(FieldValidator.isPostalCode(true, { locale: 'any' })).toBe(false);
            expect(FieldValidator.isPostalCode(null, { locale: 'ES' })).toBe(false);
        });
    });
});
