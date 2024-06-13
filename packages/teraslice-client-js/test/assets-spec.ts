import nock from 'nock';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { AssetRecord, AssetIDResponse } from '@terascope/types';
import Assets from '../src/assets.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Teraslice Assets', () => {
    let assets: Assets;
    let scope: nock.Scope;

    beforeEach(() => {
        assets = new Assets({
            baseUrl: 'http://teraslice.example.dev'
        });

        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    const date = new Date();

    const assetVersion1: AssetRecord = {
        id: 'someId',
        version: '1.0',
        name: 'iAmAnAsset',
        blob: '',
        _created: date.toISOString()
    };

    const assetVersion2: AssetRecord = {
        id: 'someId',
        version: '2.0',
        name: 'iAmAnAsset',
        blob: '',
        _created: new Date(date.getTime() + 500000).toISOString()
    };

    describe('->upload', () => {
        describe('when called with nothing', () => {
            it('should reject with asset stream validation error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.upload();
                } catch (err) {
                    expect(err.message).toEqual('Asset stream must not be empty');
                }
            });
        });

        describe('when called with a string', () => {
            const contents = 'example-input';
            const idResponse: AssetIDResponse = { _id: 'some-asset-id' };

            beforeEach(async () => {
                scope.post('/assets', contents)
                    .reply(200, idResponse);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.upload(contents);
                expect(results).toEqual(idResponse);
            });
        });

        // This test hangs in node version 20.10.0 and above.
        // See issue: https://github.com/nock/nock/issues/2595
        // teraslice/e2e/test/cases/assets/simple-spec.ts covers this test case
        // eslint-disable-next-line jest/no-disabled-tests
        xdescribe('when called with a stream', () => {
            const testFilePath = path.join(dirname, 'fixtures', 'test.txt');
            const contents = fs.readFileSync(testFilePath, 'utf-8');
            const idResponse: AssetIDResponse = { _id: 'some-asset-id' };

            beforeEach(() => {
                scope.post('/assets', (body) => contents === body)
                    .reply(200, idResponse);
            });

            it('should resolve the json result from Teraslice', async () => {
                const stream = fs.createReadStream(testFilePath);
                const results = await assets.upload(stream);
                expect(results).toEqual(idResponse);
            });
        });
    });

    describe('->list', () => {
        const assetList: AssetRecord[] = [
            assetVersion1,
            assetVersion2
        ];

        describe('when called without any options', () => {
            beforeEach(() => {
                scope.get('/assets')
                    .reply(200, assetList);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.list();
                expect(results).toEqual(assetList);
            });
        });

        describe('when called with search query', () => {
            const queryParams = { size: 10, from: 2, sort: '_updated:desc' };

            beforeEach(() => {
                scope.get('/assets')
                    .query(queryParams)
                    .reply(200, assetList);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.list(queryParams);
                expect(results).toEqual(assetList);
            });
        });

        describe('when called with search query and options', () => {
            const queryParams = { size: 10, from: 2, sort: '_updated:desc' };
            const searchOptions = { headers: { 'Some-Header': 'yes' } };

            beforeEach(() => {
                scope.get('/assets')
                    .matchHeader('Some-Header', 'yes')
                    .query(queryParams)
                    .reply(200, assetList);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.list(queryParams, searchOptions);
                expect(results).toEqual(assetList);
            });
        });
    });

    describe('->getAsset', () => {
        describe('when called without any arguments', () => {
            it('should throw', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.getAsset();
                } catch (err) {
                    expect(err.message).toEqual('Name is required, and must be of type string');
                }
            });
        });

        describe('when called name as anything but string', () => {
            it('should throw', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.getAsset(1234);
                } catch (err) {
                    expect(err.message).toEqual('Name is required, and must be of type string');
                }
            });
        });

        describe('when called with asset name', () => {
            const { name } = assetVersion1;

            beforeEach(() => {
                scope.get(`/assets/${name}`)
                    .reply(200, assetVersion1);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.getAsset(name);
                expect(results).toEqual(assetVersion1);
            });
        });

        describe('when called with asset name and version', () => {
            const { name } = assetVersion1;
            const { version } = assetVersion1;

            beforeEach(() => {
                scope.get(`/assets/${name}/${version}`)
                    .reply(200, assetVersion1);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.getAsset(name, version);
                expect(results).toEqual(assetVersion1);
            });
        });

        describe('when called name and version as anything but string', () => {
            it('should throw', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.getAsset('someName', { some: 'thing' });
                } catch (err) {
                    expect(err.message).toEqual('Version if provided must be of type string');
                }
            });
        });

        describe('when called with asset name, version and options', () => {
            const searchOptions = { headers: { 'Some-Header': 'yes' } };
            const { name } = assetVersion1;
            const { version } = assetVersion1;

            beforeEach(() => {
                scope.get(`/assets/${name}/${version}`)
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, assetVersion1);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.getAsset(name, version, searchOptions);
                expect(results).toEqual(assetVersion1);
            });
        });
    });

    describe('->txt', () => {
        const fakeTxtData = JSON.stringify(assetVersion1);

        beforeEach(() => {
            scope = nock('http://teraslice.example.dev/');
        });

        describe('when called without any arguments', () => {
            beforeEach(() => {
                scope.get('/txt/assets')
                    .reply(200, fakeTxtData);
            });

            it('should resolve with txt', async () => {
                const results = await assets.txt();
                expect(results).toEqual(fakeTxtData);
            });
        });

        describe('when called name as anything but string', () => {
            it('should throw', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.txt(1234);
                } catch (err) {
                    expect(err.message).toEqual('Name must be of type string');
                }
            });
        });

        describe('when called with asset name', () => {
            const { name } = assetVersion1;

            beforeEach(() => {
                scope.get(`/txt/assets/${name}`)
                    .reply(200, fakeTxtData);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.txt(name);
                expect(results).toEqual(fakeTxtData);
            });
        });

        describe('when called with asset name and version', () => {
            const { name } = assetVersion1;
            const { version } = assetVersion1;

            beforeEach(() => {
                scope.get(`/txt/assets/${name}/${version}`)
                    .reply(200, fakeTxtData);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.txt(name, version);
                expect(results).toEqual(fakeTxtData);
            });
        });

        describe('when called name and version as anything but string', () => {
            it('should throw', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.txt('someName', { some: 'thing' });
                } catch (err) {
                    expect(err.message).toEqual('Version must be of type string');
                }
            });
        });

        describe('when called with asset name, version and options', () => {
            const { name } = assetVersion1;
            const { version } = assetVersion1;
            const queryParams = { size: 10, from: 2, sort: '_updated:desc' };

            beforeEach(() => {
                scope.get(`/txt/assets/${name}/${version}`)
                    .query(queryParams)
                    .reply(200, fakeTxtData);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.txt(name, version, queryParams);
                expect(results).toEqual(fakeTxtData);
            });
        });

        describe('when called with asset name, version and options and request options', () => {
            const searchOptions = { headers: { 'Some-Header': 'yes' } };
            const queryParams = { size: 10, from: 2, sort: '_updated:desc' };
            const { name } = assetVersion1;
            const { version } = assetVersion1;

            beforeEach(() => {
                scope.get(`/txt/assets/${name}/${version}`)
                    .query(queryParams)
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, fakeTxtData);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.txt(name, version, queryParams, searchOptions);
                expect(results).toEqual(fakeTxtData);
            });
        });
    });

    describe('->remove', () => {
        const idResponse: AssetIDResponse = { _id: 'someId' };

        beforeEach(() => {
            scope.delete('/assets/some-asset-id')
                .reply(200, idResponse);
        });

        describe('when called with nothing', () => {
            it('should reject with id validation error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await assets.remove();
                } catch (err) {
                    expect(err.message).toEqual('Asset delete requires a ID');
                }
            });
        });

        describe('when called an id', () => {
            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.remove('some-asset-id');
                expect(results).toEqual(idResponse);
            });
        });

        describe('when called an id and options', () => {
            const searchOptions = { headers: { some: 'header' } };

            beforeEach(() => {
                scope.delete('/assets/other-asset-id')
                    .matchHeader('some', 'header')
                    .reply(200, idResponse);
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.remove('other-asset-id', searchOptions);
                expect(results).toEqual(idResponse);
            });
        });
    });
});
