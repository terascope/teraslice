import 'jest-extended';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ZipArchive } from 'archiver';
import { createS3Client, getS3Object, S3Client } from '@terascope/file-asset-apis';
import { Teraslice, TerasliceApiV2 } from '@terascope/types';
import { pWhile, unzip } from '@terascope/core-utils';
import { TerasliceClient } from 'teraslice-client-js';
import crypto from 'crypto';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const {
    ASSET_STORAGE_CONNECTION_TYPE, CEPH_ACCESS_KEY, CEPH_HOST,
    CEPH_SECRET_KEY, TEST_PLATFORM, ENCRYPT_CEPH, ROOT_CERT_PATH,
    TEST_API_VERSION, HOST_IP, TERASLICE_PORT
} = config;

describe('assets', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('after uploading an asset, it can be deleted', async () => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_asset_1.zip');

        const result = await terasliceHarness.teraslice.assets.upload(
            testStream,
            { blocking: true }
        );

        // save the asset ID that was submitted to teraslice
        const assetId = result.asset_id;

        const response = await terasliceHarness.teraslice.assets.remove(assetId);

        // ensure the deleted asset's ID matches that of
        // the saved asset
        expect(assetId).toEqual(response.asset_id);
    });

    // Test a bad asset
    // curl -XPOST -H "Content-Type: application/octet-stream"
    //   localhost:45678/assets --data-binary test/fixtures/assets/example_assets_1.zip
    // {"error":"asset.json was not found in root directory of asset bundle
    //    nor any immediate sub directory"}
    it('uploading a bad asset returns an error', async () => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_bad_asset_1.zip');

        await expect(
            terasliceHarness.teraslice.assets.upload(testStream, { blocking: true })
        ).rejects.toMatchObject({
            message: expect.stringContaining('asset.json was not found'),
            code: 422,
        });
    });

    it('can update an asset bundle and use the new asset', async () => {
        const olderAssetPath = 'test/fixtures/assets/example_asset_1.zip';
        const olderStream = fs.createReadStream(olderAssetPath);
        await terasliceHarness.teraslice.assets.upload(
            olderStream,
            { blocking: true }
        );

        /*
            {
                "name": "ex1",
                "version": "0.0.1",
                "node_version": 18,
                "platform": false,
                "arch": false
            }

            {
                "name": "ex1",
                "version": "0.1.1",
                "node_version": 18,
                "platform": false,
                "arch": false
            }

        */
        const newerAssetPath = 'test/fixtures/assets/example_asset_1updated.zip';
        const fileStream = fs.createReadStream(newerAssetPath);
        // the asset on this job already points to 'ex1' so it should use the latest available asset
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        const { workers } = jobSpec;

        const assetResponse = await terasliceHarness.teraslice.assets.upload(fileStream, {
            blocking: true
        });
        const assetId = assetResponse.asset_id;

        const ex = await terasliceHarness.submitAndStart(jobSpec);

        const waitResponse = await terasliceHarness.forWorkersJoined(
            ex.id(),
            workers as number,
            25
        );
        expect(waitResponse).toEqual(workers);

        const execution = await ex.config();

        expect(execution.assets[0]).toEqual(assetId);

        await ex.stop({ blocking: true });
    });

    it('can directly ask for a specific asset version to be used', async () => {
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }

        jobSpec.assets = ['ex1:0.0.1', 'standard', 'elasticsearch'];
        const { workers } = jobSpec;

        const assetResponse = await terasliceHarness.teraslice.assets.getAsset('ex1', '0.0.1');
        const assetId = assetResponse[0].id;

        const ex = await terasliceHarness.submitAndStart(jobSpec);

        const waitResponse = await terasliceHarness.forWorkersJoined(
            ex.id(),
            workers as number,
            25
        );
        expect(waitResponse).toEqual(workers);

        const execution = await ex.config();
        expect(execution.assets[0]).toEqual(assetId);

        await ex.stop({ blocking: true });
    });

    it('will throw if there are naming conflicts', async () => {
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }

        jobSpec.assets = ['ex1:0.0.1', 'ex1:0.1.1', 'standard', 'elasticsearch'];

        await expect(terasliceHarness.submitAndStart(jobSpec)).rejects.toThrow();
    });

    it('will not throw if there are naming conflicts but you use asset identifiers', async () => {
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }

        jobSpec.assets = ['ex1:0.0.1', 'ex1:0.1.1', 'standard', 'elasticsearch'];
        jobSpec.operations = jobSpec.operations.map((op) => {
            if (op._op === 'drop_property') {
                return {
                    ...op,
                    _op: 'drop_property@ex1:0.1.1'
                };
            }
            return op;
        });
        const { workers } = jobSpec;

        const assetResponse = await terasliceHarness.teraslice.assets.getAsset('ex1', '0.0.1');
        const assetId = assetResponse[0].id;

        const ex = await terasliceHarness.submitAndStart(jobSpec);

        const waitResponse = await terasliceHarness.forWorkersJoined(
            ex.id(),
            workers as number,
            25
        );
        expect(waitResponse).toEqual(workers);

        const execution = await ex.config();
        expect(execution.assets[0]).toEqual(assetId);

        await ex.stop({ blocking: true });
    });
});

