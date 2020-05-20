import { TSError, isEmpty, isString } from '@terascope/job-components';
import path from 'path';
import autoBind from 'auto-bind';
import Client from './client';
import {
    SearchQuery,
    PostData,
    AssetIDResponse,
    SearchOptions,
    RequestOptions,
    TxtSearchParams,
    ClientConfig,
    Asset
} from './interfaces';

export default class Assets extends Client {
    constructor(config: ClientConfig) {
        super(config);
        // @ts-ignore
        autoBind(this);
    }

    // @ts-ignore
    async post(data: PostData, options: RequestOptions = {}): Promise<AssetIDResponse> {
        if (isEmpty(data)) throw new TSError('Asset stream must not be empty');
        const results = await super.post('/assets', data, options);
        return this.parse(results);
    }

    // @ts-ignore
    async delete(id: string, searchOptions: SearchOptions = {}): Promise<AssetIDResponse> {
        if (isEmpty(id)) throw new TSError('Asset delete requires a ID');
        const results = await super.delete(`/assets/${id}`, searchOptions);
        return this.parse(results);
    }

    async list(
        query: SearchQuery = {},
        searchOptions: SearchOptions = {}
    ): Promise<Asset[]> {
        const options = Object.assign({}, searchOptions, { query });
        return this.get('/assets', options);
    }

    async getAsset(name: string, version = '', searchOptions: SearchOptions = {}): Promise<Asset[]> {
        if (!name || !isString(name)) throw new TSError('name is required, and must be of type string');
        if (version && !isString(version)) throw new TSError('version if provided must be of type string');
        const pathing = path.join('/assets', name, version);
        return this.get(pathing, searchOptions);
    }

    async txt(
        name = '',
        version = '',
        query: TxtSearchParams = {},
        searchOptions: SearchOptions = {}
    ): Promise<string> {
        if (name && !isString(name)) throw new TSError('name must be of type string');
        if (version && !isString(version)) throw new TSError('version must be of type string');

        const options = Object.assign({ responseType: 'text' }, searchOptions, {
            searchParams: query
        });
        const pathing = path.join('/txt/assets', name, version);

        return super.get(pathing, options);
    }
}
