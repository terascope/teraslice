import nock from 'nock';
import fs from 'fs-extra';
import path from 'path';
import DownloadExternalAsset from '../src/download-external-asset';

describe('download-external-asset', () => {
    const releasesJson = [
        {
            tag_name: 'v0.1.0',
            name: 'Test release',
            draft: false,
            prerelease: false,
            assets: [
                {
                    name: 'test-asset-v1.0.0-node-10-linux-x64.zip',
                    url: 'https://api.github.com/files/test-asset-v1.0.0-node-10-linux-x64.zip'
                },
                {
                    name: 'test-asset-v1.0.0-node-10-darwin-x64.zip',
                    url: 'https://api.github.com/files/test-asset-v1.0.0-node-10-darwin-x64.zip'
                },
                {
                    name: 'test-asset-v1.0.0-node-12-linux-x64.zip',
                    url: 'https://api.github.com/files/test-asset-v1.0.0-node-12-linux-x64.zip'
                },
                {
                    name: 'test-asset-v1.0.0-node-12-darwin-x64.zip',
                    url: 'https://api.github.com/files/test-asset-v1.0.0-node-12-darwin-x64.zip'
                }
            ]
        }
    ];

    const fileZip = fs.readFileSync(path.resolve(__dirname, './fixtures/test-asset.zip'));

    beforeAll(() => {
        nock('https://api.github.com')
            .get('/repos/test-account/test/releases')
            .reply(200, releasesJson, { 'Content-Type': 'application/json' })
            .get('/files/test-asset-v1.0.0-node-10-darwin-x64.zip')
            .reply(302, {}, { Location: 'https://api.github.com/download/test-asset-v1.0.0-node-12-darwin-x64.zip' })
            .get('/download/test-asset-v1.0.0-node-10-darwin-x64.zip')
            .reply(200, fileZip, { 'Content-Length': String(fileZip.length) });
    });

    it('should download an asset.zip from github and unzip the asset', async () => {
        await DownloadExternalAsset.prototype.downloadExternalAsset('test-account/test');
        // expect download and asset exist
        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'downloads', 'test-asset-v1.0.0-node-12-darwin-x64.zip'))).toBe(true);
        expect(fs.pathExistsSync(path.join(__dirname, '.cache', 'assets', 'test-account'))).toBe(true);
    });
    // get asset it not .cache dir
    // put / build asset in correct place
    // not download asset if asset already exists
    // setup
    // nock to return zipped asset
    // delete asset dirs when done
});
