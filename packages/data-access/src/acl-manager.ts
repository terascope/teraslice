import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { DataTypeConfig, LATEST_VERSION } from '@terascope/data-types';
import { CreateRecordInput, UpdateRecordInput } from 'elasticsearch-store';
import { CachedQueryAccess } from 'xlucene-evaluator';
import * as models from './models';
import * as i from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
 *
 * @todo ensure client ids match when associating records
 */
export class ACLManager {
    logger: ts.Logger;

    private readonly _roles: models.Roles;
    private readonly _spaces: models.Spaces;
    private readonly _users: models.Users;
    private readonly _views: models.Views;
    private readonly _dataTypes: models.DataTypes;
    private readonly _queryAccess = new CachedQueryAccess();

    constructor(client: es.Client, config: i.ManagerConfig) {
        this.logger = config.logger || ts.debugLogger('acl-manager');
        this._roles = new models.Roles(client, config);
        this._spaces = new models.Spaces(client, config);
        this._users = new models.Users(client, config);
        this._views = new models.Views(client, config);
        this._dataTypes = new models.DataTypes(client, config);
    }

    /**
     * Initialize all index stores
     */
    async initialize() {
        await Promise.all([
            this._roles.initialize(),
            this._spaces.initialize(),
            this._users.initialize(),
            this._views.initialize(),
            this._dataTypes.initialize(),
        ]);
    }

    /**
     * Shutdown all index stores
     */
    async shutdown() {
        await Promise.all([
            this._roles.shutdown(),
            this._spaces.shutdown(),
            this._users.shutdown(),
            this._views.shutdown(),
            this._dataTypes.shutdown(),
        ]);
    }

    /**
     * Authenticate user with an api_token or username and password
     */
    async authenticate(args: { username?: string; password?: string; token?: string }): Promise<models.User> {
        if (args.username && args.password) {
            const user = await this._users.authenticate(args.username, args.password);
            return this._postProcessAuthenticatedUser(user);
        }

        if (args.token) {
            const user = await this._users.authenticateWithToken(args.token);
            return this._postProcessAuthenticatedUser(user);
        }

        throw new ts.TSError('Missing credentials', {
            statusCode: 401,
        });
    }

    /**
     * Find user by id
     */
    async findUser(args: i.FindOneArgs<models.User>, authUser: i.AuthUser) {
        const user = await this._users.findByAnyId(args.id, args, this._getUserQueryAccess(authUser));
        return this._postProcessAuthenticatedUser(user);
    }

    /**
     * Find all users by a given query
     */
    async findUsers(args: i.FindArgs<models.User> = {}, authUser: i.AuthUser) {
        return this._users.find(args.query, args, this._getUserQueryAccess(authUser));
    }

    /**
     * Count users by a given query
     */
    async countUsers(args: { query?: string } = {}, authUser: i.AuthUser) {
        return this._users.count(args.query, this._getUserQueryAccess(authUser));
    }

    /**
     * Create a user
     */
    async createUser(args: { user: models.CreateUserInput; password: string }, authUser: i.AuthUser) {
        await this._validateUserInput(args.user, authUser);

        const user = await this._users.createWithPassword(args.user, args.password);
        return this._postProcessAuthenticatedUser(user);
    }

    /**
     * Update user without password
     *
     * This cannot include private information
     */
    async updateUser(args: { user: models.UpdateUserInput; password?: string }, authUser: i.AuthUser): Promise<models.User> {
        await this._validateUserInput(args.user, authUser);
        await this._users.update(args.user);
        if (args.password) {
            await this._users.updatePassword(args.user.id, args.password);
        }

        const queryAccess = this._getUserQueryAccess(authUser);
        return this._users.findById(args.user.id, {}, queryAccess);
    }

    /**
     * Update user's password
     */
    async updatePassword(args: { id: string; password: string }, authUser: i.AuthUser): Promise<boolean> {
        await this._validateUserInput({ id: args.id }, authUser);
        await this._users.updatePassword(args.id, args.password);
        return true;
    }

    /**
     * Generate a new API Token for a user
     */
    async updateToken(args: { id: string }, authUser: i.AuthUser): Promise<string> {
        await this._validateUserInput({ id: args.id }, authUser);
        return this._users.updateToken(args.id);
    }

