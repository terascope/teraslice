import nock from 'nock';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import DownloadExternalAsset from '../src/download-external-asset';

describe('download-external-asset', () => {
    const build = `node-${process.version.split('.')[0].slice(1)}-${os.platform()}-${os.arch()}`;

    const releasesJson = [
        {
            tag_name: 'v1.0.0',
            name: 'Jungle Processors',
            draft: false,
            prerelease: false,
            assets: [
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
            ]
        },
        {
            tag_name: 'v0.2.9',
            name: 'Jungle Processors',
            draft: false,
            prerelease: true,
            assets: [
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
            ]
        }
    ];

    const fileZip = fs.readFileSync(path.join(__dirname, 'fixtures', 'test-asset.zip'));

    const gitHub = nock('https://api.github.com');

    beforeEach(() => {
        fs.removeSync(path.join(__dirname, '.cache'));
    });

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '.cache'));
    });

    it('should download an asset.zip from github and unzip the asset', async () => {
        gitHub
            .get('/repos/quantum/jungle/releases')
            .reply(200, releasesJson, { 'Content-Type': 'application/json' })
            .get(`/files/jungle-v1.0.0-${build}.zip`)
            .reply(302, {}, { Location: `https://api.github.com/download/jungle-v1.0.0-${build}.zip` })
            .get(`/download/jungle-v1.0.0-${build}.zip`)
            .reply(200, fileZip, { 'Content-Length': String(fileZip.length) });

        await DownloadExternalAsset.prototype.downloadExternalAsset('quantum/jungle');

        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'downloads', `jungle-v1.0.0-${build}.zip`))).toBe(true);
        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'assets', 'jungle'))).toBe(true);
        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'assets', 'jungle', 'asset.json'))).toBe(true);
    });

    it('should download an the correct asset version', async () => {
        gitHub
            .get('/repos/quantum/jungle/releases')
            .reply(200, releasesJson, { 'Content-Type': 'application/json' })
            .get(`/files/jungle-0.2.9-${build}.zip`)
            .reply(302, {}, { Location: `https://api.github.com/download/jungle-0.2.9-${build}.zip` })
            .get(`/download/jungle-0.2.9-${build}.zip`)
            .reply(200, fileZip, { 'Content-Length': String(fileZip.length) });

        await DownloadExternalAsset.prototype.downloadExternalAsset('quantum/jungle@v0.2.9');

        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'downloads', `jungle-0.2.9-${build}.zip`))).toBe(true);
        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'assets', 'jungle'))).toBe(true);
        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'assets', 'jungle', 'asset.json'))).toBe(true);
    });

    it('should not download an asset if asset already exists in the cache', async () => {
        fs.ensureDirSync(path.join(__dirname, '.cache', 'downloads'));
        fs.copyFileSync(path.join(__dirname, 'fixtures', 'test-asset.zip'), path.join(__dirname, '.cache', 'downloads', `jungle-v1.0.0-${build}.zip`));

        await DownloadExternalAsset.prototype.downloadExternalAsset('quantum/jungle');

        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'assets', 'jungle'))).toBe(false);
    });
});
