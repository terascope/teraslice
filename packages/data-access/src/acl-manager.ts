import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { CreateRecordInput, UpdateRecordInput } from 'elasticsearch-store';
import { TypeConfig, LuceneQueryAccess } from 'xlucene-evaluator';
import * as models from './models';
import { ManagerConfig } from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
 *
 * @todo add multi-tenant support
 * @todo only superadmins can write to to everything
 * @todo an admin should only have access its "client_id"
 * @todo users should not be elevate their permissions
 * @todo add read permissions for roles, views, spaces, and data types
*/
export class ACLManager {
    static GraphQLSchema = `
        type DataAccessConfig {
            user_id: String!
            role_id: String!
            search_config: SpaceSearchConfig
            streaming_config: SpaceStreamingConfig
            data_type: DataType!
            view: View!
        }

        type Query {
            authenticate(username: String, password: String, api_token: String): User!
            findUser(id: ID!): User
            findUsers(query: String): [User]!

            findRole(id: ID!): Role
            findRoles(query: String): [Role]!

            findDataType(id: ID!): DataType
            findDataTypes(query: String): [DataType]!

            findSpace(id: ID!): Space
            findSpaces(query: String): [Space]!

            findView(id: ID!): View
            findViews(query: String): [View]!

            getViewForSpace(api_token: String!, space: String!): DataAccessConfig!
        }

        type Mutation {
            createUser(user: CreateUserInput!, password: String!): User!
            updateUser(user: UpdateUserInput!): User!
            updatePassword(id: String!, password: String!): Boolean!
            updateToken(id: String!): String!
            removeUser(id: ID!): Boolean!

            createRole(role: CreateRoleInput!): Role!
            updateRole(role: UpdateRoleInput!): Role!
            removeRole(id: ID!): Boolean!

            createDataType(dataType: CreateDataTypeInput!): DataType!
            updateDataType(dataType: UpdateDataTypeInput!): DataType!
            removeDataType(id: ID!): Boolean!

            createView(view: CreateViewInput!): View!
            updateView(view: UpdateViewInput!): View!
            removeView(id: ID!): Boolean!

            createSpace(space: CreateSpaceInput!): Space!
            updateSpace(space: UpdateSpaceInput!): Space!
            removeSpace(id: ID!): Boolean!
        }
    `;

    logger: ts.Logger;

    private readonly roles: models.Roles;
    private readonly spaces: models.Spaces;
    private readonly users: models.Users;
    private readonly views: models.Views;
    private readonly dataTypes: models.DataTypes;

    constructor(client: es.Client, config: ManagerConfig) {
        this.logger = config.logger || ts.debugLogger('acl-manager');
        this.roles = new models.Roles(client, config);
        this.spaces = new models.Spaces(client, config);
        this.users = new models.Users(client, config);
        this.views = new models.Views(client, config);
        this.dataTypes = new models.DataTypes(client, config);
    }

     /**
     * Initialize all index stores
     */
    async initialize() {
        await Promise.all([
            this.roles.initialize(),
            this.spaces.initialize(),
            this.users.initialize(),
            this.views.initialize(),
            this.dataTypes.initialize(),
        ]);
    }

    /**
     * Shutdown all index stores
     */
    async shutdown() {
        await Promise.all([
            this.roles.shutdown(),
            this.spaces.shutdown(),
            this.users.shutdown(),
            this.views.shutdown(),
            this.dataTypes.shutdown(),
        ]);
    }

    /**
     * Authenticate user with an api_token or username and password
     */
    async authenticate(args: { username?: string, password?: string, api_token?: string }, authUser?: models.User): Promise<models.User> {
        if (args.username && args.password) {
            return this.users.authenticate(args.username, args.password);
        }

        if (args.api_token) {
            return this.users.authenticateWithToken(args.api_token);
        }

        throw new ts.TSError('Missing credentials', {
            statusCode: 401
        });
    }

    /**
     * Find user by id
    */
    async findUser(args: { id: string }, authUser?: models.User) {
        const type = await this._getUserType(authUser);

        const authUserId = authUser && authUser.id;
        if (type !== 'SUPERADMIN') {
            const clientId = await this._getClientId(authUser);
            const canSeeToken = type === 'ADMIN' || authUserId === args.id;

            const queryAccess = new LuceneQueryAccess<models.User>({
                constraint: clientId ? `client_id:${clientId}` : undefined,
                excludes:  canSeeToken ? ['hash', 'salt'] : ['api_token', 'hash', 'salt'],
            });

            return this.users.findById(args.id, queryAccess);
        }
        return this.users.findById(args.id);
    }

