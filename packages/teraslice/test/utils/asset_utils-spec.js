'use strict';

const {
    toSemverRange, findMatchingAsset,
    getMajorVersion
} = require('../../lib/utils/asset_utils');

describe('Asset Utils', () => {
    describe('->toSemverRange', () => {
        test.each([
            ['latest', '*'],
            [null, '*'],
            ['^22.0.0', '^22.0.0'],
            ['~22.0.0', '~22.0.0'],
            ['2.0.0', '2.0.0'],
            ['*', '*'],
            ['1.*', '1.*'],
            ['2.*', '2.*'],
            ['2222.*', '2222.*'],
            ['12.*.1', '12.*.1'],
            ['12.34*.55', '12.34*.55'],
            ['12.34.*', '12.34.*'],
            ['12.34.5*', '12.34.5*'],
        ])('should convert %p to %p', (input, output) => {
            expect(toSemverRange(input)).toEqual(output);
        });
    });

    describe('->findMatchingAsset', () => {
        const wrongPlatform = {
            darwin: 'linux',
            linux: 'darwin',
        };

        const currentNodeVersion = getMajorVersion(process.version);

        const assets = [{
            id: 'foo-1',
            name: 'foo',
            version: '2.0.1',
            platform: process.platform,
            arch: process.arch,
            node_version: currentNodeVersion,
        }, {
            id: 'foo-2',
            name: 'foo',
            version: '2.0.0',
            platform: process.platform,
            arch: process.arch,
            node_version: currentNodeVersion,
        }, {
            id: 'foo-3',
            name: 'foo',
            version: '2.0.1',
            platform: wrongPlatform[process.platform],
            arch: process.arch,
            node_version: currentNodeVersion,
        }, {
            id: 'foo-4',
            name: 'foo',
            version: '2.0.2',
            platform: process.platform,
            arch: process.arch,
            node_version: currentNodeVersion + 1,
        }, {
            id: 'foo-5',
            name: 'foo',
            version: '1.0.0',
            platform: process.platform,
            arch: process.arch,
            node_version: currentNodeVersion,
        }, {
            id: 'foo-6',
            name: 'foo',
            version: '1.0.0',
            node_version: currentNodeVersion,
        }];

        test.each([
            ['foo', 'latest', {
                version: '2.0.1'
            }],
            ['foo', '2.0.0', {
                version: '2.0.0'
            }],
            ['foo', '~2.0.0', {
                version: '2.0.1'
            }],
            ['foo', '1.*', {
                version: '1.0.0'
            }],
            ['foo', '0.1.0', null],
            ['foo', '0.1.*', null],
        ])('should return the correct result for %s:%s', (name, version, result) => {
            if (result == null) {
                expect(findMatchingAsset(assets, name, version)).toBeNil();
            } else {
                expect(findMatchingAsset(assets, name, version)).toMatchObject(result);
            }
        });
    });
});
