import { TSError, isEmpty, isString } from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import path from 'node:path';
import autoBind from 'auto-bind';
import Client from './client.js';
import { PostData, RequestOptions, ClientConfig } from './interfaces.js';

export default class Assets extends Client {
    constructor(config: ClientConfig) {
        super(config);
        autoBind(this);
    }

    async upload(
        data: PostData,
        query: Teraslice.AssetUploadQuery = {}
    ): Promise<Teraslice.AssetIDResponse> {
        if (isEmpty(data)) {
            throw new TSError('Asset stream must not be empty', {
                statusCode: 400
            });
        }

        const results = await this.post('/assets', data, {
            searchParams: query as Record<string, any>
        });

        return this.parse(results);
    }

    async remove(
        id: string,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.AssetIDResponse> {
        if (isEmpty(id)) {
            throw new TSError('Asset delete requires a ID', {
                statusCode: 400
            });
        }

        const results = await this.delete<Teraslice.AssetIDResponse>(`/assets/${id}`, searchOptions);

        return this.parse(results);
    }

    async list(
        query: Teraslice.SearchQuery = {},
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.AssetRecord[]> {
        const options = { ...searchOptions, searchParams: query };
        return this.get('/assets', options);
    }

    async getAsset(
        name: string,
        version = '',
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.AssetRecord[]> {
        if (!name || !isString(name)) {
            throw new TSError('Name is required, and must be of type string', {
                statusCode: 400
            });
        }
        if (version && !isString(version)) {
            throw new TSError('Version if provided must be of type string', {
                statusCode: 400
            });
        }

        const assetUrl = path.join('/assets', name, version);

        return this.get(assetUrl, searchOptions);
    }

    async txt(
        name = '',
        version = '',
        query: Teraslice.TxtSearchParams = {},
        searchOptions: RequestOptions = {}
    ): Promise<string> {
        if (name && !isString(name)) {
            throw new TSError('Name must be of type string', {
                statusCode: 400
            });
        }
        if (version && !isString(version)) {
            throw new TSError('Version must be of type string', {
                statusCode: 400
            });
        }

        const options = Object.assign({ responseType: 'text' }, searchOptions, {
            searchParams: query
        });
        const pathing = path.join('/txt/assets', name, version);

        return super.get(pathing, options);
    }
}
