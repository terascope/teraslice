
import { TSError, isEmpty, isString } from '@terascope/job-components';
import util from 'util';
import path from 'path';
import autoBind from 'auto-bind';
import Client from './client';
import {
    SearchQuery,
    PostData,
    AssetIDResponse,
    AssetsGetResponse,
    SearchOptions,
    RequestOptions,
    TxtSearchParams,
    ClientConfig,
    Asset
} from './interfaces';

type GetFn = (name: string) => Promise<Asset[]>;

function deprecateMethod(fn: GetFn) {
    const msg = 'the "get" method is being deprecated, please use the "getAsset" or "txt" method instead';
    return util.deprecate(fn, msg);
}

export default class Assets extends Client {
    constructor(config: ClientConfig) {
        super(config);
        this.get = deprecateMethod(this.get);
        // @ts-ignore
        autoBind(this);
    }

    async post(data: PostData, options: RequestOptions = {}): Promise<AssetIDResponse> {
        if (isEmpty(data)) throw new TSError('Asset stream must not be empty');
        const results = await super.post('/assets', data, options);
        return this.parse(results);
    }

    async delete(id: string, searchOptions: SearchOptions = {}): Promise<AssetIDResponse> {
        if (isEmpty(id)) throw new TSError('Asset delete requires a ID');
        const results = await super.delete(`/assets/${id}`, searchOptions);
        return this.parse(results);
    }

    async list(
        query: SearchQuery = {},
        searchOptions: SearchOptions = {}
    ): Promise<AssetsGetResponse> {
        const options = Object.assign({}, searchOptions, { query });
        return super.get('/assets', options);
    }

    async get(name: string): Promise<AssetsGetResponse> {
        const pathing = path.join('/assets', name);
        return super.get(pathing);
    }

    async getAsset(name: string, version = '', searchOptions: SearchOptions = {}): Promise<AssetsGetResponse> {
        if (!name || !isString(name)) throw new TSError('name is required, and must be of type string');
        if (version && !isString(version)) throw new TSError('version if provided must be of type string');
        const pathing = path.join('/assets', name, version);
        return super.get(pathing, searchOptions);
    }

    async txt(
        name = '',
        version = '',
        query: TxtSearchParams = {},
        searchOptions: SearchOptions = {}
    ): Promise<AssetsGetResponse> {
        if (name && !isString(name)) throw new TSError('name must be of type string');
        if (version && !isString(version)) throw new TSError('version must be of type string');

        const options = Object.assign({ json: false }, searchOptions, { query });
        const pathing = path.join('/txt/assets', name, version);

        return super.get(pathing, options);
    }
}
