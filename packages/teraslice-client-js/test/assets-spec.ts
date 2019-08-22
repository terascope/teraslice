
import nock from 'nock';
import path from 'path';
import fs from 'fs';
import Assets from '../src/lib/assets';

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

            beforeEach(async () => {
                scope.post('/assets', contents)
                    .reply(200, { _id: 'some-asset-id' });
            });

            it('should resolve the json result from Teraslice', async () => {
                const results = await assets.post(contents);
                expect(results).toEqual({ _id: 'some-asset-id' });
            });
        });

        describe('when called with a stream', () => {
            const testFilePath = path.join(__dirname, 'fixtures', 'test.txt');
            const contents = fs.readFileSync(testFilePath, 'utf-8');

            beforeEach(() => {
                scope.post('/assets', body => contents === body)
                    .reply(200, { _id: 'some-asset-id' });
            });

            it('should resolve the json result from Teraslice', async () => {
                const stream = fs.createReadStream(testFilePath);
                const results = await assets.post(stream);
                expect(results).toEqual({ _id: 'some-asset-id' });
            });
        });
    });

    describe('->delete', () => {

        beforeEach(() => {
            scope.delete('/assets/some-asset-id')
                .reply(200, { ok: true });
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
                expect(results).toEqual({ ok: true });
            });
        });
    });

   // TODO: write tests for lists and get
});
