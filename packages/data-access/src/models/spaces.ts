import * as es from 'elasticsearch';
import { TSError } from '@terascope/utils';
import spacesConfig from './config/spaces';
import { ManagerConfig } from '../interfaces';
import { Base, BaseModel, CreateModel, UpdateModel } from './base';

/**
 * Manager for Spaces
 *
 * @todo there should some kind of human id
*/
export class Spaces extends Base<SpaceModel, CreateSpaceInput, UpdateSpaceInput> {
    static ModelConfig = spacesConfig;
    static GraphQLSchema = `
        type Space {
            id: ID!
            name: String
            description: String
            data_type: String
            views: [String]
            roles: [String]
            search_config: SpaceSearchConfig
            streaming_config: SpaceStreamingConfig
            created: String
            updated: String
        }

        type SpaceSearchConfig {
            index: String!
            connection: String
            max_query_size: Int
            sort_default: String
            sort_dates_only: Boolean
            sort_enabled: Boolean
            default_geo_field: String
            preserve_index_name: Boolean
            require_query: Boolean
            default_date_field: String
            history_prefix: String
        }

        type SpaceStreamingConfig {
            connection: String
        }

        input SpaceSearchConfigInput {
            index: String!
            connection: String
            max_query_size: Int
            sort_default: String
            sort_dates_only: Boolean
            sort_enabled: Boolean
            default_geo_field: String
            preserve_index_name: Boolean
            require_query: Boolean
            default_date_field: String
            history_prefix: String
        }

        input SpaceStreamingConfigInput {
            connection: String
        }

        input CreateSpaceInput {
            name: String!
            description: String
            data_type: String!
            views: [String]
            roles: [String]
            search_config: SpaceSearchConfigInput
            streaming_config: SpaceStreamingConfigInput
        }

        input UpdateSpaceInput {
            id: ID!
            name: String
            description: String
            data_type: String
            views: [String]
            roles: [String]
            search_config: SpaceSearchConfigInput
            streaming_config: SpaceStreamingConfigInput
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
     * The associated data type
    */
    data_type: string;

    /**
     * A list of associated views
    */
    views: string[];

    /**
     * A list of associated roles
    */
    roles: string[];

    /**
     * Configuration for searching the space
    */
    search_config?: SpaceSearchConfig;

    /**
     * Configuration for streaming the space
    */
    streaming_config?: SpaceStreamingConfig;
}

export interface SpaceStreamingConfig {
    connection?: string;
}

export interface SpaceSearchConfig {
    index: string;
    connection?: string;
    max_query_size?: number;
    sort_default?: string;
    sort_dates_only?: boolean;
    sort_enabled?: boolean;
    default_geo_field?: string;
    preserve_index_name?: boolean;
    require_query?: boolean;
    default_date_field?: string;
    history_prefix?: string;
}

export type CreateSpaceInput = CreateModel<SpaceModel>;
export type UpdateSpaceInput = UpdateModel<SpaceModel>;
