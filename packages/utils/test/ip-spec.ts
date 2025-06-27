import 'jest-extended';

import {
    isIP,
    isIPv6,
    isIPv4,
    isCIDR,
    inIPRange,
    isRoutableIP,
    isNonRoutableIP,
    reverseIP,
    isMappedIPv4,
    extractMappedIPv4,
    ipToInt,
    intToIP,
    getCIDRMin,
    getCIDRMax,
    getCIDRBroadcast,
    getCIDRNetwork,
    toCIDR,
    getFirstIPInCIDR,
    getLastIPInCIDR,
    shortenIPv6Address,
    getFirstUsableIPInCIDR,
    getLastUsableIPInCIDR
} from '../src/ip.js';

describe('IP Utils', () => {
    describe('isIP', () => {
        test.each([
            ['8.8.8.8', true],
            ['192.172.1.18', true],
            ['11.0.1.18', true],
            ['2001:db8::1', true],
            ['2001:db8:85a3:8d3:1319:8a2e:370:7348', true],
            ['fe80::1ff:fe23:4567:890a%eth2', true],
            ['2001:DB8::1', true],
            ['fc00:db8::1', true],
            ['FC00:DB8::1', true],
            ['::192.168.1.18', true],
            ['::FFFF:12.155.166.101', true]
        ])('should return true for valid ip address', (input, expected) => {
            expect(isIP(input)).toEqual(expected);
        });

        test.each([
            ['NA', false],
            ['', false],
            ['172.394.0.1', false],
            [undefined, false],
            ['ZXXY:db8:85a3:8d3:1319:8a2e:370:7348', false],
            ['11.222.33.001', false],
            ['87', false],
            ['02751178', false],
            [true, false],
            [{}, false],
            [[], false],
            [123456678, false],
            [12.4345, false]
        ])('should return false for invalid ip address', (input, expected) => {
            expect(isIP(input)).toEqual(expected);
        });
    });

    describe('isIPv6', () => {
        test.each([
            ['2001:db8::1', true],
            ['2001:db8:85a3:8d3:1319:8a2e:370:7348', true],
            ['fe80::1ff:fe23:4567:890a%eth2', true],
            ['2001:DB8::1', true],
            ['fc00:db8::1', true],
            ['FC00:DB8::1', true],
            ['::192.168.1.18', true],
            ['::FFFF:12.155.166.101', true]
        ])('should return true for valid ipv6 address', (input, expected) => {
            expect(isIPv6(input)).toEqual(expected);
        });

        test.each([
            ['8.8.8.8', false],
            ['', false],
            ['172.394.0.1', false],
            [undefined, false],
            ['ZXXY:db8:85a3:8d3:1319:8a2e:370:7348', false],
            ['02751178', false],
            [true, false],
            [123456678, false],
        ])('should return false for invalid ipv6 address', (input, expected) => {
            expect(isIPv6(input)).toEqual(expected);
        });
    });

    describe('isIPv4', () => {
        test.each([
            ['8.8.8.8', true],
            ['192.172.1.18', true],
            ['11.0.1.18', true],
        ])('should return true for valid ipv6 address', (input, expected) => {
            expect(isIPv4(input)).toEqual(expected);
        });

        test.each([
            ['172.394.0.1', false],
            [undefined, false],
            ['ZXXY:db8:85a3:8d3:1319:8a2e:370:7348', false],
            ['02751178', false],
            [true, false],
            [1234.56678, false],
            ['fc00:db8::1', false],
            ['::192.168.1.18', false],
            ['::FFFF:12.155.166.101', false]
        ])('should return false for invalid ipv6 address', (input, expected) => {
            expect(isIPv4(input)).toEqual(expected);
        });
    });

    describe('isCIDR', () => {
        test.each([
            ['1.2.3.4/32', true],
            ['8.8.0.0/12', true],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/128', true],
            ['2001::1234:5678/128', true]
        ])('should return true for valid ip range in CIDR notation', (input, expected) => {
            expect(isCIDR(input)).toEqual(expected);
        });

        test.each([
            ['1.2.3.4/128', false],
            ['notanipaddress/12', false],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/412', false],
            ['2001::1234:5678/b', false],
            ['8.8.8.10', false],
            [true, false],
            [{}, false],
        ])('should return false for an invalid ip range in CIDR notation', (input, expected) => {
            expect(isCIDR(input)).toEqual(expected);
        });
    });

    describe('inIPRange', () => {
        test.each([
            ['8.8.8.8', '8.8.8.0/24', true],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678', '2001:0db8:0123:4567:89ab:cdef:1234:0/112', true],
            ['8.8.10.8', '8.8.8.0/24', false],
            ['2001:0dff:0123:4567:89ab:cdef:1234:5678', '2001:0db8:0123:4567:89ab:cdef:1234:0/112', false],
            ['2001:0dff:0123:4567:89ab:cdef:1234:5678', 'badCidrInfo', false]
        ])('should return true if ip address is in specified CIDR range', (input, cidr, expected) => {
            expect(inIPRange(input, { cidr })).toEqual(expected);
        });

        test.each([
            ['8.8.8.8', '8.8.8.0', '8.8.8.64', true],
            ['8.8.8.0', '8.8.8.0', '8.8.8.64', true],
            ['fd00::b000', 'fd00::123', 'fd00::ea00', true],
            ['8.8.8.8', '8.8.8.9', '8.8.8.64', false],
            ['fd00::b000', 'fd00::d000', 'fd00::ea00', false],
            ['fd00::b000', 'fd00::d000', 'badIPAddress', false],
            ['fd00::b000', 'badIPaddress', 'fd00::ea00', false],
        ])('should return true if ip address is between min, max', (input, min, max, expected) => {
            expect(inIPRange(input, { min, max })).toEqual(expected);
        });

        test.each([
            ['8.8.8.8', '8.8.8.0', true],
            ['fd00::b000', 'fd00::a000', true],
            ['8.8.4.8', '8.8.8.0', false],
            ['fd00::a000', 'fd00::a1da', false],
            ['fd00::a000', 'badIpAddress', false],
        ])('should return true if ip address is higher than min', (input, min, expected) => {
            expect(inIPRange(input, { min })).toEqual(expected);
        });

        test.each([
            ['8.8.8.8', '8.8.8.10', true],
            ['fd00::b000', 'fd00::b009', true],
            ['8.8.8.11', '8.8.8.10', false],
            ['fd00::b0ff', 'fd00::b009', false],
            ['fd00::b0ff', 'badIpAddress', false],
        ])('should return true if ip address is lower than max', (input, max, expected) => {
            expect(inIPRange(input, { max })).toEqual(expected);
        });
    });

    describe('isRoutableIP', () => {
        test.each([
            ['8.8.8.8', true],
            ['172.35.12.18', true],
            ['192.172.1.18', true],
            ['11.0.1.18', true],
            ['::2', true],
            ['::abcd', true],
            ['65:ff9b::ffff:ffff', true],
            ['99::', true],
            ['faff::12bc', true],
            ['2620:4f:123::', true],
            ['2003::', true],
            ['fe79::ffff', true],
            ['2001:2ff::ffff', true],
            ['::FFFF:12.155.166.101', true],
            ['::ffff:4.108.10.2', true],
            ['0.0.0.1', false],
            ['0.220.5.132', false],
            ['0.0.0.0', false],
            ['10.0.0.1', false],
            ['10.22.23.123', false],
            ['100.64.123.123', false],
            ['100.127.255.250', false],
            ['127.0.0.1', false],
            ['127.230.10.19', false],
            ['169.254.0.1', false],
            ['169.254.250.127', false],
            ['172.16.0.1', false],
            ['172.31.250.192', false],
            ['192.0.0.1', false],
            ['192.0.0.254', false],
            ['192.0.2.1', false],
            ['192.0.2.182', false],
            ['192.31.196.1', false],
            ['192.31.196.254', false],
            ['192.52.193.1', false],
            ['192.52.193.254', false],
            ['192.88.99.1', false],
            ['192.88.99.254', false],
            ['192.168.0.1', false],
            ['192.168.255.254', false],
            ['192.175.48.1', false],
            ['192.175.48.254', false],
            ['198.18.0.1', false],
            ['198.19.255.254', false],
            ['198.51.100.1', false],
            ['198.51.100.254', false],
            ['203.0.113.1', false],
            ['203.0.113.254', false],
            ['240.0.0.1', false],
            ['255.255.255.254', false],
            ['255.255.255.255', false],
            ['224.0.0.1', false],
            ['224.255.255.254', false],
            ['::1', false],
            ['::', false],
            ['64:ff9b::', false],
            ['64:ff9b::ffff:ffff', false],
            ['64:ff9b:1::', false],
            ['64:ff9b:1:ffff:ffff:ffff:ffff:ffff', false],
            ['100::', false],
            ['100::ffff:ffff:ffff:ffff', false],
            ['2001::', false],
            ['2001:1ff:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:0:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:1::1', false],
            ['2001:1::2', false],
            ['2001:2::', false],
            ['2001:2:0:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:3::', false],
            ['2001:3:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:4:112::', false],
            ['2001:4:112:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:10::', false],
            ['2001:1f:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:20::', false],
            ['2001:2f:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2001:db8::', false],
            ['2001:db8:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2002::', false],
            ['2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['2620:4f:8000::', false],
            ['2620:4f:8000:ffff:ffff:ffff:ffff:ffff', false],
            ['fc00::', false],
            ['fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['fe80::', false],
            ['febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff', false],
            ['::FFFF:192.52.193.1', false],
            ['::192.168.1.18', false],
            ['::ffff:0.0.0.0', false],
            ['badIpAddress', false]
        ])('should return true for routable ip addresses', (input, expected) => {
            expect(isRoutableIP(input)).toEqual(expected);
        });
    });

    describe('isNonRoutableIP', () => {
        test.each([
            ['192.168.0.1', true],
            ['10.16.32.210', true],
            ['172.18.12.74', true],
            ['fc00:db8::1', true],
            ['10.1.3.4', true],
            ['172.28.4.1', true],
            ['127.0.1.2', true],
            ['2001:db8::1', true],
            ['2001:3:ffff:ffff:ffff:ffff:ffff:ffff', true],
            ['192.88.99.1', true],
            ['2001:2::', true],
            ['8.8.8.8', false],
            ['172.194.0.1', false],
            ['badIpaddress', false],
            ['2001:2ff::ffff', false],
        ])('return true for non-routable ip addresses', (input, expected) => {
            expect(isNonRoutableIP(input)).toEqual(expected);
        });
    });

    describe('reverseIP', () => {
        test.each([
            ['10.16.32.210', '210.32.16.10'],
            ['8.15.2.4', '4.2.15.8'],
            ['2001:0db8:0000:0000:0000:8a2e:0370:7334', '4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2'],
            ['2607:f8b0:4009:816::200e', 'e.0.0.2.0.0.0.0.0.0.0.0.0.0.0.0.6.1.8.0.9.0.0.4.0.b.8.f.7.0.6.2'],
            ['2001:2::', '0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.1.0.0.2']
        ])('reverses the ip handles both ipv4 and ipv6 formats', (input, expected) => {
            expect(reverseIP(input)).toEqual(expected);
        });

        it('should throw if input is an invalid ip address', () => {
            expect(() => {
                reverseIP('bad ip address');
            }).toThrow('input must be a valid ip address');
        });
    });

    describe('ipToInt', () => {
        test.each([
            ['10.16.32.210', BigInt(168829138)],
            ['2001:0db8:0000:0000:0000:8a2e:0370:7334', BigInt('42540766411282592856904136881884656436')],
            ['2001:2::', BigInt('42540488320432167789079031612388147200')]
        ])('Convert IPv4 and IPv6 addresses to a big int', (input, expected) => {
            expect(ipToInt(input)).toEqual(expected);
        });

        it('should throw an error if valid is a bad ip address', () => {
            expect(() => {
                ipToInt('bad ip address');
            }).toThrow('input must be a valid ip address');
        });
    });

    describe('intToIP', () => {
        test.each([
            ['168829138', 4, '10.16.32.210'],
            ['168829138', '4', '10.16.32.210'],
            [168829138, '4', '10.16.32.210'],
            ['42540488320432167789079031612388147200', 6, '2001:2::'],
            [BigInt('42540488320432167789079031612388147200'), '6', '2001:2::'],
        ])('Convert IPv4 and IPv6 addresses to a big int', (input, version, expected) => {
            expect(intToIP(input, version)).toEqual(expected);
        });

        it('should throw an error if input is a bad ip address', () => {
            expect(() => {
                intToIP('bad ip address', 4);
            }).toThrow('input should be a big int or string for large numbers. Version must be 4 or 6');
        });

        it('should throw an error if version is wrong', () => {
            expect(() => {
                intToIP('168829138', 10);
            }).toThrow('input should be a big int or string for large numbers. Version must be 4 or 6');
        });
    });

    describe('isMappedIPv4', () => {
        test.each([
            ['::FFFF:192.52.193.1', true],
            ['::122.168.5.18', true],
            ['::ffff:10.2.1.18', true],
            ['10.16.32.210', false],
            ['2607:f8b0:4009:816::200e', false],
            ['bad ip address', false],
        ])('reverses the ip handles both ipv4 and ipv6 formats', (input, expected) => {
            expect(isMappedIPv4(input)).toEqual(expected);
        });
    });

    describe('extractMappedIPv4', () => {
        test.each([
            ['::FFFF:192.52.193.1', '192.52.193.1'],
            ['::122.168.5.18', '122.168.5.18'],
            ['::ffff:10.2.1.18', '10.2.1.18']
        ])('reverses the ip handles both ipv4 and ipv6 formats', (input, expected) => {
            expect(extractMappedIPv4(input)).toEqual(expected);
        });

        it('should throw if input is not a IPv4 mapped address', () => {
            expect(() => {
                extractMappedIPv4('10.16.32.210');
            }).toThrow('input must be an IPv4 address mapped to an IPv6 address');
        });

        it('should throw if input is an invalid ip address', () => {
            expect(() => {
                extractMappedIPv4('bad ip address');
            }).toThrow('input must be an IPv4 address mapped to an IPv6 address');
        });
    });

    describe('getCIDRMin', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.1'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/128', '2001:db8:123:4567:89ab:cdef:1234:5678'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/46', '2001:db8:120::1']
        ])('returns the min ip value in a CIDR range', (input, expected) => {
            expect(getCIDRMin(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getCIDRMin('bad ip address');
            }).toThrow('input must be a valid IP address in CIDR notation');
        });
    });

    describe('getCIDRMax', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.254'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/46', '2001:db8:123:ffff:ffff:ffff:ffff:ffff']
        ])('returns the max ip value in a CIDR range', (input, expected) => {
            expect(getCIDRMax(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getCIDRMax('bad ip address');
            }).toThrow('input must be a valid IP address in CIDR notation');
        });
    });

    describe('getFirstIPInCIDR', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.0'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/128', '2001:db8:123:4567:89ab:cdef:1234:5678'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/46', '2001:db8:120::']
        ])('returns the min ip value in a CIDR range', (input, expected) => {
            expect(getFirstIPInCIDR(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getFirstIPInCIDR('bad ip address');
            }).toThrow('input must be a valid IP address in CIDR notation');
        });
    });

    describe('getLastIPInCIDR', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.255'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/46', '2001:db8:123:ffff:ffff:ffff:ffff:ffff']
        ])('returns the max ip value in a CIDR range', (input, expected) => {
            expect(getLastIPInCIDR(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getLastIPInCIDR('bad ip address');
            }).toThrow('input must be a valid IP address in CIDR notation');
        });
    });

    describe('getFirstUsableIPInCIDR', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.1'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/128', '2001:db8:123:4567:89ab:cdef:1234:5678'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/46', '2001:db8:120::1']
        ])('returns the min ip value in a CIDR range', (input, expected) => {
            expect(getFirstUsableIPInCIDR(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getFirstUsableIPInCIDR('bad ip address');
            }).toThrow('input must be a valid IP address in CIDR notation');
        });
    });

    describe('getLastUsableIPInCIDR', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.254'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678/46', '2001:db8:123:ffff:ffff:ffff:ffff:ffff']
        ])('returns the max ip value in a CIDR range', (input, expected) => {
            expect(getLastUsableIPInCIDR(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getLastUsableIPInCIDR('bad ip address');
            }).toThrow('input must be a valid IP address in CIDR notation');
        });
    });

    describe('shortenIPv6Address', () => {
        test.each([
            ['2001:0db8:0123:4567:0000:0000:0000:5678', '2001:db8:123:4567::5678'],
            ['1.2.3.4', '1.2.3.4']
        ])('returns the address in short form', (input, expected) => {
            expect(shortenIPv6Address(input)).toEqual(expected);
        });

        it('should throw if input is an invalid address', () => {
            expect(() => {
                shortenIPv6Address('bad ip address');
            }).toThrow('input must be a valid address');
        });
    });

    describe('getCIDRBroadcast', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.255'],
        ])('returns the broadcast ip address in an IPv4 CIDR range', (input, expected) => {
            expect(getCIDRBroadcast(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getCIDRBroadcast('bad ip address');
            }).toThrow('input must be a valid IPv4 address in CIDR notation');
        });

        it('should throw if input is an IPv6 CIDR', () => {
            expect(() => {
                getCIDRBroadcast('2001:0db8:0123:4567:89ab:cdef:1234:5678/46');
            }).toThrow('input must be a valid IPv4 address in CIDR notation');
        });
    });

    describe('getCIDRNetwork', () => {
        test.each([
            ['1.2.3.4/32', '1.2.3.4'],
            ['8.8.12.118/24', '8.8.12.0'],
        ])('returns the network ip address in an IPv4 CIDR range', (input, expected) => {
            expect(getCIDRNetwork(input)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                getCIDRNetwork('bad ip address');
            }).toThrow('input must be a valid IPv4 address in CIDR notation');
        });

        it('should throw if input is an IPv6 CIDR', () => {
            expect(() => {
                getCIDRNetwork('2001:0db8:0123:4567:89ab:cdef:1234:5678/46');
            }).toThrow('input must be a valid IPv4 address in CIDR notation');
        });
    });

    describe('toCIDR', () => {
        test.each([
            ['1.2.3.4', '32', '1.2.3.4/32'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678', 128, '2001:db8:123:4567:89ab:cdef:1234:5678/128'],
            ['1.2.3.4', '24', '1.2.3.0/24'],
            ['2001:0db8:0123:4567:89ab:cdef:1234:5678', 46, '2001:db8:120::/46'],
            ['1.2.3.4', '0', '0.0.0.0/0'],
        ])('returns the network ip address in an IPv4 CIDR range', (input, suffix, expected) => {
            expect(toCIDR(input, suffix)).toEqual(expected);
        });

        it('should throw if input is an invalid CIDR', () => {
            expect(() => {
                toCIDR('bad ip address', 6);
            }).toThrow('input must be a valid IP address and suffix must be a value <= 32 for IPv4 or <= 128 for IPv6');
        });

        it('should throw if suffix is an invalid number', () => {
            expect(() => {
                toCIDR('2001:0db8:0123:4567:89ab:cdef:1234:5678', 223);
            }).toThrow('input must be a valid IP address and suffix must be a value <= 32 for IPv4 or <= 128 for IPv6');
        });
    });
});
