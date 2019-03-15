import * as es from 'elasticsearch';
import { TSError } from '@terascope/utils';
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
            data_type: String
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            created: String
            updated: String
        }

        input CreateViewInput {
            name: String!
            description: String
            data_type: String!
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
        }

        input UpdateViewInput {
            id: ID!
            name: String
            description: String
            data_type: String
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
        }

        input CreateDefaultViewInput {
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

    async getViewForRole(viewIds: string[], roleId: string) {
        const views = await this.findAll(viewIds);
        const view = views.find((view) => view.roles.includes(roleId));
        if (!view) {
            const errMsg = `No view found for role "${roleId}"`;
            throw new TSError(errMsg, { statusCode: 404 });
        }
        return view;
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
     * The associated data type
    */
    data_type: string;

    /**
     * A list of roles this view applys to
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

export type CreateViewInput = CreateModel<ViewModel>;
export type UpdateViewInput = UpdateModel<ViewModel>;