    /**
     * Find all users by a given query
    */
    async findUsers(args: { query?: string } = {}, authUser?: models.User) {
        const type = await this._getUserType(authUser);
        if (type !== 'SUPERADMIN') {
            const clientId = await this._getClientId(authUser);
            const canSeeToken = type === 'ADMIN';

            const queryAccess = new LuceneQueryAccess<models.User>({
                constraint: clientId ? `client_id:${clientId}` : undefined,
                excludes: canSeeToken ? ['hash', 'salt'] : ['api_token', 'hash', 'salt'],
                allow_implicit_queries: true
            });
            return this.users.find(args.query, {}, queryAccess);
        }
        return this.users.find(args.query);
    }

    /**
     * Create a user
    */
    async createUser(args: { user: models.CreateUserInput, password: string }, authUser?: models.User) {
        await this._validateUserInput(args.user, authUser);

        return this.users.createWithPassword(args.user, args.password);
    }

    /**
     * Update user without password
     *
     * This cannot include private information
    */
    async updateUser(args: { user: models.UpdateUserInput }, authUser?: models.User): Promise<models.User> {
        await this._validateUserInput(args.user, authUser);

        await this.users.update(args.user);
        return this.users.findById(args.user.id);
    }

    /**
     * Update user's password
    */
    async updatePassword(args: { id: string, password: string }, authUser?: models.User): Promise<boolean> {
        await this._validateUserInput({ id: args.id }, authUser);
        await this.users.updatePassword(args.id, args.password);
        return true;
    }

    /**
     * Generate a new API Token for a user
    */
    async updateToken(args: { id: string }, authUser?: models.User): Promise<string> {
        await this._validateUserInput({ id: args.id }, authUser);
        return await this.users.updateToken(args.id);
    }

    /**
     * Remove user by id
    */
    async removeUser(args: { id: string }, authUser?: models.User): Promise<boolean> {
        const type = await this._getUserType(authUser);
        if (authUser && type === 'USER' && args.id === authUser.id) {
            throw new ts.TSError('User doesn\'t have permission to remove itself', {
                statusCode: 403
            });
        }

        await this._validateUserInput({ id: args.id }, authUser);

        const exists = await this.users.exists(args.id);
        if (!exists) return false;

        await this._validateUserInput({ id: args.id }, authUser);
        await this.users.deleteById(args.id);
        return true;
    }

    /**
     * Find role by id
    */
    async findRole(args: { id: string }, authUser?: models.User) {
        return this.roles.findById(args.id);
    }

    /**
     * Find roles by a given query
    */
    async findRoles(args: { query?: string } = {}, authUser?: models.User) {
        return this.roles.find(args.query);
    }

    /**
     * Create a role
    */
    async createRole(args: { role: CreateRecordInput<models.Role> }, authUser?: models.User) {
        await this._validateCanCreate('roles', authUser);
        await this._validateRoleInput(args.role);

        return this.roles.create(args.role);
    }

    /**
     * Update a role
    */
    async updateRole(args: { role: UpdateRecordInput<models.Role> }, authUser?: models.User) {
        await this._validateCanUpdate('roles', authUser);
        await this._validateRoleInput(args.role);

        await this.roles.update(args.role);
        return this.roles.findById(args.role.id);
    }

    /**
     * Remove role and remove from any associated views or users
    */
    async removeRole(args: { id: string }, authUser?: models.User) {
        await this._validateCanRemove('roles', authUser);

        const exists = await this.roles.exists(args.id);
        if (!exists) return false;

        await Promise.all([
            this.views.removeRoleFromViews(args.id),
            this.users.removeRoleFromUsers(args.id),
            this.roles.deleteById(args.id),
        ]);

        return true;
    }

    /**
     * Find data type by id
    */
    async findDataType(args: { id: string }, authUser?: models.User) {
        return this.dataTypes.findById(args.id);
    }

    /**
     * Find data types by a given query
    */
    async findDataTypes(args: { query?: string } = {}, authUser?: models.User) {
        return this.dataTypes.find(args.query);
    }

    /**
     * Create a data type
    */
    async createDataType(args: { dataType: CreateRecordInput<models.DataType> }, authUser?: models.User) {
        await this._validateCanCreate('data types', authUser);
        await this._validateDataTypeInput(args.dataType);

        return this.dataTypes.create(args.dataType);
    }

