import * as es from 'elasticsearch';
import { TSError } from '@terascope/utils';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import spacesConfig, { Space, SpaceSearchConfig, SpaceStreamingConfig, SpaceConfigType } from './config/spaces';

/**
 * Manager for Spaces
 */
export class Spaces extends IndexModel<Space> {
    static IndexModelConfig = spacesConfig;
    static ReservedEndpoints = ['data-access', 'spaces'];

    constructor(client: es.Client, options: IndexModelOptions) {
        super(client, options, spacesConfig);
    }

    /** Associate views to space */
    async addViewsToSpace(spaceId: string, views: string[] | string) {
        if (!spaceId) {
            throw new TSError('Missing space to attaching views to', {
                statusCode: 422,
            });
        }

        return this._appendToArray(spaceId, 'views', views);
    }

    /** Disassociate views to space */
    async removeViewsFromSpace(spaceId: string, views: string[] | string) {
        if (!spaceId) {
            throw new TSError('Missing space to remove views from', {
                statusCode: 422,
            });
        }

        return this._removeFromArray(spaceId, 'views', views);
    }

    async removeViewFromSpaces(viewId: string) {
        const views = await this.find(`views: ${viewId}`);
        const promises = views.map(({ id }) => {
            return this._removeFromArray(id, 'views', viewId);
        });
        await Promise.all(promises);
    }
}

export { Space, SpaceSearchConfig, SpaceStreamingConfig, SpaceConfigType };