    /**
     * Remove user by id
     */
    async removeUser(args: { id: string }, authUser: i.AuthUser): Promise<boolean> {
        const type = this._getUserType(authUser);
        if (authUser && type === 'USER' && args.id === authUser.id) {
            throw new ts.TSError("User doesn't have permission to remove itself", {
                statusCode: 403,
            });
        }

        await this._validateUserInput({ id: args.id }, authUser);

        const exists = await this._users.exists(args.id);
        if (!exists) return false;

        await this._users.deleteById(args.id);
        return true;
    }

    /**
     * Find role by id
     */
    async findRole(args: i.FindOneArgs<models.Role>, authUser: i.AuthUser) {
        return this._roles.findByAnyId(args.id, this._getRoleQueryAccess(authUser));
    }

    /**
     * Find roles by a given query
     */
    async findRoles(args: i.FindArgs<models.Role> = {}, authUser: i.AuthUser) {
        return this._roles.find(args.query, args, this._getRoleQueryAccess(authUser));
    }

    /**
     * Count roles by a given query
     */
    async countRoles(args: { query?: string } = {}, authUser: i.AuthUser) {
        return this._roles.count(args.query, this._getRoleQueryAccess(authUser));
    }

    /**
     * Create a role
     */
    async createRole(args: { role: CreateRecordInput<models.Role> }, authUser: i.AuthUser) {
        await this._validateCanCreate('Role', authUser);
        await this._validateRoleInput(args.role, authUser);

        return this._roles.create(args.role);
    }

    /**
     * Update a role
     */
    async updateRole(args: { role: UpdateRecordInput<models.Role> }, authUser: i.AuthUser) {
        await this._validateCanUpdate('Role', authUser);
        await this._validateRoleInput(args.role, authUser);

        await this._roles.update(args.role);
        return this._roles.findById(args.role.id, {}, this._getRoleQueryAccess(authUser));
    }

    /**
     * Remove role and remove from any associated views or users
     */
    async removeRole(args: { id: string }, authUser: i.AuthUser) {
        await this._validateCanRemove('Role', authUser);

        const exists = await this._roles.exists(args.id);
        if (!exists) return false;

        await Promise.all([
            this._views.removeRoleFromViews(args.id),
            this._users.removeRoleFromUsers(args.id),
            this._roles.deleteById(args.id),
        ]);

        return true;
    }

    /**
     * Find data type by id
     */
    async findDataType(args: i.FindOneArgs<models.DataType>, authUser: i.AuthUser) {
        return this._dataTypes.findByAnyId(args.id, args, this._getDataTypeQueryAccess(authUser));
    }

    /**
     * Find data types by a given query
     */
    async findDataTypes(args: i.FindArgs<models.DataType> = {}, authUser: i.AuthUser) {
        return this._dataTypes.find(args.query, args, this._getDataTypeQueryAccess(authUser));
    }

    /**
     * Count data types by a given query
     */
    async countDataTypes(args: { query?: string } = {}, authUser: i.AuthUser) {
        return this._dataTypes.count(args.query, this._getDataTypeQueryAccess(authUser));
    }

    /**
     * Create a data type
     */
    async createDataType(args: { dataType: CreateRecordInput<models.DataType> }, authUser: i.AuthUser) {
        await this._validateCanCreate('DataType', authUser);
        await this._validateDataTypeInput(args.dataType, authUser);

        return this._dataTypes.create(args.dataType);
    }

    /**
     * Update a data type
     */
    async updateDataType(args: { dataType: UpdateRecordInput<models.DataType> }, authUser: i.AuthUser) {
        await this._validateCanUpdate('DataType', authUser);
        await this._validateDataTypeInput(args.dataType, authUser);

        await this._dataTypes.update(args.dataType);
        return this._dataTypes.findById(args.dataType.id, {}, this._getDataTypeQueryAccess(authUser));
    }

    /**
     * Remove a data type, this is really dangerous since there are views and spaces linked this
     *
     * @question should we remove the views and spaces associated with the data-type?
     */
    async removeDataType(args: { id: string }, authUser: i.AuthUser) {
        await this._validateCanRemove('DataType', authUser);

        const exists = await this._dataTypes.exists(args.id);
        if (!exists) return false;

        await this._dataTypes.deleteById(args.id);

        return true;
    }

    /**
     * Find space by id
     */
    async findSpace(args: i.FindOneArgs<models.Space>, authUser: i.AuthUser) {
        return this._spaces.findByAnyId(args.id, args, this._getSpaceQueryAccess(authUser));
    }

    /**
     * Find spaces by a given query
     */
    async findSpaces(args: i.FindArgs<models.Space> = {}, authUser: i.AuthUser) {
        return this._spaces.find(args.query, args, this._getSpaceQueryAccess(authUser));
    }

