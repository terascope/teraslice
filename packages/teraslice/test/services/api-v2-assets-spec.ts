import 'jest-extended';
import { jest } from '@jest/globals';
import got from 'got';
import express from 'express';
import http from 'node:http';
import { TSError, debugLogger } from '@terascope/core-utils';
import { findPort } from '../../src/lib/utils/port_utils.js';
import {
    createV2AssetRegistry, quotedTerm
} from '../../src/lib/cluster/services/api/v2/asset-routes.js';
import type { AssetsStorage } from '../../src/lib/storage/index.js';
import { makeResultWindowError } from '../utils/search-errors.js';

const assetId = 'caf0e5ce7cf1edc864f306b1d9edbad0f7060545';
const otherId = 'ba53aa515e20e0c7da93bd2a373b84819fba7b2a';

const asset = {
    id: assetId,
    _created: '2026-11-05T00:00:00.000Z',
    name: 'ex1',
    version: '0.0.1',
    description: 'An asset with a description longer than thirty characters',
    node_version: 22,
};

const otherAsset = {
    id: otherId,
    _created: '2026-11-04T00:00:00.000Z',
    name: 'ex1',
    version: '0.1.1',
};

/** The `pagination` of a page, with the defaults of a request with no paging params */
function pagination(fields: Record<string, any> = {}) {
    return {
        total: 1, from: 0, size: 100, has_more: false, next_cursor: null, ...fields
    };
}

