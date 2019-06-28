import React from 'react';
import PropTypes from 'prop-types';
import { Role, UserType } from '@terascope/data-access';

export const UserTypes: ReadonlyArray<UserType> = ['SUPERADMIN', 'ADMIN', 'DATAADMIN', 'USER'];

export type PageAction = {
    label: string;
    icon?: string;
    to?: string;
    onClick?: () => void;
};

export const PageActionProp = PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    to: PropTypes.string,
});

export type AccessLevel = UserType | (UserType[]);

export type PluginRoute = {
    name: string;
    path: string;
    icon: string;
    hidden?: boolean;
    access?: AccessLevel;
    component: React.FC<any> | React.ComponentClass<any>;
    actions?: string[];
};

export const UserTypeProp = PropTypes.oneOf(UserTypes.slice());
export const UserTypesProp = PropTypes.arrayOf(UserTypeProp.isRequired);
export const UserAccessProp = PropTypes.oneOf([UserTypeProp.isRequired, UserTypesProp.isRequired]);

export const PluginRoutesProp = PropTypes.arrayOf(
    PropTypes.shape({
        name: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        hidden: PropTypes.bool,
        component: PropTypes.func.isRequired,
        access: UserAccessProp,
        actions: PropTypes.arrayOf(PropTypes.string.isRequired),
    }).isRequired
);

export type PluginConfig = {
    name: string;
    basepath?: string;
    access?: AccessLevel;
    routes: PluginRoute[];
};

export const PluginConfigProp = PropTypes.shape({
    name: PropTypes.string.isRequired,
    basepath: PropTypes.string,
    access: UserAccessProp,
    routes: PluginRoutesProp.isRequired,
});

export type ResolvedUser = {
    id: string;
    client_id: number;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    repeat_password: string;
    type: UserType;
    role: Pick<Role, 'id' | 'name'>;
    api_token: string;
    created?: string;
    updated?: string;
};

export type CoreContextState = {
    authenticated: boolean;
    authUser?: Readonly<ResolvedUser>;
    updateState(updates: Partial<CoreContextState>): void;
};

export const UserPermissionMap: { readonly [key in UserType]: ReadonlyArray<UserType> } = {
    USER: ['USER'],
    DATAADMIN: ['USER', 'DATAADMIN'],
    ADMIN: ['USER', 'ADMIN'],
    SUPERADMIN: UserTypes.slice(),
};

export type RegisterPluginFn = () => PluginConfig;