    /**
     * Count spaces by a given query
     */
    async countSpaces(args: { query?: string } = {}, authUser: i.AuthUser) {
        return this._spaces.count(args.query, this._getSpaceQueryAccess(authUser));
    }

    /**
     * Create space with optional views
     * If roles are specified on any of the views, it will try automatically
     * attached the space to those roles.
     *
     */
    async createSpace(args: { space: CreateRecordInput<models.Space> }, authUser: i.AuthUser) {
        await this._validateCanCreate('Space', authUser);
        await this._validateSpaceInput(args.space, authUser);

        const endpoint = ts.get(args, 'space.endpoint');
        if (models.Spaces.ReservedEndpoints.includes(endpoint)) {
            throw new ts.TSError(`Space endpoint "${endpoint}" is reserved`, {
                statusCode: 422,
            });
        }

        return this._spaces.create(args.space);
    }

    /**
     * Update a space
     */
    async updateSpace(args: { space: UpdateRecordInput<models.Space> }, authUser: i.AuthUser) {
        await this._validateCanUpdate('Space', authUser);
        await this._validateSpaceInput(args.space, authUser);

        const endpoint = ts.get(args, 'space.endpoint');
        if (models.Spaces.ReservedEndpoints.includes(endpoint)) {
            throw new ts.TSError(`Space endpoint ${endpoint} is reserved`, {
                statusCode: 422,
            });
        }

        await this._spaces.update(args.space);
        return this._spaces.findById(args.space.id, {}, this._getSpaceQueryAccess(authUser));
    }

    /**
     * Remove a space by id, this will clean up any associated views and roles
     */
    async removeSpace(args: { id: string }, authUser: i.AuthUser) {
        await this._validateCanRemove('Space', authUser);

        const exists = await this._spaces.exists(args.id);
        if (!exists) return false;

        await this._spaces.deleteById(args.id);
        return true;
    }

    /**
     * Find view by id
     */
    async findView(args: i.FindOneArgs<models.View>, authUser: i.AuthUser) {
        return this._views.findByAnyId(args.id, args, this._getViewQueryAccess(authUser));
    }

    /**
     * Find views by a given query
     */
    async findViews(args: i.FindArgs<models.View> = {}, authUser: i.AuthUser) {
        return this._views.find(args.query, args, this._getViewQueryAccess(authUser));
    }

    /**
     * Count views by a given query
     */
    async countViews(args: { query?: string } = {}, authUser: i.AuthUser) {
        return this._views.count(args.query, this._getViewQueryAccess(authUser));
    }

    /**
     * Create a view, this will attach to the space and the role
     */
    async createView(args: { view: CreateRecordInput<models.View> }, authUser: i.AuthUser) {
        await this._validateCanCreate('View', authUser);
        await this._validateViewInput(args.view, authUser);

        const result = await this._views.create(args.view);
        return result;
    }

    /**
     * Update a view, this will attach to the space and the role
     */
    async updateView(args: { view: UpdateRecordInput<models.View> }, authUser: i.AuthUser) {
        await this._validateCanUpdate('View', authUser);

        const { view } = args;
        await this._validateViewInput(view, authUser);

        let oldDataType: string | undefined;
        if (args.view.data_type) {
            const currentView = await this._views.findById(view.id);
            oldDataType = currentView.data_type;
        }

        if (args.view.data_type) {
            if (oldDataType && oldDataType !== args.view.data_type) {
                throw new ts.TSError('Cannot not update the data_type on a view', {
                    statusCode: 422,
                });
            }
        }

        await this._views.update(args.view);
        return this._views.findById(args.view.id, {}, this._getViewQueryAccess(authUser));
    }

