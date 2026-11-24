import type { Readable } from 'node:stream';
import { TerasliceApiV2 } from '@terascope/types';
import type { TerasliceRequest } from '../../../../../interfaces.js';
import type { AssetsStorage } from '../../../../storage/index.js';
import { addFilterToQuery } from '../../../../utils/api_utils.js';
import { toPage } from '../../../../utils/pagination.js';
import {
    createRouteRegistry, withStatus, type RouteRegistry, type Parsed, type TextResult
} from '../../../../utils/v2_routes.js';
import {
    txtRouteSpec, toTextTable, sortOrDefault, pagedSearch
} from './route-utils.js';

/** Default columns of `GET /txt/assets`, as in v1 */
const txtAssetsColumns = ['name', 'version', 'id', '_created', 'description', 'node_version', 'platform', 'arch'];

/** The /txt/assets tables cut descriptions to this many characters, as in v1 */
const txtDescriptionLength = 30;

/**
 * A Lucene query string phrase matching `value` exactly: quoted, with `\`
 * and `"` escaped, so a path param can't change the query.
 */
export function quotedTerm(value: string): string {
    return `"${value.replace(/[\\"]/g, '\\$&')}"`;
}

/** Reads a request body stream into one Buffer */
async function readBody(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

/** The asset records a list matches: all of them, or by name and version */
interface AssetMatch {
    name?: string;
    version?: string;
}

/**
 * The /v2 asset routes. The assets service mounts the router; it reads
 * `getStorage()` on each request. The master only reads `routes`, for the
 * OpenAPI spec, and passes a getter that throws, since it never runs the
 * handlers: it proxies /v2/assets* to the assets service.
 */
export function createV2AssetRegistry(getStorage: () => AssetsStorage): RouteRegistry {
    const registry = createRouteRegistry();

    /**
     * One page of the asset records `match` selects, with `external_storage`
     * when assets are stored in S3.
     */
    async function listAssets(
        query: Parsed<typeof TerasliceApiV2.GetAssetsQuerySchema>,
        { name, version }: AssetMatch = {}
    ): Promise<TerasliceApiV2.AssetRecordPage> {
        const { size, from, filter } = query;
        const sort = sortOrDefault(query.sort, '_created:desc');

        let partialQuery = 'id:*';
        if (name !== undefined) partialQuery += ` AND name:${quotedTerm(name)}`;
        if (version !== undefined) partialQuery += ` AND version:${quotedTerm(version)}`;
        const searchQuery = addFilterToQuery(partialQuery, filter ?? '');

        const storage = getStorage();
        const assets = await pagedSearch(() => storage.searchWithTotal({
            query: searchQuery, from, size, sort
        }));

        return toPage(
            { ...assets, records: await storage.withExternalStorage(assets.records) },
            from,
            size
        );
    }

    /**
     * A /txt/assets table: v1's columns, plus `external_storage` when
     * assets are stored in S3, with descriptions cut short. A missing value
     * (no `description`, `platform`, `arch`, ...) prints `N/A`, as in the
     * other tables; v1 printed it blank.
     */
    async function assetsTable(
        query: Parsed<typeof TerasliceApiV2.GetTxtAssetsQuerySchema>,
        req: TerasliceRequest,
        match?: AssetMatch
    ): Promise<TextResult> {
        const page = await listAssets(query, match);
        const columns = getStorage().hasExternalStorage
            ? [...txtAssetsColumns, 'external_storage']
            : txtAssetsColumns;
        const data = page.data.map((asset) => ({
            ...asset,
            description: asset.description?.slice(0, txtDescriptionLength),
        }));

        return toTextTable({ ...page, data }, columns, query, req);
    }

    // Assets

    registry.post('/assets', {
        operationId: 'uploadAsset',
        summary: 'Upload an asset bundle (a zip)',
        tags: ['Assets'],
        query: TerasliceApiV2.UploadAssetQuerySchema,
        bodyFormat: 'binary',
        response: TerasliceApiV2.AssetIDResponseSchema,
        successStatuses: {
            200: 'The asset already exists',
            201: 'The asset was stored',
        },
    }, async ({ query: { blocking } }, req) => {
        const { assetId, created } = await getStorage().save(await readBody(req), blocking);
        return withStatus(created ? 201 : 200, { asset_id: assetId });
    }, { errorMessage: 'Could not save asset' });

    registry.delete('/assets/:assetId', {
        operationId: 'deleteAsset',
        summary: 'Delete an asset',
        tags: ['Assets'],
        params: TerasliceApiV2.AssetIdParams,
        response: TerasliceApiV2.AssetIDResponseSchema,
    }, async ({ params: { assetId } }) => {
        await getStorage().remove(assetId);
        return { asset_id: assetId };
    }, { errorMessage: ({ assetId }) => `Could not delete asset ${assetId}` });

    registry.get('/assets', {
        operationId: 'getAssets',
        summary: 'List assets',
        tags: ['Assets'],
        query: TerasliceApiV2.GetAssetsQuerySchema,
        response: TerasliceApiV2.AssetRecordPageSchema,
    }, ({ query }) => listAssets(query), { errorMessage: 'Could not get assets' });

    registry.get('/assets/:name', {
        operationId: 'getAssetsByName',
        summary: 'List the versions of an asset',
        tags: ['Assets'],
        params: TerasliceApiV2.AssetNameParams,
        query: TerasliceApiV2.GetAssetsQuerySchema,
        response: TerasliceApiV2.AssetRecordPageSchema,
    }, ({ params, query }) => listAssets(query, params), { errorMessage: 'Could not get assets' });

    registry.get('/assets/:name/:version', {
        operationId: 'getAssetsByNameAndVersion',
        summary: 'List the builds of one version of an asset, e.g. one per platform',
        tags: ['Assets'],
        params: TerasliceApiV2.AssetNameVersionParams,
        query: TerasliceApiV2.GetAssetsQuerySchema,
        response: TerasliceApiV2.AssetRecordPageSchema,
    }, ({ params, query }) => listAssets(query, params), { errorMessage: 'Could not get assets' });

    // Text tables

    registry.get('/txt/assets', {
        ...txtRouteSpec,
        operationId: 'getAssetsTxtTable',
        summary: 'List assets as a text table',
        query: TerasliceApiV2.GetTxtAssetsQuerySchema,
    }, ({ query }, req) => assetsTable(query, req), { errorMessage: 'Could not get assets' });

    registry.get('/txt/assets/:name', {
        ...txtRouteSpec,
        operationId: 'getAssetsByNameTxtTable',
        summary: 'List the versions of an asset as a text table',
        params: TerasliceApiV2.AssetNameParams,
        query: TerasliceApiV2.GetTxtAssetsQuerySchema,
    }, ({ params, query }, req) => assetsTable(query, req, params), {
        errorMessage: 'Could not get assets'
    });

    registry.get('/txt/assets/:name/:version', {
        ...txtRouteSpec,
        operationId: 'getAssetsByNameAndVersionTxtTable',
        summary: 'List the builds of one version of an asset as a text table',
        params: TerasliceApiV2.AssetNameVersionParams,
        query: TerasliceApiV2.GetTxtAssetsQuerySchema,
    }, ({ params, query }, req) => assetsTable(query, req, params), {
        errorMessage: 'Could not get assets'
    });

    return registry;
}
