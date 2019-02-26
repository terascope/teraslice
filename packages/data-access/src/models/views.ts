import * as es from 'elasticsearch';
import defaultsDeep from 'lodash.defaultsdeep';
import { TSError, Omit, concat, isPlainObject } from '@terascope/utils';
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
            space: String!
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

    async getViewForRole(roleId: string, spaceId: string, defaultViewId?: string) {
        try {
            const [view, defaultView] = await Promise.all([
                this.findBy({ roles: roleId, space: spaceId }),
                this._getDefaultView(defaultViewId)
            ]);

            applyDefaultProperty(view, defaultView, 'prevent_prefix_wildcard');
            applyDefaultProperty(view, defaultView, 'constraint');
            applyDefaultProperty(view, defaultView, 'metadata');
            applyDefaultProperty(view, defaultView, 'excludes');
            applyDefaultProperty(view, defaultView, 'includes');
            return view;
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

    private async _getDefaultView(viewId?: string): Promise<CoreViewObj> {
        if (!viewId) return {};

        const view = await this.findById(viewId);
        return {
            constraint: view.constraint,
            includes: view.includes,
            excludes: view.excludes,
            prevent_prefix_wildcard: view.prevent_prefix_wildcard,
            metadata: view.metadata,
        };
    }
}

function applyDefaultProperty(view: CoreViewObj, defaultView: CoreViewObj, prop: keyof CoreViewObj) {
    if (view[prop] != null && defaultView[prop] == null) return;

    if (view[prop] == null && defaultView[prop] != null) {
        view[prop] = defaultView[prop];
    } else if (view[prop] != null && defaultView[prop] != null)  {
        const val = view[prop];
        const defaultVal = defaultView[prop];
        if (Array.isArray(val) && Array.isArray(defaultVal)) {
            view[prop] = concat(defaultVal, val);
        }
        if (isPlainObject(val)) {
            view[prop] = defaultsDeep({}, val, defaultVal);
        }
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

type CoreViewProperties = 'metadata'|'prevent_prefix_wildcard'|'constraint'|'includes'|'excludes';
type CoreViewObj = Pick<ViewModel, CoreViewProperties>;

export type CreateViewInput = Omit<ViewModel, keyof BaseModel>;
export type UpdateViewInput = Omit<ViewModel, Exclude<(keyof BaseModel), 'id'>>;
