
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import elasticsearhReleaseJSON from './fixtures/elasticsearch-assets-release.json';

export const regAsset = fs.readFileSync(path.resolve(__dirname, './fixtures/regularAsset.zip'));
export const versionedAsset = fs.readFileSync(path.resolve(__dirname, './fixtures/versionAsset.zip'));

const testReleaseId = 11111111;

export default class NockServer {
    init() {
        const githubURI = 'https://api.github.com';

        const scope = nock(githubURI)
            .get('/repos/terascope/elasticsearch-assets/releases')
            .reply(200, elasticsearhReleaseJSON, { 'Content-Type': 'application/json' });

        for (const release of elasticsearhReleaseJSON) {
            const downloadedAssets = release.id === testReleaseId ? versionedAsset : regAsset;
            const length = release.id === testReleaseId ? `${versionedAsset.length}` : `${regAsset.length}`;

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
    }

    close() {
        nock.cleanAll();
    }
}
