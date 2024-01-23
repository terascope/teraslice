import 'jest-extended';
import { AssetRecord } from '@terascope/types';
import {
    toSemverRange, findMatchingAsset,
    getMajorVersion, toVersionQuery,
    findSimilarAssets, getInCompatibilityReason,
} from '../../src/lib/utils/asset_utils.js';

describe('Asset Utils', () => {
    describe('->toSemverRange', () => {
        test.each([
            ['latest', '*'],
            [null, '*'],
            ['^22.0.0', '^22.0.0'],
            ['~22.0.0', '~22.0.0'],
            ['2.0.0', '2.0.0'],
            ['v2.0.0', '2.0.0'],
            ['*', '*'],
            ['1.*', '1.*'],
            ['2.*', '2.*'],
            ['2222.*', '2222.*'],
            ['12.*.1', '12.*.1'],
            ['12.34*.55', '12.34*.55'],
            ['12.34.*', '12.34.*'],
            ['12.34.5*', '12.34.5*'],
        ])('should convert %p to %p', (input: string | null, output: string) => {
            expect(toSemverRange(input)).toEqual(output);
        });
    });

    describe('->toVersionQuery', () => {
        test.each([
            ['latest', 'version:*'],
            [null, 'version:*'],
            ['^22.0.0', 'version:>=22.0.0 AND version:<23.0.0-0'],
            ['~22.0.0', 'version:>=22.0.0 AND version:<22.1.0-0'],
            ['2.0.0', 'version:2.0.0'],
            ['v1.1.1', 'version:1.1.1'],
            ['*', 'version:*'],
            ['1.*', 'version:>=1.0.0 AND version:<2.0.0-0'],
            ['2.*', 'version:>=2.0.0 AND version:<3.0.0-0'],
            ['2222.*', 'version:>=2222.0.0 AND version:<2223.0.0-0'],
            ['12.*.1', 'version:>=12.0.0 AND version:<13.0.0-0'],
            ['12.34*.55', 'version:12.34*.55'],
            ['12.34.*', 'version:>=12.34.0 AND version:<12.35.0-0'],
            ['12.34.5*', 'version:12.34.5*'],
        ])('should convert %p to %p', (input, output) => {
            expect(toVersionQuery(input)).toEqual(output);
        });
    });

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
    }] as AssetRecord[];

    describe('->findMatchingAsset', () => {
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

    describe('->getInCompatibilityReason/->findSimilarAssets', () => {
        test.each([
            ['foo', 'latest', 'node_version or platform mismatch'],
            ['foo', '2.0.1', 'platform mismatch'],
            ['foo', '~2.0.0', 'node_version or platform mismatch'],
            ['foo', '3.*', ''],
            ['foo', '0.1.*', ''],
        ])('should return the correct result for %s:%s', (name, version, result) => {
            const reason = getInCompatibilityReason(findSimilarAssets(assets, name, version));
            expect(reason).toEqual(result);
        });
    });
});