    /**
     * Update a data type
    */
    async updateDataType(args: { dataType: UpdateRecordInput<models.DataType> }, authUser?: models.User) {
        await this._validateCanUpdate('data types', authUser);
        await this._validateDataTypeInput(args.dataType);

        await this.dataTypes.update(args.dataType);
        return this.dataTypes.findById(args.dataType.id);
    }

    /**
     * Remove a data type, this is really dangerous since there are views and spaces linked this
     *
     * @question should we remove the views and spaces associated with the data-type?
    */
    async removeDataType(args: { id: string }, authUser?: models.User) {
        await this._validateCanRemove('data types', authUser);

        const exists = await this.dataTypes.exists(args.id);
        if (!exists) return false;

        await this.dataTypes.deleteById(args.id);

        return true;
    }

    /**
     * Find space by id
    */
    async findSpace(args: { id: string }, authUser?: models.User) {
        return this.spaces.findById(args.id);
    }

    /**
     * Find spaces by a given query
    */
    async findSpaces(args: { query?: string } = {}, authUser?: models.User) {
        return this.spaces.find(args.query);
    }

    /**
     * Create space with optional views
     * If roles are specified on any of the views, it will try automatically
     * attached the space to those roles.
     *
    */
    async createSpace(args: { space: CreateRecordInput<models.Space> }, authUser?: models.User) {
        await this._validateCanCreate('spaces', authUser);
        await this._validateSpaceInput(args.space);

        return this.spaces.create(args.space);
    }

    /**
     * Update a space
    */
    async updateSpace(args: { space: UpdateRecordInput<models.Space> }, authUser?: models.User) {
        await this._validateCanUpdate('spaces', authUser);
        await this._validateSpaceInput(args.space);

        await this.spaces.update(args.space);
        return this.spaces.findById(args.space.id);
    }

    /**
     * Remove a space by id, this will clean up any associated views and roles
     */
    async removeSpace(args: { id: string }, authUser?: models.User) {
        await this._validateCanRemove('spaces', authUser);

        const exists = await this.spaces.exists(args.id);
        if (!exists) return false;

        await this.spaces.deleteById(args.id);
        return true;
    }

    /**
     * Find view by id
    */
    async findView(args: { id: string }, authUser?: models.User) {
        return this.views.findById(args.id);
    }

    /**
     * Find views by a given query
    */
    async findViews(args: { query?: string } = {}, authUser?: models.User) {
        return this.views.find(args.query);
    }

    /**
     * Create a view, this will attach to the space and the role
    */
    async createView(args: { view: CreateRecordInput<models.View> }, authUser?: models.User) {
        await this._validateCanCreate('views', authUser);
        await this._validateViewInput(args.view);

        const result = await this.views.create(args.view);
        return result;
    }

    /**
     * Update a view, this will attach to the space and the role
    */
    async updateView(args: { view: UpdateRecordInput<models.View> }, authUser?: models.User) {
        await this._validateCanUpdate('views', authUser);

        const { view } = args;
        await this._validateViewInput(view);

        let oldDataType: string|undefined;
        if (args.view.data_type) {
            const currentView = await this.views.findById(view.id);
            oldDataType = currentView.data_type;
        }

        if (args.view.data_type) {
            if (oldDataType && oldDataType !== args.view.data_type) {
                throw new ts.TSError('Cannot not update the data_type on a view', {
                    statusCode: 422
                });
            }
        }

        await this.views.update(args.view);
        return this.views.findById(args.view.id);
    }

