import { TSError, isEmpty, isString } from '@terascope/job-components';
import path from 'path';
import autoBind from 'auto-bind';
import Client from './client.js';
import {
    SearchQuery,
    PostData,
    AssetIDResponse,
    SearchOptions,
    AssetUploadQuery,
    TxtSearchParams,
    ClientConfig,
    Asset
} from './interfaces.js';

export default class Assets extends Client {
    constructor(config: ClientConfig) {
        super(config);
        autoBind(this);
    }

    async upload(data: PostData, query: AssetUploadQuery = {}): Promise<AssetIDResponse> {
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

    async remove(id: string, searchOptions: SearchOptions = {}): Promise<AssetIDResponse> {
        if (isEmpty(id)) {
            throw new TSError('Asset delete requires a ID', {
                statusCode: 400
            });
        }
        const results = await this.delete(`/assets/${id}`, searchOptions);
        return this.parse(results);
    }

    async list(
        query: SearchQuery = {},
        searchOptions: SearchOptions = {}
    ): Promise<Asset[]> {
        const options = { ...searchOptions, searchParams: query };
        return this.get('/assets', options);
    }

    async getAsset(name: string, version = '', searchOptions: SearchOptions = {}): Promise<Asset[]> {
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

        const pathing = path.join('/assets', name, version);
        return this.get(pathing, searchOptions);
    }

    async txt(
        name = '',
        version = '',
        query: TxtSearchParams = {},
        searchOptions: SearchOptions = {}
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
