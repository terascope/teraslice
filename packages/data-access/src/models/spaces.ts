import * as es from 'elasticsearch';
import { Omit, TSError } from '@terascope/utils';
import spacesConfig from './config/spaces';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel } from './base';

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
            default_view: String
            created: String
            updated: String
        }

        input UpdateSpaceInput {
            id: ID!
            name: String
            description: String
            views: [String]
            default_view: String
            metadata: JSON
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, spacesConfig);
    }

    /** Associate views to space */
    async linkViews(space: string, views: string[]|string) {
        if (!space) {
            throw new TSError('Missing view id to attach view to', {
                statusCode: 422
            });
        }

        return this.appendToArray(space, 'views', views);
    }

    /** Disassociate views to space */
    async unlinkViews(space: string, views: string[]|string) {
        if (!space) {
            throw new TSError('Missing view id to unattach view to', {
                statusCode: 422
            });
        }

        return this.removeFromArray(space, 'views', views);
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
     * The view to apply defaults to all associated views with
    */
    default_view?: string;

    /**
     * Metadata for the "Space"
    */
    metadata?: object;
}

export type CreateSpaceInput = Omit<SpaceModel, (keyof BaseModel)>;
export type UpdateSpaceInput = Omit<SpaceModel, Exclude<(keyof BaseModel), 'id'>>;