/**
 * A /txt table's column names and cells, each trimmed. The columns are where
 * the dashes under the column names are, so a blank cell reads as ''.
 */
function tableCells(table: string): { headers: string[]; rows: string[][] } {
    const [headerLine, dashLine, ...rowLines] = table.split('\n').filter(Boolean);
    const starts = Array.from(dashLine.matchAll(/-+/g), (match) => match.index);
    const cells = (line: string) => starts.map(
        (start, i) => line.slice(start, starts[i + 1]).trim()
    );
    return { headers: cells(headerLine), rows: rowLines.map(cells) };
}

// The harness client uses TEST_API_VERSION, so in the v2 suite the tests above
// already upload and delete through /v2. These compare the /v2 lists and
// tables with v1's, so they only run in the v2 suite.
// TODO: Teraslice v4 deletes /v1, remove the v1 comparisons
// https://github.com/terascope/teraslice/issues/4584#issuecomment-6636093239
describe('assets api', () => {
    (TEST_API_VERSION === 'v2' ? describe : describe.skip)('/v2/assets', () => {
        const host = `http://${HOST_IP}:${TERASLICE_PORT}`;
        const v1 = new TerasliceClient({ host, apiVersion: '/v1' });
        const v2 = new TerasliceClient({ host, apiVersion: '/v2' });

        beforeAll(async () => {
            // both ex1 versions, so there's more than one page; an asset that
            // already exists is a 200, not an error
            for (const fixture of ['example_asset_1.zip', 'example_asset_1updated.zip']) {
                await v2.assets.upload(
                    fs.createReadStream(`test/fixtures/assets/${fixture}`), { blocking: true }
                );
            }
        });

        it('should list the same assets as v1', async () => {
            const query = { sort: 'id:asc' };
            const [v1Assets, v2Assets] = await Promise.all([
                v1.assets.list(query),
                v2.assets.list(query),
            ]);

            expect(v2Assets).toEqual(v1Assets);
            expect(v2Assets.length).toBeGreaterThan(1);
        });

        it('should page through every asset with from, each once', async () => {
            const sort = 'id:asc';
            const { pagination: { total } } = await v2.assets.listPage({ sort, size: 0 });
            expect(total).toBeGreaterThan(1);
            const size = Math.max(1, Math.floor(total / 2));

            const ids: string[] = [];
            let requests = 0;
            let hasMore = true;
            while (hasMore) {
                const page = await v2.assets.listPage({ sort, size, from: ids.length });
                expect(page.pagination).toMatchObject({ total, from: ids.length, size });
                // the routes don't parse responses, so check real records match the schema
                expect(TerasliceApiV2.AssetRecordPageSchema.safeParse(page).error).toBeUndefined();
                ids.push(...page.data.map((asset) => asset.id));
                hasMore = page.pagination.has_more;
                requests++;
            }
            expect(requests).toBeGreaterThan(1);
            expect(new Set(ids).size).toBe(total);

            const all = await v2.assets.list({ sort, size: total });
            expect(ids).toEqual(all.map((asset) => asset.id));
        });

        it.each([
            ['ex1', undefined],
            ['ex1', '0.0.1'],
        ])('should get asset %s %s like v1', async (name, version) => {
            const [v1Assets, v2Assets] = await Promise.all([
                v1.assets.getAsset(name, version),
                v2.assets.getAsset(name, version),
            ]);

            expect(v2Assets).toEqual(v1Assets);
            expect(v2Assets).not.toBeEmpty();
        });

        // v1 prints a missing value (no description, platform, arch, ...) blank, and
        // v2 prints N/A, as its other tables do; otherwise the cells are the same
        it.each([
            ['assets'],
            ['assets/ex1'],
            ['assets/ex1/0.0.1'],
        ])('/txt/%s should print v1\'s rows, with N/A for missing values, then the footer', async (type) => {
            const query = { sort: 'id:asc' };
            const [v1Table, v2Table] = await Promise.all([
                v1.cluster.txt(type, query),
                v2.cluster.txt(type, query),
            ]);
            const [v2Rows, v2Footer] = v2Table.split('\n\n');

            const v1Cells = tableCells(v1Table);
            expect(v1Cells.rows).not.toBeEmpty();
            expect(tableCells(v2Rows)).toEqual({
                headers: v1Cells.headers,
                rows: v1Cells.rows.map((row) => row.map((cell) => cell || 'N/A')),
            });
            expect(v2Footer).toStartWith('Showing ');
        });

        it('should reject an asset id that isn\'t 40 characters', async () => {
            await expect(v2.assets.remove('too-short')).rejects.toMatchObject({ statusCode: 400 });
        });

        it('should reject an upload sent as JSON', async () => {
            await expect(v2.assets.post('/assets', { not: 'a zip' })).rejects.toMatchObject({
                statusCode: 400,
            });
        });
    });
});

