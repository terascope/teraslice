import { Router } from 'express';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import type { ApiService } from '../api.js';
import type { TerasliceRequest, TerasliceResponse } from '../../../../../interfaces.js';
import { handleTerasliceRequest, sendError } from '../../../../utils/api_utils.js';
import { createV2Registry } from './routes.js';
import { createV2AssetRegistry } from './asset-routes.js';
import { generateV2Spec } from './openapi.js';
import { v2DocsPage } from './docs-page.js';

const rapidocScript = readFileSync(
    createRequire(import.meta.url).resolve('rapidoc/dist/rapidoc-min.js'), 'utf8'
);

/** Streams a request to the assets service at `path` and pipes back its response */
export type ForwardToAssets = (
    req: TerasliceRequest, res: TerasliceResponse, path: string
) => Promise<void>;

/**
 * Everything the cluster master serves under /v2, to mount at `/v2`:
 * - the asset routes, forwarded to the assets service
 * - the OpenAPI spec and its docs page
 * - the master's own routes, from `createV2Registry`
 */
export function createV2Router(api: ApiService, forwardToAssets: ForwardToAssets): Router {
    const router = Router();
    const v2 = createV2Registry(api);

    // The assets service serves the /v2 asset routes; the master only needs
    // their defs for the spec, so these handlers never run here.
    const assetRoutes = createV2AssetRegistry(() => {
        throw new Error('The /v2 asset routes are served by the assets service');
    }).routes;
    const routes = [...v2.routes, ...assetRoutes];

    // Forward with the full path: `req.url` has the /v2 mount stripped, and
    // the assets service serves its v1 routes there.
    const forward = (req: TerasliceRequest, res: TerasliceResponse) => (
        forwardToAssets(req, res, req.originalUrl)
    );

    // Registered before the master's routes, so none of them can catch these
    router.route('/assets{/*splat}')
        .get(forward)
        .delete(forward)
        .post((req, res) => {
            // An upload is a raw zip, sent with any content type or none (the
            // client sends none). Reject JSON and form data with a 400 here; the
            // assets service 422s any other body that isn't a zip. `req.is`
            // also catches `; charset=...` variants, which bodyParser doesn't read.
            if (req.is(['json', 'urlencoded'])) {
                sendError(res, 400, 'Asset uploads take a zip file body, not JSON or form data');
                return;
            }
            forward(req, res);
        });
    router.get('/txt/assets{/*splat}', forward);

    router.get('/openapi.json', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not generate the OpenAPI spec');
        requestHandler(() => generateV2Spec(routes));
    });

    router.get('/api-docs', (_req, res) => {
        res.type('html').send(v2DocsPage());
    });

    router.get('/api-docs/rapidoc-min.js', (_req, res) => {
        res.type('application/javascript').send(rapidocScript);
    });

    router.use(v2.router);

    return router;
}