    /**
     * Remove views and remove from any associated spaces
     */
    async removeView(args: { id: string }, authUser: i.AuthUser) {
        await this._validateCanRemove('View', authUser);

        const exists = await this._views.exists(args.id);
        if (!exists) return false;

        await this._spaces.removeViewFromSpaces(args.id);
        await this._views.deleteById(args.id);
        return true;
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getViewForSpace(args: { token?: string; space: string }, authUser: i.AuthUser): Promise<i.DataAccessConfig> {
        // if the token is provided use the authenticated user
        const user = args.token || !authUser ? await this.authenticate(args) : authUser;

        if (!user.role) {
            const msg = `User "${user.username}" is not assigned to a role`;
            throw new ts.TSError(msg, { statusCode: 403 });
        }

        const [role, space] = await Promise.all([this._roles.findById(user.role), this._spaces.findByAnyId(args.space)]);

        const hasAccess = space.roles.includes(user.role);
        if (!hasAccess) {
            const msg = `User "${user.username}" does not have access to space "${space.endpoint}"`;
            throw new ts.TSError(msg, { statusCode: 403 });
        }

        const [view, dataType] = await Promise.all([this._views.getViewOfSpace(space, role), this._dataTypes.findById(space.data_type)]);

        if (user.type !== 'SUPERADMIN') {
            const clientIds = [role.client_id, space.client_id, dataType.client_id, view.client_id];
            if (!clientIds.every(id => id === user.client_id)) {
                const msg = `User "${user.username}" does not have permission to access space "${space.endpoint}"`;
                throw new ts.TSError(msg, { statusCode: 403 });
            }
        }

        return this._parseDataAccessConfig({
            user_id: user.id,
            role_id: role.id,
            space_id: space.id,
            type: space.type,
            space_endpoint: space.endpoint,
            config: space.config,
            data_type: dataType,
            view,
        });
    }

    private async _postProcessAuthenticatedUser(user: models.User): Promise<models.User> {
        if (user.role) {
            const role = await this._roles.findById(user.role, {
                includes: ['name'],
            });
            user.role_name = role.name;
        }

        // remove hidden properties
        delete user.hash;
        delete user.salt;

        return user;
    }

    private _getUserQueryAccess(authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const clientId = this._getUserClientId(authUser);
        let constraint = '';
        const excludes: (keyof models.User)[] = [];
        excludes.push('hash', 'salt');

        if (clientId > 0) {
            constraint += `client_id:${clientId}`;
        }

        if (type === 'USER') {
            if (authUser && authUser.id) {
                excludes.push('client_id');
                if (constraint) constraint += ' AND ';
                constraint += `id: ${authUser.id}`;
            } else {
                throw new ts.TSError('User query forbidden', {
                    statusCode: 403,
                });
            }
        }

        return this._queryAccess.make<models.User>(
            {
                constraint,
                excludes,
                allow_implicit_queries: true,
            },
            this.logger
        );
    }

    private _getRoleQueryAccess(authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const clientId = this._getUserClientId(authUser);
        const includes: (keyof models.Role)[] = [];

        let constraint = '';
        if (clientId > 0) {
            constraint += `client_id:${clientId}`;
        }

        if (type === 'USER') {
            includes.push('id', 'name');
            if (constraint) constraint += ' AND ';
            if (authUser && authUser.role) {
                constraint += `id: ${authUser.role}`;
            } else {
                constraint += 'id: none';
            }
        }

        return this._queryAccess.make<models.Role>(
            {
                constraint,
                includes,
                allow_implicit_queries: true,
            },
            this.logger
        );
    }

    private _getDataTypeQueryAccess(authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const clientId = this._getUserClientId(authUser);
        const includes: (keyof models.DataType)[] = [];
        let constraint = '';
        if (clientId > 0) {
            constraint += `client_id:${clientId}`;
        }

        if (type === 'USER') {
            if (authUser && authUser.role) {
                includes.push('id');
            } else {
                throw new ts.TSError('DataType query forbidden', {
                    statusCode: 403,
                });
            }
        }

        return this._queryAccess.make<models.DataType>(
            {
                constraint,
                includes,
                allow_implicit_queries: true,
            },
            this.logger
        );
    }

    private _getViewQueryAccess(authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const clientId = this._getUserClientId(authUser);
        const includes: (keyof models.View)[] = [];

        let constraint = '';
        if (clientId > 0) {
            constraint += `client_id:${clientId}`;
        }

        if (type === 'USER') {
            if (authUser && authUser.role) {
                includes.push('id', 'name');

                if (constraint) constraint += ' AND ';
                constraint += `roles: ${authUser.role}`;
            } else {
                throw new ts.TSError('View query forbidden', {
                    statusCode: 403,
                });
            }
        }

        return this._queryAccess.make<models.View>(
            {
                constraint,
                includes,
                allow_implicit_queries: true,
            },
            this.logger
        );
    }

    private _getSpaceQueryAccess(authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const clientId = this._getUserClientId(authUser);
        const includes: (keyof models.Space)[] = [];

        let constraint = '';
        if (clientId > 0) {
            constraint += `client_id:${clientId}`;
        }

        if (type === 'USER') {
            if (authUser && authUser.role) {
                includes.push('id', 'name', 'endpoint');

                if (constraint) constraint += ' AND ';
                constraint += `roles: ${authUser.role}`;
            } else {
                throw new ts.TSError('Space query forbidden', {
                    statusCode: 403,
                });
            }
        }

        return this._queryAccess.make<models.Space>(
            {
                constraint,
                includes,
                allow_implicit_queries: true,
            },
            this.logger
        );
    }

    private _getUserClientId(authUser: i.AuthUser): number {
        if (!authUser || authUser.type === 'SUPERADMIN') return 0;
        if (authUser.client_id == null) return -1;
        return authUser.client_id;
    }

    private async _getCurrentUserInfo(
        authUser: i.AuthUser,
        user: Partial<models.User>
    ): Promise<{ client_id: number; type: models.UserType }> {
        let currentUser: i.AuthUser;
        if (!user.id) {
            currentUser = user as models.User;
        } else if (!isAuthUser(authUser, user)) {
            currentUser = await this._users.findByAnyId(user.id);
        } else {
            currentUser = authUser;
        }

        return {
            client_id: this._getUserClientId(currentUser),
            type: this._getUserType(currentUser),
        };
    }

    private _getUserType(authUser: i.AuthUser): models.UserType {
        if (!authUser) return 'SUPERADMIN';
        return authUser.type || 'USER';
    }

    private _parseDataAccessConfig(config: i.DataAccessConfig): i.DataAccessConfig {
        if (config.type.toUpperCase() !== 'SEARCH') return config;
        const searchConfig = config.config as models.SpaceSearchConfig;

        if (searchConfig.default_date_field) {
            searchConfig.default_date_field = ts.trimAndToLower(searchConfig.default_date_field);
        }

        if (searchConfig.default_geo_field) {
            searchConfig.default_geo_field = ts.trimAndToLower(searchConfig.default_geo_field);
        }

        const typeConfig: DataTypeConfig = config.data_type.config || { fields: {}, version: LATEST_VERSION };

        const dateField = searchConfig.default_date_field;
        if (dateField && !typeConfig.fields[dateField]) {
            typeConfig.fields[dateField] = { type: 'Date' };
        }

        const geoField = searchConfig.default_geo_field;
        if (geoField && !typeConfig.fields[geoField]) {
            typeConfig.fields[geoField] = { type: 'Geo' };
        }

        config.data_type.config = typeConfig;
        return config;
    }

    private _validateAnyInput(input: { id?: string; client_id?: number } | undefined, authUser: i.AuthUser) {
        if (!input) {
            throw new ts.TSError('Invalid Input', {
                statusCode: 422,
            });
        }

        const type = this._getUserType(authUser);
        const clientId = this._getUserClientId(authUser);

        if (type === 'SUPERADMIN') return;

        // if is create and no client id set it to the authUser client id
        if (!input.id && input.client_id == null) {
            input.client_id = clientId;
        }

        if (input.client_id && clientId !== input.client_id) {
            throw new ts.TSError("User doesn't have permission to write to that client", {
                statusCode: 403,
            });
        }
    }

    private async _validateUserInput(user: Partial<models.User>, authUser: i.AuthUser) {
        if (!user) {
            throw new ts.TSError('Invalid Input', {
                statusCode: 422,
            });
        }

        if (this._users.isPrivateUser(user)) {
            const fields = models.Users.PrivateFields.join(', ');
            throw new ts.TSError(`Cannot update restricted fields, ${fields}`, {
                statusCode: 422,
            });
        }

        if (user.role) {
            const exists = await this._roles.exists(user.role);
            if (!exists) {
                throw new ts.TSError(`Missing role with user, ${user.role}`, {
                    statusCode: 422,
                });
            }
        }

        const authType = this._getUserType(authUser);
        const authClientId = this._getUserClientId(authUser);
        const { client_id: currentClientId, type: currentType } = await this._getCurrentUserInfo(authUser, user);

        if (authType === 'ADMIN' && authClientId !== currentClientId) {
            throw new ts.TSError("User doesn't have permission to write to users outside of the their client id", {
                statusCode: 403,
            });
        }

        if (authUser && authType === 'USER' && !isAuthUser(authUser, user)) {
            throw new ts.TSError("User doesn't have permission to write to other users", {
                statusCode: 403,
            });
        }

        if (currentClientId != null && authType === 'ADMIN' && currentType === 'SUPERADMIN') {
            throw new ts.TSError("User doesn't have permission to write to users with SUPERADMIN access", {
                statusCode: 403,
            });
        }

        if (user.type && user.type !== currentType) {
            if (authType === 'USER' || (authType === 'ADMIN' && user.type === 'SUPERADMIN')) {
                throw new ts.TSError(`User doesn't have permission to elevate user to ${user.type}`, {
                    statusCode: 403,
                });
            }
        }

        if (authType !== 'SUPERADMIN' && user.client_id != null && user.client_id !== currentClientId) {
            throw new ts.TSError("User doesn't have permission to change client on user", {
                statusCode: 403,
            });
        }
    }

    private async _validateSpaceInput(space: Partial<models.Space>, authUser: i.AuthUser) {
        this._validateAnyInput(space, authUser);

        if (space.roles) {
            space.roles = ts.uniq(space.roles);

            const exists = await this._roles.exists(space.roles!);
            if (!exists) {
                const rolesStr = space.roles!.join(', ');
                throw new ts.TSError(`Missing roles with space, ${rolesStr}`, {
                    statusCode: 422,
                });
            }
        }

        if (space.data_type) {
            const exists = await this._dataTypes.exists(space.data_type);
            if (!exists) {
                throw new ts.TSError(`Missing data_type ${space.data_type}`, {
                    statusCode: 422,
                });
            }
        }

        if (space.views) {
            space.views = ts.uniq(space.views);

            const views = await this._views.findAll(space.views!);
            if (views.length !== space.views!.length) {
                const viewsStr = space.views!.join(', ');
                throw new ts.TSError(`Missing views with space, ${viewsStr}`, {
                    statusCode: 422,
                });
            }

            const dataTypes = views.map(view => view.data_type);
            if (space.data_type && dataTypes.length && !dataTypes.includes(space.data_type)) {
                throw new ts.TSError('Views must have the same data type', {
                    statusCode: 422,
                });
            }

            const roles: string[] = [];
            views.forEach(view => {
                roles.push(...ts.uniq(view.roles));
            });
            if (ts.uniq(roles).length !== roles.length) {
                throw new ts.TSError('Multiple views cannot contain the same role within a space', {
                    statusCode: 422,
                });
            }
        }
    }

    private async _validateRoleInput(role: Partial<models.Role>, authUser: i.AuthUser) {
        this._validateAnyInput(role, authUser);
    }

    private async _validateDataTypeInput(dataType: Partial<models.DataType>, authUser: i.AuthUser) {
        // TODO: throw error herr
        this._validateAnyInput(dataType, authUser);
    }

    private async _validateViewInput(view: Partial<models.View>, authUser: i.AuthUser) {
        this._validateAnyInput(view, authUser);

        if (view.roles) {
            view.roles = ts.uniq(view.roles);

            const exists = await this._roles.exists(view.roles!);
            if (!exists) {
                const rolesStr = view.roles!.join(', ');
                throw new ts.TSError(`Missing roles with view, ${rolesStr}`, {
                    statusCode: 422,
                });
            }
        }

        if (view.data_type) {
            const exists = await this._dataTypes.exists(view.data_type);
            if (!exists) {
                throw new ts.TSError(`Missing data_type ${view.data_type}`, {
                    statusCode: 422,
                });
            }
        }
    }

    /**
     * Validate a user can create a model
     *
     * This works for all models except users
     */
    private async _validateCanCreate(model: i.ModelName, authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const restricted: i.ModelName[] = ['Space', 'DataType'];

        if (type === 'USER' || (type === 'ADMIN' && restricted.includes(model))) {
            throw new ts.TSError(`User doesn't have permission to create ${model}`, {
                statusCode: 403,
            });
        }
    }

    /**
     * Validate a user can update a model
     *
     * This works for all models except users
     */
    private async _validateCanUpdate(model: i.ModelName, authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        if (type === 'USER') {
            throw new ts.TSError(`User doesn't have permission to update ${model}`, {
                statusCode: 403,
            });
        }
    }

    /**
     * Validate a user can remove a model
     *
     * This works for all models except users
     */
    private async _validateCanRemove(model: i.ModelName, authUser: i.AuthUser) {
        const type = this._getUserType(authUser);
        const restricted: i.ModelName[] = ['Space', 'DataType'];
        if (type === 'USER' || (type === 'ADMIN' && restricted.includes(model))) {
            throw new ts.TSError(`User doesn't have permission to remove ${model}`, {
                statusCode: 403,
            });
        }
    }
}

function isAuthUser(authUser: i.AuthUser, user: Partial<models.User>): boolean {
    if (!authUser || !user.id) return false;
    return [authUser.id, authUser.username].includes(user.id);
}