describe('s3 asset storage', () => {
    // If the connection type is S3 run tests to ensure assets are stored in S3
    if (ASSET_STORAGE_CONNECTION_TYPE === 's3') {
        /// keep 'largeAssetPath' in outer scope so afterAll can cleanup even on failure
        const largeAssetPath = fs.mkdtempSync(path.join(os.tmpdir(), 'example_large_asset_top'));
        let terasliceInfo: Teraslice.ApiRootResponse;
        let terasliceHarness: TerasliceHarness;
        let s3client: S3Client;
        let assetId: string;
        let bucketName: string;
        const clientConfig = {
            endpoint: CEPH_HOST,
            accessKeyId: CEPH_ACCESS_KEY,
            secretAccessKey: CEPH_SECRET_KEY,
            forcePathStyle: true,
            sslEnabled: ENCRYPT_CEPH === true,
            // RGW validates the region against its zonegroup, unlike MinIO which
            // ignored it. Must match what teraslice itself uses, see setup-config.
            region: 'us-east-1',
            caCertificate: ENCRYPT_CEPH === true
                ? fs.readFileSync(ROOT_CERT_PATH, 'utf8')
                : ''
        };

        beforeAll(async () => {
            terasliceHarness = new TerasliceHarness();
            await terasliceHarness.init();
            await terasliceHarness.resetState();

            s3client = await createS3Client(clientConfig);
            terasliceInfo = await terasliceHarness.teraslice.cluster.info();
            bucketName = `ts-assets-${terasliceInfo.name}`.replaceAll('_', '-');
        });

        afterAll(async () => {
            /// cleanup
            fs.rmSync(largeAssetPath, { recursive: true, force: true });
        });

        it('stores assets in s3', async () => {
            const assetPath = 'test/fixtures/assets/example_asset_1updated.zip';
            const fileStream = fs.createReadStream(assetPath);
            const assetResponse = await terasliceHarness.teraslice.assets.upload(fileStream, {
                blocking: true
            });
            assetId = assetResponse.asset_id;

            const response = await getS3Object(s3client, { Bucket: bucketName, Key: `${assetId}.zip` });
            const base64 = await response.Body?.transformToString('base64');
            expect(base64).toStartWith('UEsDBBQAAgAIAFBl0');
        });

        it('does not create the "blob" field when storing asset metadata in ES', async () => {
            const index = `${terasliceInfo.name}__assets`;
            const params = {
                index
            };
            const response = await terasliceHarness.client.search(params);
            const assetRecords = response.hits.hits;
            for (const record of assetRecords) {
                expect(record._source?.blob).toBeUndefined();
            }
        });

        it('can upload and use large asset', async () => {
            /// Create a large asset within the test so we don't have to a upload
            /// large binary file to the repo
            const assetPath = 'test/fixtures/assets/example_asset_1updated.zip';
            if (!fs.existsSync(largeAssetPath)) {
                fs.mkdirSync(largeAssetPath, { recursive: true });
            }
            const largeAssetPathSub = path.join(largeAssetPath, 'example_large_asset_sub');
            if (!fs.existsSync(largeAssetPathSub)) {
                fs.mkdirSync(largeAssetPathSub, { recursive: true });
            }
            await unzip(assetPath, largeAssetPathSub);
            fs.mkdirSync(path.join(largeAssetPathSub, '__static_assets'), { recursive: true });
            const largeDocumentPath = path.join(largeAssetPathSub, '__static_assets', 'data.txt');
            fs.writeFileSync(largeDocumentPath, '');
            const writer = fs.createWriteStream(largeDocumentPath);
            let generateComplete = false;

            /// TODO: This functionality could be moved to utils at some point.
            /// Writes a chunk of random string data to data.txt
            /// It needs to be random to maintain size during compression
            function writeData() {
                /// chunk size in bytes
                /// 5mb per chunk
                const chunkSize = 5242880;
                const stringChunk = crypto.randomBytes(chunkSize);
                writer.write(stringChunk, writerCB);
            }

            /// Once the previous chunk is processed,
            /// write another chunk until the bytes written is >= 60mb
            /// This is so we don't hold all 60mb in memory
            function writerCB(error: Error | null | void) {
                if (error) {
                    throw new Error(error.message);
                }
                const totalBytes = writer.bytesWritten;
                if (totalBytes >= 62914560) {
                    writer.end();
                    generateComplete = true;
                } else {
                    writeData();
                }
            }
            /// Once the write stream is ready start writing data to the file
            writer.on('ready', () => {
                writeData();
            });

            writer.on('error', (err) => {
                throw new Error(err.message);
            });
            /// Wait for all data to be written to file
            await pWhile(async () => generateComplete);

            /// Change name in asset.json
            const assetJSON = JSON.parse(fs.readFileSync(path.join(largeAssetPathSub, 'asset.json'), 'utf8'));
            assetJSON.name = 'large-example-asset';
            fs.writeFileSync(path.join(largeAssetPathSub, 'asset.json'), JSON.stringify(assetJSON, null, 2));

            /// Zip the large asset
            const zippedFile = fs.createWriteStream(path.join(largeAssetPath, 'example_large_asset.zip'));
            const zipper = new ZipArchive();
            zipper.pipe(zippedFile);
            zipper.on('error', (err) => {
                throw new Error(err.message);
            });
            zipper.directory(largeAssetPathSub, false);
            await zipper.finalize();

            const fileStream = fs.createReadStream(path.join(largeAssetPath, 'example_large_asset.zip'));

            /// Will throw error if unable to upload
            await terasliceHarness.teraslice.assets.upload(fileStream, {
                blocking: true
            });

            const jobSpec = terasliceHarness.newJob('generator-large-asset');
            // // Set resource constraints on workers within CI
            if (TEST_PLATFORM === 'kubernetesV2') {
                jobSpec.resources_requests_cpu = 0.1;
            }

            const ex = await terasliceHarness.submitAndStart(jobSpec);
            const status = await ex.waitForStatus('completed');

            expect(status).toBe('completed');
        });
    }
});
