/* eslint-disable jest/no-disabled-tests */
import 'jest-extended';
import fs from 'node:fs';
import os from 'os';
import path from 'path';
import decompress from 'decompress';
import archiver from 'archiver';
import {
    createS3Client,
    getS3Object,
    S3Client,
} from '@terascope/file-asset-apis';
import { Teraslice } from '@terascope/types';
import { pWhile } from '@terascope/utils';
import crypto from 'crypto';
import { TerasliceHarness, JobFixtureNames } from '../../teraslice-harness.js';
import {
    ASSET_STORAGE_CONNECTION_TYPE, MINIO_ACCESS_KEY, MINIO_HOST,
    MINIO_SECRET_KEY, TEST_PLATFORM, ENCRYPT_MINIO
} from '../../config.js';

describe('assets', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    /**
     * Uploads the specified asset file and then submits the specified job config
     * it then waits for the job to enter the running state, then waits for
     * the requested number of workers to enter the joined state.  Then that has
     * happened it tests to see that the number of workers joined is the number
     * of workers requested.  This reasoning is a bit circular, but a worker
     * won't enter the `joined` state if it fails to load its assets.
     *
     * @param {string}   jobSpecName the name of job to run
     * @param {string}   assetPath   the relative path to the asset file
     */
    async function submitAndValidateAssetJob(jobSpecName: JobFixtureNames, assetPath: string) {
        const fileStream = fs.createReadStream(assetPath);
        const jobSpec = terasliceHarness.newJob(jobSpecName);
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        const { workers } = jobSpec; // save for comparison

        const result = await terasliceHarness.teraslice.assets.upload(
            fileStream,
            { blocking: true }
        );
        // NOTE: In this case, the asset is referenced by the ID
        // assigned by teraslice and not it's name.
        jobSpec.assets = [result._id, 'standard', 'elasticsearch'];

        const ex = await terasliceHarness.submitAndStart(jobSpec);

        const r = await terasliceHarness.forWorkersJoined(ex.id(), workers as number, 25);
        expect(r).toEqual(workers);

        await ex.stop({ blocking: true });
    }

    it('after uploading an asset, it can be deleted', async () => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_asset_1.zip');

        const result = await terasliceHarness.teraslice.assets.upload(
            testStream,
            { blocking: true }
        );

        // save the asset ID that was submitted to terslice
        const assetId = result._id;
        const response = await terasliceHarness.teraslice.assets.remove(assetId);

        // ensure the deleted asset's ID matches that of
        // the saved asset
        expect(assetId).toEqual(response._id);
    });

    // Test a bad asset
    // curl -XPOST -H "Content-Type: application/octet-stream"
    //   localhost:45678/assets --data-binary test/fixtures/assets/example_assets_1.zip
    // {"error":"asset.json was not found in root directory of asset bundle
    //    nor any immediate sub directory"}
    it('uploading a bad asset returns an error', async () => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_bad_asset_1.zip');

        try {
            await terasliceHarness.teraslice.assets.upload(testStream, { blocking: true });
        } catch (err) {
            expect(err.message).toInclude('asset.json was not found');
            expect(err.code).toEqual(422);
        }
    });

    // Type 1 Asset - asset.json at top level of zipfile
    // example_assets/
    // example_assets/drop_property/
    // example_assets/drop_property/index.js
    // asset.json
    xit('after starting a job with a Type 1 asset specified by ID should eventually have all workers joined', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1.zip';

        await submitAndValidateAssetJob('generator-asset', assetPath);
    });

    // Type 2 Asset - asset.json in subdirectory of zipfile
    // example_assets/
    // example_assets/asset.json
    // example_assets/drop_property/
    // example_assets/drop_property/index.js
    xit('after starting a job with a Type 2 asset specified by ID should eventually have all workers joined', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_2.zip';
        await submitAndValidateAssetJob('generator-asset', assetPath);
    });

    xit('can update an asset bundle and use the new asset', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1updated.zip';

        const fileStream = fs.createReadStream(assetPath);
        // the asset on this job already points to 'ex1' so it should use the latest available asset
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        const { workers } = jobSpec;

        const assetResponse = await terasliceHarness.teraslice.assets.upload(fileStream, {
            blocking: true
        });
        const assetId = assetResponse._id;

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

    xit('can directly ask for the new asset to be used', async () => {
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.assets = ['ex1:0.1.1', 'standard', 'elasticsearch'];
        const { workers } = jobSpec;

        const assetResponse = await terasliceHarness.teraslice.assets.getAsset('ex1', '0.1.1');
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
        const config = {
            endpoint: MINIO_HOST,
            accessKeyId: MINIO_ACCESS_KEY,
            secretAccessKey: MINIO_SECRET_KEY,
            forcePathStyle: true,
            sslEnabled: ENCRYPT_MINIO === 'true',
            region: 'test-region',
            caCertificate: ENCRYPT_MINIO === 'true'
                ? fs.readFileSync('test/certs/CAs/rootCA.pem', 'utf8')
                : ''
        };

        beforeAll(async () => {
            terasliceHarness = new TerasliceHarness();
            await terasliceHarness.init();
            await terasliceHarness.resetState();

            s3client = await createS3Client(config);
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
            assetId = assetResponse._id;

            const response = await getS3Object(s3client, { Bucket: bucketName, Key: `${assetId}.zip` });
            const base64 = await response.Body?.transformToString('base64');
            expect(base64).toStartWith('UEsDBAoAAAAAAAs6O');
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
            const assetBuffer = fs.readFileSync(assetPath);
            await decompress(assetBuffer, largeAssetPathSub);
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

            /// Once the previous chunk is proccesed,
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
            const zipper = archiver('zip');
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
            if (TEST_PLATFORM === 'kubernetes') {
                jobSpec.resources_requests_cpu = 0.1;
            }

            const ex = await terasliceHarness.submitAndStart(jobSpec);
            const status = await ex.waitForStatus('completed');

            expect(status).toBe('completed');
        });
    }
});
