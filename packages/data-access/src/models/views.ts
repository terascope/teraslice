import * as es from 'elasticsearch';
import { TSError, Omit } from '@terascope/utils';
import { Base, BaseModel, UpdateModel, CreateModel } from './base';
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
            metadata: JSON
            created: String
            updated: String
        }

        input CreateViewInput {
            name: String
            description: String
            space: String!
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            metadata: JSON
        }

        input UpdateViewInput {
            id: ID!
            name: String
            description: String
            space: String
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            metadata: JSON
        }

        input CreateDefaultViewInput {
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            metadata: JSON
        }

    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, viewsConfig);
    }

    async getViewForRole(roleId: string, spaceId: string) {
        try {
            return await this.findBy({ roles: roleId, space: spaceId });
        } catch (err) {
            if (err && err.statusCode === 404) {
                const errMsg = `No View found for role "${roleId}" and space "${spaceId}"`;
                throw new TSError(errMsg, { statusCode: 404 });
            }
            throw err;
        }
    }

    async removeRoleFromViews(roleId: string) {
        const views = await this.find(`roles: ${roleId}`);
        const promises = views.map(({ id }) => {
            return this.removeFromArray(id, 'roles', roleId);
        });
        await Promise.all(promises);
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

    /**
     * Any metadata for the view
    */
    metadata?: object;
}

export type CreateViewInput = CreateModel<ViewModel>;
export type UpdateViewInput = UpdateModel<ViewModel>;
export type CreateDefaultViewInput = Omit<CreateViewInput, 'name'|'description'|'space'>;
