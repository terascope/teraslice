import * as es from 'elasticsearch';
import { TSError } from '@terascope/utils';
import spacesConfig from './config/spaces';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel, CreateModel, UpdateModel } from './base';

/**
 * Manager for Spaces
*/
export class Spaces extends Base<SpaceModel, CreateSpaceInput, UpdateSpaceInput> {
    static ModelConfig = spacesConfig;
    static GraphQLSchema = `
        type Space {
            id: ID!
            name: String!
            description: String
            views: [String]
            metadata: JSON
            created: String
            updated: String
        }

        input UpdateSpaceInput {
            id: ID!
            name: String
            description: String
            views: [String]
            metadata: JSON
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, spacesConfig);
    }

    /** Associate views to space */
    async addViewsToSpace(spaceId: string, views: string[]|string) {
        if (!spaceId) {
            throw new TSError('Missing space to attaching views to', {
                statusCode: 422
            });
        }

        return this.appendToArray(spaceId, 'views', views);
    }

    /** Disassociate views to space */
    async removeViewsFromSpace(spaceId: string, views: string[]|string) {
        if (!spaceId) {
            throw new TSError('Missing space to remove views from', {
                statusCode: 422
            });
        }

        return this.removeFromArray(spaceId, 'views', views);
    }

    async removeViewFromSpaces(viewId: string) {
        const views = await this.find(`views: ${viewId}`);
        const promises = views.map(({ id }) => {
            return this.removeFromArray(id, 'views', viewId);
        });
        await Promise.all(promises);
    }
}

/**
 * The definition of a Space model
*/
export interface SpaceModel extends BaseModel {
    /**
     * Name of the Space, the name must be unique
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;

    /**
     * A list of associated views
    */
    views: string[];

    /**
     * Metadata for the "Space"
    */
    metadata?: object;
}

export type CreateSpaceInput = CreateModel<SpaceModel>;
export type UpdateSpaceInput = UpdateModel<SpaceModel>;
