import 'jest-extended';
import { AssetRecord } from '@terascope/types';
import {
    toSemverRange, findMatchingAsset,
    getMajorVersion, toVersionQuery,
    findSimilarAssets, getInCompatibilityReason,
    addExternalStorageStatus,
} from '../../src/lib/utils/asset_utils.js';

describe('Asset Utils', () => {
    describe('->addExternalStorageStatus', () => {
        const s3List = [
            { File: '123.zip', Size: 12345 },
            { File: 'abc.zip', Size: 56873 },
            { File: 'foo.zip', Size: 1 },
        ];

        it('sets "available" on the records whose zip is in the bucket', () => {
            const records = [
                { id: '123', name: 'asset-123' },
                { id: 'abc', name: 'asset-abc' },
                { id: 'foo', name: 'foo-asset' },
            ];

            expect(addExternalStorageStatus(s3List, records)).toEqual([
                { id: '123', name: 'asset-123', external_storage: 'available' },
                { id: 'abc', name: 'asset-abc', external_storage: 'available' },
                { id: 'foo', name: 'foo-asset', external_storage: 'available' },
            ]);
        });

        it('sets "missing" on the records whose zip is not in the bucket', () => {
            const records = [{ id: '50000' }, { id: 'abc' }];

            expect(addExternalStorageStatus(s3List, records)).toEqual([
                { id: '50000', external_storage: 'missing' },
                { id: 'abc', external_storage: 'available' },
            ]);
        });

        it('only matches the ".zip" objects, by their name without the extension', () => {
            const records = [{ id: 'bar' }, { id: 'bar.zip' }];

            expect(addExternalStorageStatus([{ File: 'bar.txt' }, { File: 'bar.zip.zip' }], records))
                .toEqual([
                    { id: 'bar', external_storage: 'missing' },
                    { id: 'bar.zip', external_storage: 'available' },
                ]);
        });

        it('sets "missing" on every record when the bucket is empty', () => {
            expect(addExternalStorageStatus([], [{ id: '123' }])).toEqual([
                { id: '123', external_storage: 'missing' },
            ]);
        });

        it('does not change the input records', () => {
            const records = [{ id: '123' }];
            addExternalStorageStatus(s3List, records);
            expect(records).toEqual([{ id: '123' }]);
        });
    });

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
            ['12.34*.55', 'version:12.34*.55'],
            ['12.34.*', 'version:>=12.34.0 AND version:<12.35.0-0'],
            ['12.34.5*', 'version:12.34.5*'],
        ])('should convert %p to %p', (input, output) => {
            expect(toVersionQuery(input)).toEqual(output);
        });
    });

    const wrongPlatform: Record<string, NodeJS.Platform> = {
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
    },
    {
        id: 'foo-2',
        name: 'foo',
        version: '2.0.0',
        platform: process.platform,
        arch: process.arch,
        node_version: currentNodeVersion,
    },
    {
        id: 'foo-3',
        name: 'foo',
        version: '2.0.1',
        platform: wrongPlatform[process.platform],
        arch: process.arch,
        node_version: currentNodeVersion,
    },
    {
        id: 'foo-4',
        name: 'foo',
        version: '2.0.2',
        platform: process.platform,
        arch: process.arch,
        node_version: currentNodeVersion + 1,
    },
    {
        id: 'foo-5',
        name: 'foo',
        version: '1.0.0',
        platform: process.platform,
        arch: process.arch,
        node_version: currentNodeVersion,
    },
    {
        id: 'foo-6',
        name: 'foo',
        version: '1.0.0',
        node_version: currentNodeVersion,
    }] as AssetRecord[];

    describe('->findMatchingAsset', () => {
        test.each([
            ['foo',
                'latest',
                {
                    version: '2.0.1'
                }],
            ['foo',
                '2.0.0',
                {
                    version: '2.0.0'
                }],
            ['foo',
                '~2.0.0',
                {
                    version: '2.0.1'
                }],
            ['foo',
                '1.*',
                {
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
