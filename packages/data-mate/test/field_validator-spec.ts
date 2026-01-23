import * as i from '@terascope/types';
import { FieldValidator } from '../src/validations/index.js';

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
            expect(FieldValidator.isBoolean(undefined)).toEqual(false);
            expect(FieldValidator.isBoolean(['asdf'])).toEqual(false);
            expect(FieldValidator.isBoolean({ one: 1 })).toEqual(false);
            expect(FieldValidator.isBoolean(3)).toEqual(false);
            expect(FieldValidator.isBoolean('hello')).toEqual(false);

            expect(FieldValidator.isBoolean(true)).toEqual(true);
            expect(FieldValidator.isBoolean(false)).toEqual(true);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isBoolean([true, undefined])).toEqual(true);
            expect(FieldValidator.isBoolean(['true', undefined])).toEqual(false);
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

            expect(FieldValidator.isBooleanLike(undefined)).toEqual(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isBooleanLike(['true', undefined])).toEqual(true);
        });
    });

    describe('isEmail', () => {
        const list = [
            'ha3ke5@pawnage.com',
            'user@blah@blah.com',
            'junk user@blah.com',
            'user@blah.com/junk.morejunk',
            'user@blah.com&value=junk',
            'user@blah.com/junk.junk?a=<tag value="junk"'
        ];

        const expectedResults = [
            true,
            true,
            false,
            false,
            false,
            false
        ];

        it('should check if a value is an email', () => {
            expect(FieldValidator.isEmail(undefined)).toEqual(false);
            expect(FieldValidator.isEmail(['asdf'])).toEqual(false);
            expect(FieldValidator.isEmail({ one: 1 })).toEqual(false);
            expect(FieldValidator.isEmail(3)).toEqual(false);
            expect(FieldValidator.isEmail('hello')).toEqual(false);

            const results = list.map(FieldValidator.isEmail);
            expect(results).toEqual(expectedResults);
        });

        it('validates an array of values, ignores undefined/null', () => {
            const newList = list.slice(0, 2);

            newList.push(null as any);

            expect(FieldValidator.isEmail(newList)).toEqual(true);
        });
    });

    describe('isGeoPoint', () => {
        it('should check if a value is GeoPoint', () => {
            expect(FieldValidator.isGeoPoint(undefined)).toEqual(false);
            expect(FieldValidator.isGeoPoint(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoPoint({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoPoint(3)).toEqual(false);
            expect(FieldValidator.isGeoPoint('hello')).toEqual(false);
            expect(FieldValidator.isGeoPoint('60,80')).toEqual(true);
            expect(FieldValidator.isGeoPoint([80, 60])).toEqual(true);
            expect(FieldValidator.isGeoPoint({ lat: 60, lon: 80 })).toEqual(true);
            expect(FieldValidator.isGeoPoint({ latitude: 60, longitude: 80 })).toEqual(true);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isGeoPoint(['60,80', undefined])).toEqual(true);
        });
    });

    describe('isGeoShapePoint', () => {
        it('should check if a value is GeoShapePoint', () => {
            expect(FieldValidator.isGeoShapePoint(undefined)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoShapePoint({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(3)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint('hello')).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(matchingPoint)).toEqual(true);
            expect(FieldValidator.isGeoShapePoint(polygon)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(polygonWithHoles)).toEqual(false);
            expect(FieldValidator.isGeoShapePoint(multiPolygon)).toEqual(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isGeoShapePoint([matchingPoint, undefined])).toEqual(true);
        });
    });

    describe('isGeoShapePolygon', () => {
        it('should check if a value is GeoShapePolygon', () => {
            expect(FieldValidator.isGeoShapePolygon(undefined)).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon(3)).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon('hello')).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon(matchingPoint)).toEqual(false);
            expect(FieldValidator.isGeoShapePolygon(polygon)).toEqual(true);
            expect(FieldValidator.isGeoShapePolygon(polygonWithHoles)).toEqual(true);
            expect(FieldValidator.isGeoShapePolygon(multiPolygon)).toEqual(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isGeoShapePolygon([polygon, undefined])).toEqual(true);
        });
    });

    describe('isGeoShapeMultiPolygon', () => {
        it('should check if a value is GeoShapeMultiPolygon', () => {
            expect(FieldValidator.isGeoShapeMultiPolygon(undefined)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(3)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon('hello')).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(matchingPoint)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(polygon)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(polygonWithHoles)).toEqual(false);
            expect(FieldValidator.isGeoShapeMultiPolygon(multiPolygon)).toEqual(true);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isGeoShapeMultiPolygon([multiPolygon, undefined])).toEqual(true);
        });
    });

    describe('isGeoJSON', () => {
        const list = [
            matchingPoint,
            polygon,
            polygonWithHoles,
            multiPolygon
        ];

        it('should check if a value is GeoJSON', () => {
            expect(FieldValidator.isGeoJSON(undefined as any)).toEqual(false);
            expect(FieldValidator.isGeoJSON(['asdf'])).toEqual(false);
            expect(FieldValidator.isGeoJSON({ one: 1 })).toEqual(false);
            expect(FieldValidator.isGeoJSON(3)).toEqual(false);
            expect(FieldValidator.isGeoJSON('hello')).toEqual(false);

            const results = list.map(FieldValidator.isGeoJSON);
            expect(results.every((val) => val === true)).toEqual(true);
        });

        it('validates an array of values, ignores undefined/null', () => {
            const newList = list.slice();

            newList.push(undefined as any);
            expect(FieldValidator.isGeoJSON(newList)).toEqual(true);
        });
    });

    describe('isIP should', () => {
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
            expect(FieldValidator.isIP('::192.168.1.18')).toBe(true);
        });

        it('return false for invalid ip addresses', () => {
            expect(FieldValidator.isIP('NA')).toBe(false);
            expect(FieldValidator.isIP('')).toBe(false);
            expect(FieldValidator.isIP('172.394.0.1')).toBe(false);
            expect(FieldValidator.isIP(undefined)).toBe(false);
            expect(FieldValidator.isIP('ZXXY:db8:85a3:8d3:1319:8a2e:370:7348')).toBe(false);
            expect(FieldValidator.isIP('11.222.33.001')).toBe(false);
            expect(FieldValidator.isIP('87')).toBe(false);
            expect(FieldValidator.isIP('02751178')).toBe(false);
            expect(FieldValidator.isIP(true)).toBe(false);
            expect(FieldValidator.isIP({})).toBe(false);
            expect(FieldValidator.isIP([])).toBe(false);
            expect(FieldValidator.isIP(123456678)).toBe(false);
            expect(FieldValidator.isIP(12.4345)).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isIP(['172.16.0.1', undefined])).toEqual(true);
        });
    });

    describe('isRoutableIP', () => {
        it('should return true for a routable ip address', () => {
            // public ips
            expect(FieldValidator.isRoutableIP('8.8.8.8')).toBe(true);
            expect(FieldValidator.isRoutableIP('172.35.12.18')).toBe(true);
            expect(FieldValidator.isRoutableIP('192.172.1.18')).toBe(true);
            expect(FieldValidator.isRoutableIP('11.0.1.18')).toBe(true);
            expect(FieldValidator.isRoutableIP('::2')).toBe(true);
            expect(FieldValidator.isRoutableIP('::abcd')).toBe(true);
            expect(FieldValidator.isRoutableIP('65:ff9b::ffff:ffff')).toBe(true);
            expect(FieldValidator.isRoutableIP('99::')).toBe(true);
            expect(FieldValidator.isRoutableIP('faff::12bc')).toBe(true);
            expect(FieldValidator.isRoutableIP('2620:4f:123::')).toBe(true);
            expect(FieldValidator.isRoutableIP('2003::')).toBe(true);
            expect(FieldValidator.isRoutableIP('fe79::ffff')).toBe(true);
            expect(FieldValidator.isRoutableIP('2001:2ff::ffff')).toBe(true);
        });

        it('should return false for a non-routable ip address or invalid ip address', () => {
            expect(FieldValidator.isRoutableIP('0.0.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('0.220.5.132')).toBe(false);
            expect(FieldValidator.isRoutableIP('0.0.0.0')).toBe(false);
            expect(FieldValidator.isRoutableIP('10.0.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('10.22.23.123')).toBe(false);
            expect(FieldValidator.isRoutableIP('100.64.123.123')).toBe(false);
            expect(FieldValidator.isRoutableIP('100.127.255.250')).toBe(false);
            expect(FieldValidator.isRoutableIP('127.0.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('127.230.10.19')).toBe(false);
            expect(FieldValidator.isRoutableIP('169.254.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('169.254.250.127')).toBe(false);
            expect(FieldValidator.isRoutableIP('172.16.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('172.31.250.192')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.0.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.0.0.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.0.2.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.0.2.182')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.31.196.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.31.196.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.52.193.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.52.193.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.88.99.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.88.99.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.168.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.168.255.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.175.48.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('192.175.48.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('198.18.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('198.19.255.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('198.51.100.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('198.51.100.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('203.0.113.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('203.0.113.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('240.0.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('255.255.255.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('255.255.255.255')).toBe(false);
            expect(FieldValidator.isRoutableIP('224.0.0.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('224.255.255.254')).toBe(false);
            expect(FieldValidator.isRoutableIP('::1')).toBe(false);
            expect(FieldValidator.isRoutableIP('::')).toBe(false);
            expect(FieldValidator.isRoutableIP('64:ff9b::')).toBe(false);
            expect(FieldValidator.isRoutableIP('64:ff9b::ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('64:ff9b:1::')).toBe(false);
            expect(FieldValidator.isRoutableIP('64:ff9b:1:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('100::')).toBe(false);
            expect(FieldValidator.isRoutableIP('100::ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:1ff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:0:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:1::1')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:1::2')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:2::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:2:0:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:3::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:3:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:4:112::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:4:112:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:10::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:1f:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:20::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:2f:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:db8::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2002::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('2620:4f:8000::')).toBe(false);
            expect(FieldValidator.isRoutableIP('2620:4f:8000:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('fc00::')).toBe(false);
            expect(FieldValidator.isRoutableIP('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
            expect(FieldValidator.isRoutableIP('fe80::')).toBe(false);
            expect(FieldValidator.isRoutableIP('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
        });

        it('should return true for routable ipv4 mapped ipv6 addresses', () => {
            expect(FieldValidator.isRoutableIP('::FFFF:12.155.166.101')).toBe(true);
            expect(FieldValidator.isRoutableIP('::ffff:4.108.10.2')).toBe(true);
        });

        it('should return false for non-routable ipv4 mapped ipv6 addresses', () => {
            expect(FieldValidator.isRoutableIP('::FFFF:192.52.193.1')).toBe(false);
            expect(FieldValidator.isRoutableIP('::192.168.1.18')).toBe(false);
            expect(FieldValidator.isRoutableIP('::ffff:0.0.0.0')).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isRoutableIP(['172.194.0.1', undefined])).toEqual(true);
        });
    });

    describe('isNonRoutableIP', () => {
        it('should return true for a non routable ip address', () => {
            expect(FieldValidator.isNonRoutableIP('192.168.0.1')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('10.16.32.210')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('172.18.12.74')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('fc00:db8::1')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('10.1.3.4')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('172.28.4.1')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('127.0.1.2')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('2001:db8::1')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('2001:3:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('192.88.99.1')).toBe(true);
            expect(FieldValidator.isNonRoutableIP('2001:2::')).toBe(true);
        });

        it('should return false for a routable ip address or invalid ip address', () => {
            expect(FieldValidator.isNonRoutableIP('8.8.8.8')).toBe(false);
            expect(FieldValidator.isNonRoutableIP('172.194.0.1')).toBe(false);
            expect(FieldValidator.isNonRoutableIP('badIpaddress')).toBe(false);
            expect(FieldValidator.isNonRoutableIP('2001:2ff::ffff')).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isNonRoutableIP(['fc00:db8::1', undefined])).toEqual(true);
        });
    });

    describe('isIpCidr', () => {
        it('should return true for valid ips with cidr notation', () => {
            expect(FieldValidator.isCIDR('1.2.3.4/32')).toBe(true);
            expect(FieldValidator.isCIDR('8.8.0.0/12')).toBe(true);
            expect(FieldValidator.isCIDR('2001:0db8:0123:4567:89ab:cdef:1234:5678/128')).toBe(true);
            expect(FieldValidator.isCIDR('2001::1234:5678/128')).toBe(true);
        });

        it('should return false for invalid ips with cidr notation', () => {
            expect(FieldValidator.isCIDR('1.2.3.4/128')).toBe(false);
            expect(FieldValidator.isCIDR('notanipaddress/12')).toBe(false);
            expect(FieldValidator.isCIDR('2001:0db8:0123:4567:89ab:cdef:1234:5678/412')).toBe(false);
            expect(FieldValidator.isCIDR('2001::1234:5678/b')).toBe(false);
            expect(FieldValidator.isCIDR('8.8.8.10')).toBe(false);
            expect(FieldValidator.isCIDR(true)).toBe(false);
            expect(FieldValidator.isCIDR({})).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isCIDR(['8.8.0.0/12', undefined])).toEqual(true);
        });
    });

    describe('inIPRange', () => {
        it('return true for ip addresses in a given range using cidr notation', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { cidr: '8.8.8.0/24' })).toBe(true);
            expect(FieldValidator.inIPRange('2001:0db8:0123:4567:89ab:cdef:1234:5678', {}, { cidr: '2001:0db8:0123:4567:89ab:cdef:1234:0/112' })).toBe(true);
        });

        it('should return true for valid ips in a range with max and min', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: '8.8.8.0', max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.0', {}, { min: '8.8.8.0' })).toBe(true);
            expect(FieldValidator.inIPRange('8.8.8.64', {}, { max: '8.8.8.64' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::123', max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { max: 'fd00::ea00' })).toBe(true);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::b000', max: 'fd00::ea00' })).toBe(true);
        });

        it('should return false for ips out of the ranges, cidr notation defined range', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { cidr: '8.8.8.10/32' })).toBe(false);
            expect(FieldValidator.inIPRange('1.2.3.4', {}, { cidr: '8.8.2.0/24' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { cidr: '8.8.2.0/24' })).toBe(false);
            expect(FieldValidator.inIPRange('badIpAddress', {}, { cidr: '8.8.2.0/24' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.1.12', {}, { cidr: '8.8.2.0/23' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.1.12', {}, { cidr: 'badCidr' })).toBe(false);
        });

        it('should return false for ips out of range, min and max defined range', () => {
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: '8.8.8.102', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('badIpAddress', {}, { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: 'badIpAddress', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: '8.8.8.24', max: 'badIpAddress' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: '8.8.8.24', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: 'fd00::b000', max: '8.8.8.32' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: '8.8.8.0', max: 'fd00::b000' })).toBe(false);
            expect(FieldValidator.inIPRange('8.8.8.8', {}, { min: 'fd00::a000', max: 'fd00::b000' })).toBe(false);

            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::c000', max: 'fd00::f000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::f000', max: 'fd00::1000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: '8.8.8.24', max: 'fd00::b000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::a000', max: '8.8.8.24' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: '8.8.8.0', max: '8.8.8.24' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { max: 'fd00::1000' })).toBe(false);
            expect(FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::f000' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.inIPRange(
                ['8.8.8.64', undefined],
                ['8.8.8.64', undefined],
                { min: '8.8.8.0', max: '8.8.8.64' }
            )).toEqual(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isValidDate(['2019-03-17', undefined])).toEqual(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isISDN(['+7-952-5554-602', undefined])).toEqual(true);
        });
    });

    describe('isMACAddress', () => {
        it('should return true for a valid mac address', () => {
            expect(FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f')).toBe(true);
            expect(FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f')).toBe(true);
            expect(FieldValidator.isMACAddress('001f.f35b.2b1f')).toBe(true);
            expect(FieldValidator.isMACAddress('00 1f f3 5b 2b 1f')).toBe(true);
            expect(FieldValidator.isMACAddress('001ff35b2b1f')).toBe(true);
        });

        it('should return false for a invalid mac address', () => {
            expect(FieldValidator.isMACAddress('00:1:f:5b:2b:1f')).toBe(false);
            expect(FieldValidator.isMACAddress('00.1f.f3.5b.2b.1f')).toBe(false);
            expect(FieldValidator.isMACAddress('00-1Z-fG-5b-2b-1322f')).toBe(false);
            expect(FieldValidator.isMACAddress('23423423')).toBe(false);
            expect(FieldValidator.isMACAddress('00_1Z_fG_5b_2b_13')).toBe(false);
            expect(FieldValidator.isMACAddress(1233456)).toBe(false);
            expect(FieldValidator.isMACAddress({})).toBe(false);
            expect(FieldValidator.isMACAddress(true)).toBe(false);
        });

        it('should validate based on specified delimiter', () => {
            expect(FieldValidator.isMACAddress('001ff35b2b1f', {}, { delimiter: 'any' })).toBe(true);
            expect(FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', {}, { delimiter: 'colon' })).toBe(true);
            expect(FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', {}, { delimiter: 'dash' })).toBe(true);
            expect(FieldValidator.isMACAddress('00 1f f3 5b 2b 1f', {}, { delimiter: 'space' })).toBe(true);
            expect(FieldValidator.isMACAddress('001f.f35b.2b1f', {}, { delimiter: 'dot' })).toBe(true);
            expect(FieldValidator.isMACAddress('001ff35b2b1f', {}, { delimiter: 'none' })).toBe(true);
            expect(FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', {}, { delimiter: 'colon' })).toBe(true);
            expect(FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f', {}, { delimiter: 'dash' })).toBe(false);
            expect(FieldValidator.isMACAddress('00 1f f3 5b 2b 1f', {}, { delimiter: 'colon' })).toBe(false);
            expect(FieldValidator.isMACAddress('001ff35b2b1f', {}, { delimiter: 'colon' })).toBe(false);
            expect(FieldValidator.isMACAddress('001ff35b2b1f', {}, { delimiter: 'colon' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isMACAddress(
                ['00 1f f3 5b 2b 1f', undefined],
                ['00 1f f3 5b 2b 1f', undefined],
                { delimiter: 'space' }
            )).toBe(true);
        });
    });

    describe('inNumberRange', () => {
        it('should return true if number in range', () => {
            expect(FieldValidator.inNumberRange(44, {}, { min: 0, max: 45 })).toBe(true);
            expect(FieldValidator.inNumberRange(-12, {}, { min: -100, max: 45 })).toBe(true);
            expect(FieldValidator.inNumberRange(0, {}, { max: 45 })).toBe(true);
            expect(FieldValidator.inNumberRange(0, {}, { min: -45 })).toBe(true);
        });

        it('should return false if number out of range', () => {
            expect(FieldValidator.inNumberRange(44, {}, { min: 0, max: 25 })).toBe(false);
            expect(FieldValidator.inNumberRange(-12, {}, { min: -10, max: 45 })).toBe(false);
            expect(FieldValidator.inNumberRange(0, {}, { max: -45 })).toBe(false);
            expect(FieldValidator.inNumberRange(0, {}, { min: 45 })).toBe(false);
            expect(FieldValidator.inNumberRange(45, {}, { min: 45 })).toBe(false);
            expect(FieldValidator.inNumberRange(0, {}, { min: 0 })).toBe(false);
            expect(FieldValidator.inNumberRange(-10, {}, { min: 0, max: 100 })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.inNumberRange(
                [0, 25, 33, 23, undefined],
                [0, 25, 33, 23, undefined],
                { min: 0, max: 45 }
            )).toBe(false);

            expect(FieldValidator.inNumberRange(
                [0, 25, 33, 23, undefined],
                [0, 25, 33, 23, undefined],
                { min: 0, max: 45, inclusive: true }
            )).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isNumber([1, 34, undefined])).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isInteger([1, 34, undefined])).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isString(['1', '34', undefined])).toBe(true);
        });
    });

    describe('isURL', () => {
        it('should return true for valid uris', () => {
            expect(FieldValidator.isURL('http://someurl.com')).toBe(true);
            expect(FieldValidator.isURL('http://someurl.com.uk')).toBe(true);
            expect(FieldValidator.isURL('https://someurl.cc.ru.ch')).toBe(true);
            expect(FieldValidator.isURL('ftp://someurl.bom:8080?some=bar&hi=bob')).toBe(true);
            expect(FieldValidator.isURL('http://xn--fsqu00a.xn--3lr804guic')).toBe(true);
            expect(FieldValidator.isURL('http://example.com/%E5%BC%95%E3%81%8D%E5%89%B2%E3%82%8A.html')).toBe(true);
        });

        it('should return false for invalid uris', () => {
            expect(FieldValidator.isURL('')).toBe(false);
            expect(FieldValidator.isURL('null')).toBe(false);
            expect(FieldValidator.isURL(true)).toBe(false);
            expect(FieldValidator.isURL({ url: 'http:thisisaurl.com' })).toBe(false);
            expect(FieldValidator.isURL(12345)).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isURL(['http://someurl.com', undefined])).toBe(true);
        });
    });

    describe('isUUID', () => {
        it('should return true for valid UUIDs', () => {
            expect(FieldValidator.isUUID('95ecc380-afe9-11e4-9b6c-751b66dd541e')).toBe(true);
            expect(FieldValidator.isUUID('0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B')).toBe(true);
            expect(FieldValidator.isUUID('123e4567-e89b-82d3-9456-426655440000')).toBe(true);
        });

        it('should return false for invalid UUIDs', () => {
            expect(FieldValidator.isUUID('')).toBe(false);
            expect(FieldValidator.isUUID('95ecc380:afe9:11e4:9b6c:751b66dd541e')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-x2d3-0456-426655440000')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-12d3-a456-42600')).toBe(false);
            expect(FieldValidator.isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B')).toBe(false);
            expect(FieldValidator.isUUID('123e4567-e89b-82d3-f456-426655440000')).toBe(false);
            expect(FieldValidator.isUUID(undefined)).toBe(false);
            expect(FieldValidator.isUUID('randomstring')).toBe(false);
            expect(FieldValidator.isUUID(true)).toBe(false);
            expect(FieldValidator.isUUID({})).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isUUID(['123e4567-e89b-82d3-a456-426655440000', undefined])).toBe(true);
        });
    });

    describe('contains', () => {
        it('should return true if string contains substring', () => {
            expect(FieldValidator.contains('hello', {}, { value: 'hello' })).toBe(true);
            expect(FieldValidator.contains('hello', {}, { value: 'll' })).toBe(true);
            expect(FieldValidator.contains('12345', {}, { value: '45' })).toBe(true);
        });

        it('should return false if string does not contain substring', () => {
            expect(FieldValidator.contains('hello', {}, { value: 'bye' })).toBe(false);
            expect(FieldValidator.contains(true, {}, { value: 'rue' })).toBe(false);
            expect(FieldValidator.contains(12345, {}, { value: '12' })).toBe(false);
            expect(FieldValidator.contains({}, {}, { value: 'hello' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.contains(
                ['12345', undefined],
                ['12345', undefined],
                { value: '45' }
            )).toBe(true);
        });
    });

    describe('guard', () => {
        it('should throw if undefined', () => {
            expect(FieldValidator.guard('hello')).toBe(true);
            expect(FieldValidator.guard(23423)).toBe(true);
            expect(FieldValidator.guard({ hello: 'world' })).toBe(true);
            expect(() => FieldValidator.guard(null)).toThrow();
            expect(() => FieldValidator.guard(undefined)).toThrow();
        });
    });

    describe('some', () => {
        it('should indicate if some elements of an array pass the validation', () => {
            expect(FieldValidator.some(
                ['hello', 3, { some: 'obj' }],
                ['hello', 3, { some: 'obj' }],
                { fn: 'isString' }
            )).toBe(true);
            expect(FieldValidator.some(
                ['hello', 3, { some: 'obj' }],
                ['hello', 3, { some: 'obj' }],
                { fn: 'isBoolean' }
            )).toBe(false);
        });
    });

    describe('every', () => {
        it('should indicate if every elements of an array pass the validation', () => {
            expect(FieldValidator.every(
                ['hello', 3, { some: 'obj' }],
                ['hello', 3, { some: 'obj' }],
                { fn: 'isString' }
            )).toBe(false);
            expect(FieldValidator.every(
                ['hello', 'world'],
                ['hello', 'world'],
                { fn: 'isString' }
            )).toBe(true);
        });
    });

    describe('isArray', () => {
        it('should indicate if an array was given', () => {
            expect(FieldValidator.isArray('hello')).toBe(false);
            expect(FieldValidator.isArray(23423)).toBe(false);
            expect(FieldValidator.isArray({ hello: 'world' })).toBe(false);
            expect(FieldValidator.isArray(null)).toBe(false);
            expect(FieldValidator.isArray(undefined)).toBe(false);
            expect(FieldValidator.isArray([1, 2, 3])).toBe(true);
            expect(FieldValidator.isArray([])).toBe(true);
        });
    });

    describe('exists', () => {
        it('should indicate if a value was given', () => {
            expect(FieldValidator.exists('hello')).toBe(true);
            expect(FieldValidator.exists(23423)).toBe(true);
            expect(FieldValidator.exists({ hello: 'world' })).toBe(true);
            expect(FieldValidator.exists(null)).toBe(false);
            expect(FieldValidator.exists(undefined)).toBe(false);
        });
    });

    describe('equals', () => {
        it('should return true if string is equal to a value', () => {
            expect(FieldValidator.equals('hello', {}, { value: 'hello' })).toBe(true);
            expect(FieldValidator.equals('false', {}, { value: 'false' })).toBe(true);
            expect(FieldValidator.equals('12345', {}, { value: '12345' })).toBe(true);
        });

        it('should return false if string is not equal to value', () => {
            expect(FieldValidator.equals('hello', {}, { value: 'llo' })).toBe(false);
            expect(FieldValidator.equals(true, {}, { value: 'true' })).toBe(false);
            expect(FieldValidator.equals(12345, {}, { value: '12345' })).toBe(false);
            expect(FieldValidator.equals({}, {}, { value: 'hello' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.equals(
                ['12345', undefined],
                ['12345', undefined],
                { value: '12345' }
            )).toBe(true);
        });
    });

    describe('isAlpha', () => {
        it('should return true if value is alpha characters', () => {
            expect(FieldValidator.isAlpha('ThiSisAsTRing')).toBe(true);
            expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', {}, { locale: 'pl-Pl' })).toBe(true);
        });

        it('should return false if value is not alpha characters', () => {
            expect(FieldValidator.isAlpha('ThiSisAsTRing%03$')).toBe(false);
            expect(FieldValidator.isAlpha('ThisiZĄĆĘŚŁ')).toBe(false);
            expect(FieldValidator.isAlpha(false)).toBe(false);
            expect(FieldValidator.isAlpha({})).toBe(false);
            expect(FieldValidator.isAlpha('1234ThisiZĄĆĘŚŁ', {}, { locale: 'pl-PL' })).toBe(false);
            expect(FieldValidator.isAlpha(['thisis a string'])).toBe(false);
            expect(FieldValidator.isAlpha('dude howdy')).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isAlpha(['ThiSisAsTRing', undefined])).toBe(true);
        });
    });

    describe('isAlphaNumeric', () => {
        it('should return true if string is all alphaNumeric chars for locale', () => {
            expect(FieldValidator.isAlphanumeric('alpha1234')).toBe(true);
            expect(FieldValidator.isAlphanumeric('1234')).toBe(true);
            expect(FieldValidator.isAlphanumeric('allalpa')).toBe(true);
            expect(FieldValidator.isAlphanumeric('فڤقکگ1234', {}, { locale: 'ku-IQ' })).toBe(true);
            expect(FieldValidator.isAlphanumeric('12343534', {}, { locale: 'ku-IQ' })).toBe(true);
            expect(FieldValidator.isAlphanumeric('فڤقک', {}, { locale: 'ku-IQ' })).toBe(true);
        });

        it('should return false if string is not alphaNumeric chars for locale', () => {
            expect(FieldValidator.isAlphanumeric('alpha1.23%4')).toBe(false);
            expect(FieldValidator.isAlphanumeric('فڤقکگ1234')).toBe(false);
            expect(FieldValidator.isAlphanumeric(false)).toBe(false);
            expect(FieldValidator.isAlphanumeric(123456)).toBe(false);
            expect(FieldValidator.isAlphanumeric({ string: 'somestring' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isAlphanumeric(['1234', 'allalpa', undefined])).toBe(true);
        });
    });

    describe('isASCII', () => {
        it('should return true if string is all ascii chars', () => {
            expect(FieldValidator.isASCII('sim,pleAscii\t8*7!@#"\n')).toBe(true);
            expect(FieldValidator.isASCII('\x03, \x5A~')).toBe(true);
        });

        it('should return false for not ascii strings', () => {
            expect(FieldValidator.isASCII(true)).toBe(false);
            expect(FieldValidator.isASCII({})).toBe(false);
            expect(FieldValidator.isASCII(12334)).toBe(false);
            expect(FieldValidator.isASCII('˜∆˙©∂ß')).toBe(false);
            expect(FieldValidator.isASCII('ڤقک')).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isASCII(['sim,pleAscii\t8*7!@#"\n', undefined])).toBe(true);
        });
    });

    describe('isBase64', () => {
        it('should return true for base64 strings', () => {
            expect(FieldValidator.isBase64('ZWFzdXJlLg==')).toBe(true);
            expect(FieldValidator.isBase64('YW55IGNhcm5hbCBwbGVhc3Vy')).toBe(true);
            expect(FieldValidator.isBase64('manufacturerUrl7')).toBe(true);
            expect(FieldValidator.isBase64('dHM_X2QlM0Qx')).toBe(false);
            expect(FieldValidator.isBase64('dHM_X2Q9MQo=')).toBe(false);
            expect(FieldValidator.isBase64('dHM/X2QlM0Qx')).toBe(true);
        });
        it('should return true for base64 strings with binary content', () => {
            // command to create base64 from a binary: echo 'test' | gzip | base64
            expect(FieldValidator.isBase64('H4sIAIb0jmYAAytJLS7hAgDGNbk7BQAAAA==')).toBe(true);
        });

        it('should return false for non-base64 strings', () => {
            expect(FieldValidator.isBase64('thisisjustastring')).toBe(false);
            expect(FieldValidator.isBase64(true)).toBe(false);
            expect(FieldValidator.isBase64([])).toBe(false);
            expect(FieldValidator.isBase64(123345)).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isBase64(['H4sIAI4Mj2YAAytJLS4x5AIAGzdZfAYAAAA=', 'H4sIAJEMj2YAAytJLS4x4gIA2GR0VwYAAAA='])).toBe(true);
            expect(FieldValidator.isBase64(['H4sIAEMFj2YAAytJLS4x5AIAGzdZfAYAAAA=', undefined])).toBe(true);
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty strings, object, and arrays', () => {
            expect(FieldValidator.isEmpty('')).toBe(true);
            expect(FieldValidator.isEmpty(undefined)).toBe(true);
            expect(FieldValidator.isEmpty(null)).toBe(true);
            expect(FieldValidator.isEmpty({})).toBe(true);
            expect(FieldValidator.isEmpty([])).toBe(true);
            expect(FieldValidator.isEmpty('     ', {}, { ignoreWhitespace: true })).toBe(true);
        });

        it('should return false for non-empty inputs', () => {
            expect(FieldValidator.isEmpty('not empty')).toBe(false);
            expect(FieldValidator.isEmpty({ a: 'something' })).toBe(false);
            expect(FieldValidator.isEmpty(['one', 2, 'three'])).toBe(false);
            expect(FieldValidator.isEmpty(['one', 'two', 'three'])).toBe(false);
            expect(FieldValidator.isEmpty('     ')).toBe(false);
        });

        it('should ignoreWhitespace', () => {
            const arrayData = ['one', 'two', 'three'];
            const stringData = '              ';

            expect(
                FieldValidator.isEmpty(arrayData, arrayData, { ignoreWhitespace: true })
            ).toBe(false);

            expect(FieldValidator.isEmpty(
                stringData, stringData, { ignoreWhitespace: true }
            )).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isFQDN(['john.com', undefined])).toBe(true);
        });
    });

    describe('isHash', () => {
        it('should return true for valid hash strings', () => {
            expect(FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', {}, { algo: 'md5' })).toBe(true);
            expect(FieldValidator.isHash('85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33', {}, { algo: 'sha256' })).toBe(true);
            expect(FieldValidator.isHash('98fc121ea4c749f2b06e4a768b92ef1c740625a0', {}, { algo: 'sha1' })).toBe(true);
        });

        it('should return false for invalid hash strings', () => {
            expect(FieldValidator.isHash('6201b3d18157e00963fcf008c1e', {}, { algo: 'md5' })).toBe(false);
            expect(FieldValidator.isHash('85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c107e33', {}, { algo: 'sha256' })).toBe(false);
            expect(FieldValidator.isHash('98fc121easdfasdfasdfads749f2b06e4a768b92ef1c740625a0', {}, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash(12345, {}, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash(true, {}, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash([], {}, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash('', {}, { algo: 'sha1' })).toBe(false);
            expect(FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', {}, { algo: 'sha1' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isHash(
                ['6201b3d1815444c87e00963fcf008c1e', undefined],
                ['6201b3d1815444c87e00963fcf008c1e', undefined],
                { algo: 'md5' }
            )).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isCountryCode(['US', undefined])).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isISO8601(['2020-01-01T12:03:03', undefined])).toBe(true);
        });
    });

    describe('isISSN', () => {
        it('should return true for valid ISSN numbers', () => {
            expect(FieldValidator.isISSN('0378-5955')).toBe(true);
            expect(FieldValidator.isISSN('03785955')).toBe(true);
            expect(FieldValidator.isISSN('0378-5955', {}, { requireHyphen: true })).toBe(true);
            expect(FieldValidator.isISSN('0000-006x')).toBe(true);
            expect(FieldValidator.isISSN('0000-006X', {}, { requireHyphen: true, caseSensitive: true })).toBe(true);
        });

        it('should return false for invalid ISSN numbers', () => {
            expect(FieldValidator.isISSN('0375955')).toBe(false);
            expect(FieldValidator.isISSN('03785955', {}, { requireHyphen: true })).toBe(false);
            expect(FieldValidator.isISSN('0000-006x', {}, { caseSensitive: true })).toBe(false);
            expect(FieldValidator.isISSN('0000-006x', {}, { caseSensitive: true })).toBe(false);
            expect(FieldValidator.isISSN('hellothere')).toBe(false);
            expect(FieldValidator.isISSN(123456)).toBe(false);
            expect(FieldValidator.isISSN(true)).toBe(false);
            expect(FieldValidator.isISSN([])).toBe(false);
            expect(FieldValidator.isISSN('')).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isISSN(['03785955', undefined])).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isRFC3339(['2020-01-01T12:05:05Z', undefined])).toBe(true);
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

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isJSON(['{ "bob": "gibson" }', undefined])).toBe(true);
        });
    });

    describe('isLength', () => {
        it('should return true for strings of length or strings within length min/ max', () => {
            expect(FieldValidator.isLength('astring', {}, { size: 7 })).toBe(true);
            expect(FieldValidator.isLength('astring', {}, { min: 4 })).toBe(true);
            expect(FieldValidator.isLength('astring', {}, { max: 10 })).toBe(true);
            expect(FieldValidator.isLength('astring', {}, { min: 5, max: 10 })).toBe(true);
            expect(FieldValidator.isLength('astring', {}, { min: 7, max: 10 })).toBe(true);
            expect(FieldValidator.isLength('astring', {}, { min: 5, max: 7 })).toBe(true);
        });

        it('should return false for strings not of length or strings outside length min/ max', () => {
            expect(FieldValidator.isLength('astring', {}, { size: 5 })).toBe(false);
            expect(FieldValidator.isLength('astring', {}, { min: 8 })).toBe(false);
            expect(FieldValidator.isLength('astring', {}, { max: 6 })).toBe(false);
            expect(FieldValidator.isLength('astring', {}, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(true, {}, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(['astring'], {}, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(undefined, {}, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength(1234, {}, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength({ string: 'astring' }, {}, { min: 1, max: 5 })).toBe(false);
            expect(FieldValidator.isLength('astring', {}, {})).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isLength(
                ['astring', undefined],
                ['astring', undefined],
                { min: 5, max: 10 }
            )).toBe(true);
        });
    });

    describe('isMIMEType', () => {
        it('should return true for valid mime/ media types', () => {
            expect(FieldValidator.isMIMEType('application/javascript')).toBe(true);
            expect(FieldValidator.isMIMEType('application/graphql')).toBe(true);
            expect(FieldValidator.isMIMEType('text/html')).toBe(true);
            expect(FieldValidator.isMIMEType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
        });

        it('should return false for invalid mime/ media types', () => {
            expect(FieldValidator.isMIMEType('application')).toBe(false);
            expect(FieldValidator.isMIMEType('')).toBe(false);
            expect(FieldValidator.isMIMEType(false)).toBe(false);
            expect(FieldValidator.isMIMEType({})).toBe(false);
            expect(FieldValidator.isMIMEType(12345)).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isMIMEType(['application/javascript', undefined])).toBe(true);
        });
    });

    describe('isPostalCode', () => {
        it('should return true for valid postal codes', () => {
            expect(FieldValidator.isPostalCode('85249', {}, { locale: 'any' })).toBe(true);
            expect(FieldValidator.isPostalCode('852', {}, { locale: 'IS' })).toBe(true);
            expect(FieldValidator.isPostalCode('885 49', {}, { locale: 'SE' })).toBe(true);
        });

        it('should return false for invalid postal codes', () => {
            expect(FieldValidator.isPostalCode('', {}, { locale: 'any' })).toBe(false);
            expect(FieldValidator.isPostalCode('85249', {}, { locale: 'ES' })).toBe(false);
            expect(FieldValidator.isPostalCode(123345, {}, { locale: 'ES' })).toBe(false);
            expect(FieldValidator.isPostalCode({}, {}, { locale: 'ES' })).toBe(false);
            expect(FieldValidator.isPostalCode('8522-342', {}, { locale: 'IS' })).toBe(false);
            expect(FieldValidator.isPostalCode('885%49', {}, { locale: 'SE' })).toBe(false);
            expect(FieldValidator.isPostalCode(true, {}, { locale: 'any' })).toBe(false);
            expect(FieldValidator.isPostalCode(null, {}, { locale: 'ES' })).toBe(false);
        });

        it('validates an array of values, ignores undefined/null', () => {
            expect(FieldValidator.isPostalCode(
                ['852', undefined],
                ['852', undefined],
                { locale: 'IS' }
            )).toBe(true);
        });
    });
});
