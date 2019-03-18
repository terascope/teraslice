import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { TypeConfig } from 'xlucene-evaluator';
import * as models from './models';
import { ManagerConfig } from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
 *
 * @todo add multi-tenant support
 * @todo add superadmin/admin/user user type
 * @todo only superadmins can write to to everything
 * @todo an admin should only have access its "client_id"
 * @todo an admin should be able to view api_token without knowing the password
 * @todo an admin can't write to a space, a datatype, or another client
 * @todo authenticated users can query and update their user
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
            authenticateUser(username: String, password: String, api_token: String): User!
            findUser(id: ID!): User!
            findUsers(query: String): [User]!

            findRole(id: ID!): Role!
            findRoles(query: String): [Role]!

            findDataType(id: ID!): DataType!
            findDataTypes(query: String): [DataType]!

            findSpace(id: ID!): Space!
            findSpaces(query: String): [Space]!

            findView(id: ID!): View!
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

    private readonly roles: models.Roles;
    private readonly spaces: models.Spaces;
    private readonly users: models.Users;
    private readonly views: models.Views;
    private readonly dataTypes: models.DataTypes;

    constructor(client: es.Client, config: ManagerConfig) {
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
     * Authenticate user with username and password, or an api_token
     */
    async authenticateUser(args: { username?: string, password?: string, api_token?: string }): Promise<models.PrivateUserModel> {
        if (args.username && args.password) {
            return this.users.authenticate(args.username, args.password);
        }

        if (args.api_token) {
            return this.users.authenticateWithToken(args.api_token);
        }

        throw new ts.TSError('Missing user authentication fields, username, password, or api_token', {
            statusCode: 401
        });
    }

    /**
     * Authenticate user with api_token
     */
    async authenticateWithToken(args: { api_token?: string }): Promise<models.PrivateUserModel> {
        return this.users.authenticateWithToken(args.api_token);
    }

    /**
     * Find user by id
    */
    async findUser(args: { id: string }) {
        return this.users.findById(args.id);
    }

    /**
     * Find all users by a given query
    */
    async findUsers(args: { query?: string } = {}) {
        return this.users.find(args.query);
    }

    /**
     * Create a user
    */
    async createUser(args: { user: models.CreateUserInput, password: string }) {
        await this._validateUserInput(args.user);

        return this.users.createWithPassword(args.user, args.password);
    }

    /**
     * Update user without password
     *
     * This cannot include private information
    */
    async updateUser(args: { user: models.UpdateUserInput }): Promise<models.UserModel> {
        await this._validateUserInput(args.user);

        await this.users.update(args.user);
        return this.users.findById(args.user.id);
    }

    /**
     * Update user's password
    */
    async updatePassword(args: { id: string, password: string }): Promise<boolean> {
        await this.users.updatePassword(args.id, args.password);
        return true;
    }

    /**
     * Generate a new API Token for a user
    */
    async updateToken(args: { id: string }): Promise<string> {
        return await this.users.updateToken(args.id);
    }

    /**
     * Remove user by id
    */
    async removeUser(args: { id: string }): Promise<boolean> {
        const exists = await this.users.exists(args.id);
        if (!exists) return false;

        await this.users.deleteById(args.id);
        return true;
    }

    /**
     * Find role by id
    */
    async findRole(args: { id: string }) {
        return this.roles.findById(args.id);
    }

    /**
     * Find roles by a given query
    */
    async findRoles(args: { query?: string } = {}) {
        return this.roles.find(args.query);
    }

    /**
     * Create a role
    */
    async createRole(args: { role: models.CreateRoleInput }) {
        await this._validateRoleInput(args.role);

        return this.roles.create(args.role);
    }

    /**
     * Update a role
    */
    async updateRole(args: { role: models.UpdateRoleInput }) {
        await this._validateRoleInput(args.role);

        await this.roles.update(args.role);
        return this.roles.findById(args.role.id);
    }

    /**
     * Remove role and remove from any associated views or users
    */
    async removeRole(args: { id: string }) {
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
    async findDataType(args: { id: string }) {
        return this.dataTypes.findByAnyId(args.id);
    }

    /**
     * Find data types by a given query
    */
    async findDataTypes(args: { query?: string } = {}) {
        return this.dataTypes.find(args.query);
    }

    /**
     * Create a data type
    */
    async createDataType(args: { dataType: models.CreateDataTypeInput }) {
        await this._validateDataTypeInput(args.dataType);

        return this.dataTypes.create(args.dataType);
    }

    /**
     * Update a data type
    */
    async updateDataType(args: { dataType: models.UpdateDataTypeInput }) {
        await this._validateDataTypeInput(args.dataType);

        await this.dataTypes.update(args.dataType);
        return this.dataTypes.findById(args.dataType.id);
    }

    /**
     * Remove a data type, this is really dangerous since there are views and spaces linked this
     *
     * @question should we remove the views and spaces associated with the data-type?
    */
    async removeDataType(args: { id: string }) {
        const exists = await this.dataTypes.exists(args.id);
        if (!exists) return false;

        await Promise.all([
            this.dataTypes.deleteById(args.id),
        ]);

        return true;
    }

    /**
     * Find space by id
    */
    async findSpace(args: { id: string }) {
        return this.spaces.findByAnyId(args.id);
    }

    /**
     * Find spaces by a given query
    */
    async findSpaces(args: { query?: string } = {}) {
        return this.spaces.find(args.query);
    }

    /**
     * Create space with optional views
     * If roles are specified on any of the views, it will try automatically
     * attached the space to those roles.
     *
    */
    async createSpace(args: { space: models.CreateSpaceInput }) {
        await this._validateSpaceInput(args.space);

        return this.spaces.create(args.space);
    }

    /**
     * Update a space
    */
    async updateSpace(args: { space: models.UpdateSpaceInput }) {
        await this._validateSpaceInput(args.space);

        await this.spaces.update(args.space);
        return this.spaces.findById(args.space.id);
    }

    /**
     * Remove a space by id, this will clean up any associated views and roles
     */
    async removeSpace(args: { id: string }) {
        const exists = await this.spaces.exists(args.id);
        if (!exists) return false;

        await this.spaces.deleteById(args.id);
        return true;
    }

    /**
     * Find view by id
    */
    async findView(args: { id: string }) {
        return this.views.findById(args.id);
    }

    /**
     * Find views by a given query
    */
    async findViews(args: { query?: string } = {}) {
        return this.views.find(args.query);
    }

    /**
     * Create a view, this will attach to the space and the role
    */
    async createView(args: { view: models.CreateViewInput }) {
        await this._validateViewInput(args.view);

        const result = await this.views.create(args.view);
        return result;
    }

    /**
     * Update a view, this will attach to the space and the role
    */
    async updateView(args: { view: models.UpdateViewInput }) {
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
    async removeView(args: { id: string }) {
        const exists = await this.views.exists(args.id);
        if (!exists) return false;

        await this.spaces.removeViewFromSpaces(args.id);
        await this.views.deleteById(args.id);
        return true;
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getViewForSpace(args: { api_token: string, space: string }): Promise<DataAccessConfig> {
        const user = await this.authenticateUser(args);

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

    private async _validateUserInput(user: Partial<models.UserModel>) {
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
    }

    private async _validateSpaceInput(space: Partial<models.SpaceModel>) {
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
            const validRoles = roles.every((roleId) => {
                if (!space.roles) return true;
                return space.roles.includes(roleId);
            });
            if (!validRoles) {
                throw new ts.TSError('Views must only contain roles specified on the space', {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateRoleInput(role: Partial<models.RoleModel>) {
        if (!role) {
            throw new ts.TSError('Invalid Role Input', {
                statusCode: 422
            });
        }
    }

    private async _validateDataTypeInput(dataType: Partial<models.DataTypeModel>) {
        if (!dataType) {
            throw new ts.TSError('Invalid DataType Input', {
                statusCode: 422
            });
        }
    }

    private async _validateViewInput(view: Partial<models.ViewModel>) {
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
        } else {
            throw new ts.TSError('Missing data_type on view input', {
                statusCode: 422
            });
        }
    }
}

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
    data_type: models.DataTypeModel;

    /**
     * The authenticated user's view of the space
    */
    view: models.ViewModel;
}

export const graphqlQueryMethods: (keyof ACLManager)[] = [
    'authenticateUser',
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
