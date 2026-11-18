import { startsWith } from '@terascope/core-utils';
import { Teraslice, TerasliceApiV2 } from '@terascope/types';
import util from 'node:util';
import autoBind from 'auto-bind';
import Client from './client.js';
import { RequestOptions, TxtQuery } from './interfaces.js';

function _deprecateSlicerName(fn: () => Promise<Teraslice.ExecutionList>) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

/** The /v1 text tables; `assets` also matches `assets/<name>[/<version>]` */
const v1TxtTypes = ['assets', 'slicers', 'controllers', 'ex', 'jobs', 'nodes', 'workers'];

/**
 * The text tables on /v2. `assets` (and `assets/<name>[/<version>]`) has no
 * /v2 route yet, so it's sent to v1's `/txt/assets`.
 */
const v2TxtTypes = ['assets', 'controllers', 'ex', 'jobs', 'nodes', 'workers'];

export default class Cluster extends Client {
    constructor(config: Record<string, any>) {
        super(config);
        this.slicers = _deprecateSlicerName(this.slicers);
        autoBind(this);
    }

    async info(): Promise<Teraslice.ApiRootResponse> {
        return this.get('/');
    }

    async state(): Promise<Teraslice.ClusterState> {
        return this.get('/cluster/state');
    }

    async stats(): Promise<Teraslice.ClusterStats> {
        return this.get('/cluster/stats');
    }

    async slicers(): Promise<Teraslice.ExecutionList> {
        // TODO: Teraslice v4 deletes /v1, remove slicers() in favor of controllers()
        // https://github.com/terascope/teraslice/issues/4584#issuecomment-6636093239
        if (this.isV2) return this.controllers();
        return this.get('/cluster/slicers');
    }

    async controllers(): Promise<Teraslice.ExecutionList> {
        return this.getList('/cluster/controllers');
    }

    /**
     * One page of controllers, with its `pagination`. Send
     * `pagination.next_cursor` as `cursor` for the next page; or use
     * `pages()`. /v2 only.
     */
    async controllersPage(
        query: TerasliceApiV2.GetClusterControllersQuery = {},
        searchOptions: RequestOptions = {}
    ): Promise<TerasliceApiV2.ControllerStatsPage> {
        return this.getPage('/cluster/controllers', this.makeOptions(query, searchOptions));
    }

    async connectors(
        query: Teraslice.ConnectorQueryOptions = {},
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.ConnectorListResponse> {
        const options = { ...searchOptions, searchParams: query as Record<string, any> };
        return this.get('/cluster/connectors', options);
    }

    async jobSchema(searchOptions: RequestOptions = {}): Promise<Teraslice.JobSchemaResponse> {
        return this.get('/cluster/job-schema', searchOptions);
    }

    /**
     * A list as a plain-text table. `type` is the list: `jobs`, `ex`,
     * `workers`, `nodes`, `controllers`, `slicers` or `assets` (or
     * `assets/<name>[/<version>]`). On /v2, `slicers` gets `controllers`, the
     * same table, and `assets` gets v1's table, which isn't paged.
     */
    async txt(type: string, query: TxtQuery = {}): Promise<string> {
        // TODO: Teraslice v4 deletes /v1, remove slicers, and move assets to /v2
        // https://github.com/terascope/teraslice/issues/4584#issuecomment-6636093239
        const name = this.isV2 && type === 'slicers' ? 'controllers' : type;
        const validTypes = this.isV2 ? v2TxtTypes : v1TxtTypes;
        const isValid = this.isV2
            ? validTypes.includes(name) || name.startsWith('assets/')
            : validTypes.some((validType) => startsWith(name, validType));
        if (!isValid) {
            const error = new Error(`"${type}" is not a valid type. Must be one of ${JSON.stringify(validTypes)}`);
            return Promise.reject(error);
        }

        return this.get(`/txt/${name}`, {
            responseType: 'text',
            searchParams: query as Record<string, any>,
        });
    }
}
