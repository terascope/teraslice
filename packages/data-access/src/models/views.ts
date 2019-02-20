import * as es from 'elasticsearch';
import { getFirst, TSError, Omit } from '@terascope/utils';
import { Base, BaseModel } from './base';
import viewsConfig from './config/views';
import { ManagerConfig } from '../interfaces';

/**
 * Manager for Views
*/
export class Views extends Base<ViewModel, CreateViewInput, UpdateViewInput> {
    static ModelConfig = viewsConfig;
    static GraphQLSchema = `
        type View {
            id: ID!
            name: String
            description: String
            space: String!
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            created: String
            updated: String
        }

        input UpdateViewInput {
            id: ID!
            name: String
            description: String
            space: String!
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, viewsConfig);
    }

    async getViewForRole(roleId: string, spaceId: string) {
        const query = `roles:"${roleId}" AND space:"${spaceId}"`;
        const result = getFirst(await this.find(query, 1));
        if (result == null) {
            const errMsg = `No View found for role "${roleId}" and space "${spaceId}"`;
            throw new TSError(errMsg, { statusCode: 404 });
        }
        return result;
    }
}

/**
 * The definition of a View model
 *
*/
export interface ViewModel extends BaseModel {
    /**
     * Name of the view
    */
    name: string;

    /**
     * Description of the view usage
    */
    description?: string;

    /**
     * The associated space
    */
    space: string;

    /**
     * The associated roles
    */
    roles: string[];

    /**
     * Fields to exclude
    */
    excludes?: string[];

    /**
     * Fields to include
    */
    includes?: string[];

    /**
     * Constraint for queries and filtering
    */
    constraint?: string;

    /**
     * Restrict prefix wildcards in search values
     *
     * @example `foo:*bar`
    */
    prevent_prefix_wildcard?: boolean;
}

export type CreateViewInput = Omit<ViewModel, keyof BaseModel>;
export type UpdateViewInput = Omit<ViewModel, Exclude<(keyof BaseModel), 'id'>>;
