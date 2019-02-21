import * as es from 'elasticsearch';
import { Omit, uniq, TSError, castArray } from '@terascope/utils';
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
            created: String
            updated: String
        }

        input UpdateSpaceInput {
            id: ID!
            name: String
            description: String
            views: [String]
            created: String
            updated: String
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, spacesConfig);
    }

    /** Associate views to space */
    async linkViews(space: string, views: string[]|string): Promise<void> {
        if (!views || !views.length) return;

        if (!space) {
            throw new TSError('Missing view id to attach view to', {
                statusCode: 422
            });
        }

        await this.updateWith(space, {
            script: {
                source: `
                    for(int i = 0; i < params.views.length; i++) {
                        if (!ctx._source.views.contains(params.views[i])) {
                            ctx._source.views.add(params.views[i])
                        }
                    }
                `,
                lang: 'painless',
                params: {
                    views: uniq(castArray(views)),
                }
            }
        });
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
}

export type CreateSpaceInput = Omit<SpaceModel, (keyof BaseModel)>;
export type UpdateSpaceInput = Omit<SpaceModel, Exclude<(keyof BaseModel), 'id'>>;