    /**
     * Remove views and remove from any associated spaces
    */
    async removeView(args: { id: string }, authUser?: models.User) {
        await this._validateCanRemove('views', authUser);

        const exists = await this.views.exists(args.id);
        if (!exists) return false;

        await this.spaces.removeViewFromSpaces(args.id);
        await this.views.deleteById(args.id);
        return true;
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getViewForSpace(args: { api_token: string, space: string }, authUser?: models.User): Promise<DataAccessConfig> {
        const user = await this.authenticate(args);

        if (!user.role) {
            const msg = `User "${user.username}" is not assigned to a role`;
            throw new ts.TSError(msg, { statusCode: 403 });
        }

        const [role, space] = await Promise.all([
            this.roles.findById(user.role),
            this.spaces.findByAnyId(args.space),
        ]);

        const hasAccess = space.roles.includes(user.role);
        if (!hasAccess) {
            const msg = `User "${user.username}" does not have access to space "${space.id}"`;
            throw new ts.TSError(msg, { statusCode: 403 });
        }

        const [view, dataType] = await Promise.all([
            this.views.getViewOfSpace(space, role.id),
            this.dataTypes.findById(space.data_type)
        ]);

        return this._parseDataAccessConfig({
            user_id: user.id,
            role_id: role.id,
            space_id: space.id,
            search_config: space.search_config,
            streaming_config: space.streaming_config,
            data_type: dataType,
            view
        });
    }

    private async _getClientId(user?: Partial<models.User>): Promise<number> {
        if (!user) return 0;
        if (user.id && user.client_id == null) {
            return (await this.users.findById(user.id)).client_id || 0;
        }
        return user.client_id || 0;
    }

    private async _getUserType(user?: Partial<models.User>): Promise<models.UserType> {
        if (!user) return 'SUPERADMIN';
        if (user.id && user.type == null) {
            return (await this.users.findById(user.id)).type || 'USER';
        }
        return user.type || 'USER';
    }

    private _parseDataAccessConfig(config: DataAccessConfig): DataAccessConfig {
        const searchConfig = config.search_config!;

        if (searchConfig.default_date_field) {
            searchConfig.default_date_field = ts.trimAndToLower(searchConfig.default_date_field);
        }

        if (searchConfig.default_geo_field) {
            searchConfig.default_geo_field = ts.trimAndToLower(searchConfig.default_geo_field);
        }

        const typeConfig: TypeConfig = config.data_type.type_config || {};

        const dateField = searchConfig.default_date_field;
        if (dateField && !typeConfig[dateField]) {
            typeConfig[dateField] = 'date';
        }

        const geoField = searchConfig.default_geo_field;
        if (geoField && !typeConfig[geoField]) {
            typeConfig[geoField] = 'geo';
        }

        config.data_type.type_config = typeConfig;
        return config;
    }

    private async _validateUserInput(user: Partial<models.User>, authUser?: models.User) {
        if (!user) {
            throw new ts.TSError('Invalid User Input', {
                statusCode: 422
            });
        }

        if (this.users.isPrivateUser(user)) {
            const fields = models.Users.PrivateFields.join(', ');
            throw new ts.TSError(`Cannot update restricted fields, ${fields}`, {
                statusCode: 422,
            });
        }

        if (user.role) {
            const exists = await this.roles.exists(user.role);
            if (!exists) {
                throw new ts.TSError(`Missing role with user, ${user.role}`, {
                    statusCode: 422
                });
            }
        }

        const authType = await this._getUserType(authUser);
        const userType = await this._getUserType(user);
        const authClientId = await this._getClientId(authUser);
        const userClientId = await this._getClientId(user);

        if (authType === 'ADMIN' && authClientId !== userClientId) {
            throw new ts.TSError('User doesn\'t have permission to write to users outside of the their client id', {
                statusCode: 403
            });
        }

        if (authType === 'ADMIN' && userType === 'SUPERADMIN') {
            throw new ts.TSError('User doesn\'t have permission to write to users with SUPERADMIN access', {
                statusCode: 403
            });
        }

        if (authUser && authType === 'USER' && authUser.id !== user.id) {
            throw new ts.TSError('User doesn\'t have permission to write to other users', {
                statusCode: 403
            });
        }
    }

    private async _validateSpaceInput(space: Partial<models.Space>) {
        if (!space) {
            throw new ts.TSError('Invalid Space Input', {
                statusCode: 422
            });
        }

        if (space.roles) {
            space.roles = ts.uniq(space.roles);

            const exists = await this.roles.exists(space.roles);
            if (!exists) {
                const rolesStr = space.roles.join(', ');
                throw new ts.TSError(`Missing roles with space, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }

        if (space.data_type) {
            const exists = await this.dataTypes.exists(space.data_type);
            if (!exists) {
                throw new ts.TSError(`Missing data_type ${space.data_type}`, {
                    statusCode: 422
                });
            }
        }

        if (space.views) {
            space.views = ts.uniq(space.views);

            const views = await this.views.findAll(space.views);
            if (views.length !== space.views.length) {
                const viewsStr = space.views.join(', ');
                throw new ts.TSError(`Missing views with space, ${viewsStr}`, {
                    statusCode: 422
                });
            }

            const dataTypes = views.map(view => view.data_type);
            if (space.data_type && dataTypes.length && !dataTypes.includes(space.data_type)) {
                throw new ts.TSError('Views must have the same data type', {
                    statusCode: 422
                });
            }

            const roles: string[] = [];
            views.forEach((view) => {
                roles.push(...ts.uniq(view.roles));
            });
            if (ts.uniq(roles).length !== roles.length) {
                throw new ts.TSError('Multiple views cannot contain the same role within a space', {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateRoleInput(role: Partial<models.Role>) {
        if (!role) {
            throw new ts.TSError('Invalid Role Input', {
                statusCode: 422
            });
        }
    }

    private async _validateDataTypeInput(dataType: Partial<models.DataType>) {
        if (!dataType) {
            throw new ts.TSError('Invalid DataType Input', {
                statusCode: 422
            });
        }
    }

    private async _validateViewInput(view: Partial<models.View>) {
        if (!view) {
            throw new ts.TSError('Invalid View Input', {
                statusCode: 422
            });
        }

        if (view.roles) {
            view.roles = ts.uniq(view.roles);

            const exists = await this.roles.exists(view.roles);
            if (!exists) {
                const rolesStr = view.roles.join(', ');
                throw new ts.TSError(`Missing roles with view, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }

        if (view.data_type) {
            const exists = await this.dataTypes.exists(view.data_type);
            if (!exists) {
                throw new ts.TSError(`Missing data_type ${view.data_type}`, {
                    statusCode: 422
                });
            }
        }
    }

    /**
     * Validate a user can create a resource
     *
     * This works for all models except users
    */
    private async _validateCanCreate(resource: Resource, authUser?: models.User) {
        const type = await this._getUserType(authUser);
        const resources: Resource[] = ['spaces', 'data types'];

        if (type === 'USER' || (type === 'ADMIN' && resources.includes(resource))) {
            throw new ts.TSError(`User doesn't have permission to create ${resource}`, {
                statusCode: 403
            });
        }
    }

    /**
     * Validate a user can update a resource
     *
     * This works for all models except users
    */
    private async _validateCanUpdate(resource: Resource, authUser?: models.User) {
        const type = await this._getUserType(authUser);
        if (type === 'USER') {
            throw new ts.TSError(`User doesn't have permission to update ${resource}`, {
                statusCode: 403
            });
        }
    }

    /**
     * Validate a user can remove a resource
     *
     * This works for all models except users
    */
    private async _validateCanRemove(resource: Resource, authUser?: models.User) {
        const type = await this._getUserType(authUser);
        const resources: Resource[] = ['spaces', 'data types'];
        if (type === 'USER' || (type === 'ADMIN' && resources.includes(resource))) {
            throw new ts.TSError(`User doesn't have permission to remove ${resource}`, {
                statusCode: 403
            });
        }
    }
}

type Resource = 'roles'|'data types'|'views'|'spaces';

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and SearchAccess
*/
export interface DataAccessConfig {
    /**
     * The id of the user authenticated
    */
    user_id: string;

    /**
     * The id of the Role used
    */
    role_id: string;

    /**
     * The id of the space
    */
    space_id: string;

    /**
     * The space's search configuration
    */
    search_config?: models.SpaceSearchConfig;

    /**
     * The space's streaming configuration
    */
    streaming_config?: models.SpaceStreamingConfig;

    /**
     * The data type associated with the view
    */
    data_type: models.DataType;

    /**
     * The authenticated user's view of the space
    */
    view: models.View;
}

export const graphqlQueryMethods: (keyof ACLManager)[] = [
    'authenticate',
    'findUser',
    'findUsers',
    'findRole',
    'findRoles',
    'findDataType',
    'findDataTypes',
    'findSpace',
    'findSpaces',
    'findView',
    'findViews',
    'getViewForSpace',
];

export const graphqlMutationMethods: (keyof ACLManager)[] = [
    'createUser',
    'updateUser',
    'updatePassword',
    'updateToken',
    'removeUser',
    'createRole',
    'updateRole',
    'removeRole',
    'createDataType',
    'updateDataType',
    'removeDataType',
    'createSpace',
    'updateSpace',
    'removeSpace',
    'createView',
    'updateView',
    'removeView',
];

export const graphqlSchemas = [
    ACLManager.GraphQLSchema,
    models.DataTypes.GraphQLSchema,
    models.Roles.GraphQLSchema,
    models.Spaces.GraphQLSchema,
    models.Users.GraphQLSchema,
    models.Views.GraphQLSchema,
];