describe('HTTP API v2 assets', () => {
    const app = express();
    const storage = {
        searchWithTotal: jest.fn<AssetsStorage['searchWithTotal']>(),
        withExternalStorage: jest.fn(async (records: any[]) => records),
        hasExternalStorage: false,
        save: jest.fn<AssetsStorage['save']>(),
        remove: jest.fn<AssetsStorage['remove']>(),
    };

    let baseUrl: string;
    let server: http.Server;

    function request(method: string, path: string, options: Record<string, any> = {}) {
        return got(`${baseUrl}${path}`, {
            method: method as any,
            responseType: 'json',
            throwHttpErrors: false,
            ...options
        }) as Promise<any>;
    }

    /** The search the last list request ran */
    function lastSearch() {
        return storage.searchWithTotal.mock.calls.at(-1)?.[0];
    }

    beforeAll(async () => {
        const port = await findPort();
        baseUrl = `http://localhost:${port}`;

        const logger = debugLogger('api-v2-assets-spec');
        app.use((req, _res, next) => {
            req.logger = logger;
            next();
        });
        app.use('/v2', createV2AssetRegistry(() => storage as unknown as AssetsStorage).router);

        await new Promise((resolve, reject) => {
            server = app.listen(port, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    afterAll(async () => {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        storage.hasExternalStorage = false;
        storage.searchWithTotal.mockResolvedValue({ records: [asset], total: 1 });
        storage.withExternalStorage.mockImplementation(async (records: any[]) => records);
    });

    describe('quotedTerm', () => {
        it.each([
            ['ex1', '"ex1"'],
            ['a"b', '"a\\"b"'],
            ['a\\b', '"a\\\\b"'],
            ['x" OR name:*', '"x\\" OR name:*"'],
        ])('quotes %j as %j', (value, expected) => {
            expect(quotedTerm(value)).toBe(expected);
        });
    });

    describe('GET /v2/assets', () => {
        it('returns a page of assets, newest first', async () => {
            const response = await request('GET', '/v2/assets');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ data: [asset], pagination: pagination() });
            expect(lastSearch()).toEqual({
                query: 'id:*', from: 0, size: 100, sort: '_created:desc'
            });
        });

        it('uses the default sort for an empty sort', async () => {
            await request('GET', '/v2/assets', { searchParams: { sort: '' } });
            expect(lastSearch()?.sort).toBe('_created:desc');
        });

        it('ANDs the filter with the route\'s query', async () => {
            await request('GET', '/v2/assets', { searchParams: { filter: 'node_version:22' } });
            expect(lastSearch()?.query).toBe('(id:*) AND (node_version:22)');
        });

        it('adds external_storage from the storage', async () => {
            storage.withExternalStorage.mockImplementation(async (records: any[]) => records.map(
                (record) => ({ ...record, external_storage: 'available' })
            ));

            const response = await request('GET', '/v2/assets');

            expect(response.body.data).toEqual([{ ...asset, external_storage: 'available' }]);
        });

        it('pages with a cursor', async () => {
            storage.searchWithTotal.mockResolvedValueOnce({
                records: [asset], total: 2, lastSort: [1, assetId]
            });
            const first = await request('GET', '/v2/assets', { searchParams: { size: '1' } });

            expect(first.body.pagination).toMatchObject({ total: 2, has_more: true });
            expect(first.body.pagination.next_cursor).toBeString();

            storage.searchWithTotal.mockResolvedValueOnce({
                records: [otherAsset], total: 2, lastSort: [0, otherId]
            });
            const second = await request('GET', '/v2/assets', {
                searchParams: { size: '1', cursor: first.body.pagination.next_cursor }
            });

            expect(second.statusCode).toBe(200);
            expect(second.body.data).toEqual([otherAsset]);
            expect(lastSearch()).toMatchObject({ from: 0, searchAfter: [1, assetId] });
        });

        it('rejects another list\'s cursor', async () => {
            storage.searchWithTotal.mockResolvedValueOnce({
                records: [asset], total: 2, lastSort: [1, assetId]
            });
            const first = await request('GET', '/v2/assets/ex1', { searchParams: { size: '1' } });

            const response = await request('GET', '/v2/assets', {
                searchParams: { size: '1', cursor: first.body.pagination.next_cursor }
            });

            expect(response.statusCode).toBe(400);
        });

        it('explains a search past max_result_window', async () => {
            storage.searchWithTotal.mockRejectedValueOnce(makeResultWindowError());

            const response = await request('GET', '/v2/assets', { searchParams: { from: '10000' } });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toContain('Use cursor to page further');
        });

        it('rejects an unknown query param', async () => {
            const response = await request('GET', '/v2/assets', { searchParams: { foo: 'bar' } });
            expect(response.statusCode).toBe(400);
            expect(storage.searchWithTotal).not.toHaveBeenCalled();
        });
    });

    describe('GET /v2/assets/:name and /v2/assets/:name/:version', () => {
        it('searches by name', async () => {
            const response = await request('GET', '/v2/assets/ex1');

            expect(response.statusCode).toBe(200);
            expect(lastSearch()?.query).toBe('id:* AND name:"ex1"');
        });

        it('searches by name and version', async () => {
            const response = await request('GET', '/v2/assets/ex1/0.0.1');

            expect(response.statusCode).toBe(200);
            expect(lastSearch()?.query).toBe('id:* AND name:"ex1" AND version:"0.0.1"');
        });

        it('escapes quotes in the params', async () => {
            await request('GET', `/v2/assets/${encodeURIComponent('x" OR name:*')}`);
            expect(lastSearch()?.query).toBe('id:* AND name:"x\\" OR name:*"');
        });
    });

    describe('GET /v2/txt/assets', () => {
        const header = 'name  version  id                                        _created                  description                     node_version  platform  arch';

        it('prints v1\'s columns, with descriptions cut to 30 characters', async () => {
            const response = await request('GET', '/v2/txt/assets', { responseType: 'text' });

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toStartWith('text/plain');
            expect(response.headers['x-total-count']).toBe('1');

            const [first, , row] = response.body.split('\n');
            expect(first).toBe(header);
            expect(row).toContain('An asset with a description lo ');
            expect(row).not.toContain('longer');
        });

        it('adds external_storage when assets are stored in S3', async () => {
            storage.hasExternalStorage = true;
            storage.withExternalStorage.mockImplementation(async (records: any[]) => records.map(
                (record) => ({ ...record, external_storage: 'missing' })
            ));

            const response = await request('GET', '/v2/txt/assets', { responseType: 'text' });
            const [first, , row] = response.body.split('\n');

            expect(first).toEndWith('external_storage');
            expect(row.trimEnd()).toEndWith('missing');
        });

        it('prints the given fields', async () => {
            const response = await request('GET', '/v2/txt/assets/ex1', {
                responseType: 'text',
                searchParams: { fields: 'name,version', headers: 'false' },
            });

            expect(response.body).toBe('ex1  0.0.1\n');
            expect(lastSearch()?.query).toBe('id:* AND name:"ex1"');
        });

        it('rejects an unknown field', async () => {
            const response = await request('GET', '/v2/txt/assets', { searchParams: { fields: 'blob' } });
            expect(response.statusCode).toBe(400);
        });

        it('searches by name and version', async () => {
            await request('GET', '/v2/txt/assets/ex1/0.0.1', { responseType: 'text' });
            expect(lastSearch()?.query).toBe('id:* AND name:"ex1" AND version:"0.0.1"');
        });
    });

    describe('POST /v2/assets', () => {
        const zip = Buffer.from('PK\u0003\u0004 not really a zip');

        it('responds 201 with the id of a new asset', async () => {
            storage.save.mockResolvedValueOnce({ assetId, created: true });

            const response = await request('POST', '/v2/assets', {
                body: zip, headers: { 'content-type': 'application/octet-stream' }
            });

            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual({ asset_id: assetId });
            expect(storage.save).toHaveBeenCalledWith(zip, true);
        });

        it('responds 200 when the asset already exists', async () => {
            storage.save.mockResolvedValueOnce({ assetId, created: false });

            const response = await request('POST', '/v2/assets', { body: zip });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ asset_id: assetId });
        });

        it('passes blocking=false to the storage', async () => {
            storage.save.mockResolvedValueOnce({ assetId, created: true });

            await request('POST', '/v2/assets', { body: zip, searchParams: { blocking: 'false' } });

            expect(storage.save).toHaveBeenCalledWith(zip, false);
        });

        it('rejects an invalid blocking value', async () => {
            const response = await request('POST', '/v2/assets', {
                body: zip, searchParams: { blocking: 'maybe' }
            });

            expect(response.statusCode).toBe(400);
            expect(storage.save).not.toHaveBeenCalled();
        });

        it('responds with the storage error\'s status', async () => {
            storage.save.mockRejectedValueOnce(
                new TSError('Failed to save asset. File type not recognized as zip.', { statusCode: 422 })
            );

            const response = await request('POST', '/v2/assets', { body: Buffer.from('nope') });

            expect(response.statusCode).toBe(422);
            expect(response.body.message).toContain('not recognized as zip');
        });
    });

    describe('DELETE /v2/assets/:assetId', () => {
        it('deletes the asset', async () => {
            storage.remove.mockResolvedValueOnce(undefined);

            const response = await request('DELETE', `/v2/assets/${assetId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ asset_id: assetId });
            expect(storage.remove).toHaveBeenCalledWith(assetId);
        });

        it('rejects an id that isn\'t 40 characters', async () => {
            const response = await request('DELETE', '/v2/assets/ex1');

            expect(response.statusCode).toBe(400);
            expect(storage.remove).not.toHaveBeenCalled();
        });

        it('responds 404 for an unknown asset', async () => {
            storage.remove.mockRejectedValueOnce(
                new TSError(`Unable to find asset ${assetId}`, { statusCode: 404 })
            );

            const response = await request('DELETE', `/v2/assets/${assetId}`);

            expect(response.statusCode).toBe(404);
        });
    });
});
