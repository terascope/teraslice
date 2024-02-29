import fs from 'node:fs';
import path from 'node:path';
import nock from 'nock';
import elasticsearhReleaseJSON from '../fixtures/elasticsearch-assets-release.js';

export const regAsset = fs.readFileSync(path.resolve(__dirname, '../fixtures/regularAsset.zip'));
export const versionedAsset = fs.readFileSync(path.resolve(__dirname, '../fixtures/versionAsset.zip'));
export const preReleaseAsset = fs.readFileSync(path.resolve(__dirname, '../fixtures/elasticsearch-v1.5.6.zip'));

const testReleaseId = 11111111;
const preReleaseId = 19448406;
export default class GithubServer {
    init(): nock.Scope {
        const githubURI = 'https://api.github.com';

        const scope = nock(githubURI)
            .get('/repos/terascope/elasticsearch-assets/releases')
            .reply(200, elasticsearhReleaseJSON, { 'Content-Type': 'application/json' });

        for (const release of elasticsearhReleaseJSON) {
            const { id } = release;
            let downloadedAssets: Buffer;

            if (id === testReleaseId) {
                downloadedAssets = versionedAsset;
            } else if (id === preReleaseId) {
                downloadedAssets = preReleaseAsset;
            } else {
                downloadedAssets = regAsset;
            }

            const length = `${downloadedAssets.length}`;

            for (const asset of release.assets) {
                const assetDownloadName = `/download/${asset.id}`;

                scope
                    .get(asset.url.replace(githubURI, ''))
                    // using asset name as location header, its not the same from api
                    .reply(302, {}, { Location: `${githubURI}${assetDownloadName}` })
                    .get(assetDownloadName)
                    .reply(200, downloadedAssets, { 'Content-Length': length });
            }
        }
        return scope;
    }
}
