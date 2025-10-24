import 'jest-extended';
import nock from 'nock';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import decompress from 'decompress';
import { newTestJobConfig, uniqBy } from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';
import { WorkerTestHarness, DownloadExternalAsset } from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('download-external-asset', () => {
    const build = `node-${process.version.split('.', 1)[0].slice(1)}-${os.platform()}-${os.arch()}`;

    const releasesJson = [
        {
            tag_name: 'v1.0.0',
            name: 'Jungle Processors',
            draft: false,
            prerelease: false,
            assets: uniqBy([
                {
                    name: 'jungle-v1.0.0-node-10-linux-x64.zip',
                    url: 'https://api.github.com/files/jungle-v1.0.0-node-10-linux-x64.zip'
                },
                {
                    name: 'jungle-v1.0.0-node-10-darwin-x64.zip',
                    url: 'https://api.github.com/files/jungle-v1.0.0-node-10-darwin-x64.zip'
                },
                {
                    name: 'jungle-v1.0.0-node-12-linux-x64.zip',
                    url: 'https://api.github.com/files/jungle-v1.0.0-node-12-linux-x64.zip'
                },
                {
                    name: `jungle-v1.0.0-${build}.zip`,
                    url: `https://api.github.com/files/jungle-v1.0.0-${build}.zip`
                }
            ], 'name')
        },
        {
            tag_name: 'v0.2.9',
            name: 'Jungle Processors',
            draft: false,
            prerelease: true,
            assets: uniqBy([
                {
                    name: 'jungle-0.2.9-node-10-linux-x64.zip',
                    url: 'https://api.github.com/files/jungle-0.2.9-node-10-linux-x64.zip'
                },
                {
                    name: 'jungle-0.2.9-node-10-darwin-x64.zip',
                    url: 'https://api.github.com/files/jungle-0.2.9-node-10-darwin-x64.zip'
                },
                {
                    name: 'jungle-0.2.9-node-12-linux-x64.zip',
                    url: 'https://api.github.com/files/jungle-0.2.9-node-12-linux-x64.zip'
                },
                {
                    name: `jungle-0.2.9-${build}.zip`,
                    url: `https://api.github.com/files/jungle-0.2.9-${build}.zip`
                }
            ], 'name')
        }
    ];

    const fileZip = fs.readFileSync(path.join(dirname, 'fixtures', 'test-asset.zip'));

    const gitHub = nock('https://api.github.com');

    const externalAsset = new DownloadExternalAsset();

    const externalPathLocation = path.resolve('./test/.cache');
    const externalAssetName = `${externalPathLocation}/assets/jungle`;

    beforeEach(async () => {
        await fs.remove(externalPathLocation);
        await fs.ensureDir(externalPathLocation);
    });

    afterEach(async () => {
        await fs.remove(externalPathLocation);
        nock.cleanAll();
    });

    it('should download an asset.zip from github and unzip the asset', async () => {
        gitHub
            .get('/repos/quantum/jungle/releases')
            .reply(200, releasesJson, { 'Content-Type': 'application/json' })
            .get(`/files/jungle-v1.0.0-${build}.zip`)
            .reply(302, {}, { Location: `https://api.github.com/download/jungle-v1.0.0-${build}.zip` })
            .get(`/download/jungle-v1.0.0-${build}.zip`)
            .reply(200, fileZip, { 'Content-Length': String(fileZip.length) });

        await externalAsset.downloadExternalAsset('quantum/jungle');

        expect(fs.pathExistsSync(path.join(externalPathLocation, 'downloads', `jungle-v1.0.0-${build}.zip`))).toBe(true);
        expect(fs.pathExistsSync(path.join(externalPathLocation, 'assets', 'jungle'))).toBe(true);
        expect(fs.pathExistsSync(path.join(externalPathLocation, 'assets', 'jungle', 'asset.json'))).toBe(true);
    });

    it('should download the correct asset version when specified', async () => {
        gitHub
            .get('/repos/quantum/jungle/releases')
            .reply(200, releasesJson, { 'Content-Type': 'application/json' })
            .get(`/files/jungle-0.2.9-${build}.zip`)
            .reply(302, {}, { Location: `https://api.github.com/download/jungle-0.2.9-${build}.zip` })
            .get(`/download/jungle-0.2.9-${build}.zip`)
            .reply(200, fileZip, { 'Content-Length': String(fileZip.length) });

        await externalAsset.downloadExternalAsset('quantum/jungle@v0.2.9');

        expect(fs.pathExistsSync(path.join(externalPathLocation, 'downloads', `jungle-0.2.9-${build}.zip`))).toBe(true);
        expect(fs.pathExistsSync(path.join(externalPathLocation, 'assets', 'jungle'))).toBe(true);
        expect(fs.pathExistsSync(path.join(externalPathLocation, 'assets', 'jungle', 'asset.json'))).toBe(true);
    });

    it('should not download an asset if asset already exists', async () => {
        fs.ensureDirSync(path.join(externalPathLocation, 'downloads'));
        fs.copyFileSync(path.join(dirname, './fixtures', 'test-asset.zip'), path.join(externalPathLocation, 'downloads', `jungle-v1.0.0-${build}.zip`));

        await decompress(
            path.join(externalPathLocation, 'downloads', `jungle-v1.0.0-${build}.zip`),
            path.join(externalPathLocation, 'assets', 'jungle')
        );

        await externalAsset.downloadExternalAsset('quantum/jungle');

        expect(fs.pathExistsSync(path.join(externalPathLocation, 'downloads', `jungle-v1.0.0-${build}.zip`))).toBe(true);
        expect(fs.pathExistsSync(path.join(externalPathLocation, 'assets', 'jungle', 'asset.json'))).toBe(true);
    });

    it('should allow test harness to run with external assets', async () => {
        gitHub
            .get('/repos/quantum/jungle/releases')
            .reply(200, releasesJson, { 'Content-Type': 'application/json' })
            .get(`/files/jungle-v1.0.0-${build}.zip`)
            .reply(302, {}, { Location: `https://api.github.com/download/jungle-v1.0.0-${build}.zip` })
            .get(`/download/jungle-v1.0.0-${build}.zip`)
            .reply(200, fileZip, { 'Content-Length': String(fileZip.length) });

        await externalAsset.downloadExternalAsset('quantum/jungle');

        const options = {
            assetDir: [
                path.join(dirname, 'fixtures'),
                externalAssetName
            ]
        };

        const job = newTestJobConfig({
            max_retries: 0,
            analytics: true,
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                { _op: 'test-processor' },
                { _op: 'good_processor' }
            ],
        });

        const harness = new WorkerTestHarness(job, options);

        await harness.initialize();

        const expectedResults = { more: 'data' };

        const data = [
            DataEntity.make({ some: 'data' }, { test: expectedResults })
        ];

        const results = await harness.runSlice(data);

        expect(results).toBeArrayOfSize(1);
        expect(results[0]).toMatchObject(expectedResults);
        expect(results[0].getMetadata('external')).toBeTrue();

        await harness.shutdown();
    });
});
