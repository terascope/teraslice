
import nock from 'nock';
import path from 'path';
import fs from 'fs';
import Assets from '../src/lib/assets';
import { AssetIDResponse, AssetsGetResponse, Asset } from '../src/interfaces';

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

    const assetVersion1:Asset = {
        id: 'someId',
        version: '1.0',
        name: 'iAmAnAsset',
        _created: date.toISOString()
    };

    const assetVersion2:Asset = {
        id: 'someId',
        version: '2.0',
        name: 'iAmAnAsset',
        _created: new Date(date.getTime() + 500000).toISOString()
    };

    describe('->post', () => {

        describe('when called with nothing', () => {
            it('should reject with asset stream validation error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-ignore
                    await assets.post();
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
                const results = await assets.post(contents);
                expect(results).toEqual(idResponse);
            });
        });

        describe('when called with a stream', () => {
            const testFilePath = path.join(__dirname, 'fixtures', 'test.txt');
            const contents = fs.readFileSync(testFilePath, 'utf-8');
            const idResponse: AssetIDResponse = { _id: 'some-asset-id' };

            beforeEach(() => {
                scope.post('/assets', body => contents === body)
                    .reply(200, idResponse);
            });

            it('should resolve the json result from Teraslice', async () => {
                const stream = fs.createReadStream(testFilePath);
                const results = await assets.post(stream);
                expect(results).toEqual(idResponse);
            });
        });
    });

    describe('->list', () => {
        const assetList: AssetsGetResponse = [
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
                    // @ts-ignore
                    await assets.getAsset();
                } catch (err) {
                    expect(err.message).toEqual('name is required, and must be of type string');
                }
            });
        });

        describe('when called name as anything but string', () => {
            it('should throw', async () => {
                expect.hasAssertions();
                try {
                    // @ts-ignore
                    await assets.getAsset(1234);
                } catch (err) {
                    expect(err.message).toEqual('name is required, and must be of type string');
                }
            });
        });

        describe('when called with asset name', () => {
            const name = assetVersion1.name;

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
            const name = assetVersion1.name;
            const version = assetVersion1.version;

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
                    // @ts-ignore
                    await assets.getAsset('someName', { some: 'thing' });
                } catch (err) {
                    expect(err.message).toEqual('version if provided must be of type string');
                }
            });
        });

        describe('when called with asset name, version and options', () => {
            const searchOptions = { headers: { 'Some-Header': 'yes' } };
            const name = assetVersion1.name;
            const version = assetVersion1.version;

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
                    // @ts-ignore
                    await assets.txt(1234);
                } catch (err) {
                    expect(err.message).toEqual('name must be of type string');
                }
            });
        });

        describe('when called with asset name', () => {
            const name = assetVersion1.name;

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
            const name = assetVersion1.name;
            const version = assetVersion1.version;

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
                    // @ts-ignore
                    await assets.txt('someName', { some: 'thing' });
                } catch (err) {
                    expect(err.message).toEqual('version must be of type string');
                }
            });
        });

        describe('when called with asset name, version and options', () => {
            const name = assetVersion1.name;
            const version = assetVersion1.version;
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
            const name = assetVersion1.name;
            const version = assetVersion1.version;

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

    describe('->delete', () => {
        const idResponse: AssetIDResponse = { _id: 'someId' };

        beforeEach(() => {
            scope.delete('/assets/some-asset-id')
                .reply(200, idResponse);
        });

        describe('when called with nothing', () => {
            it('should reject with id validation error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-ignore
                    await assets.delete();
                } catch (err) {
                    expect(err.message).toEqual('Asset delete requires a ID');
                }
            });
        });

        describe('when called an id', () => {
            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.delete('some-asset-id');
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
                const results = await assets.delete('other-asset-id', searchOptions);
                expect(results).toEqual(idResponse);
            });
        });
    });
});
