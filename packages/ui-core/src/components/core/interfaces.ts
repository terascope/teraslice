import React from 'react';
import PropTypes from 'prop-types';
import { Role, UserType } from '@terascope/data-access';

export const UserTypes: UserType[] = ['USER', 'ADMIN', 'SUPERADMIN'];

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

export type PluginRoute = {
    name: string;
    path: string;
    icon: string;
    hidden?: boolean;
    access?: UserType;
    component: React.FC<any> | React.ComponentClass<any>;
    actions?: string[];
};

export const PluginRoutesProp = PropTypes.arrayOf(
    PropTypes.shape({
        name: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        hidden: PropTypes.bool,
        component: PropTypes.func.isRequired,
        access: PropTypes.oneOf(UserTypes).isRequired,
        actions: PropTypes.arrayOf(PropTypes.string.isRequired),
    }).isRequired
);

export type PluginConfig = {
    name: string;
    basepath?: string;
    access?: UserType;
    routes: PluginRoute[];
};

export const PluginConfigProp = PropTypes.shape({
    name: PropTypes.string.isRequired,
    basepath: PropTypes.string,
    access: PropTypes.oneOf(UserTypes).isRequired,
    routes: PluginRoutesProp.isRequired,
});

export const PluginsProp = PropTypes.arrayOf(PluginConfigProp.isRequired).isRequired;

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
    role: Partial<Role>;
    api_token: string;
    created?: string;
    updated?: string;
};

export type CoreContextState = {
    authenticated: boolean;
    authUser?: Readonly<ResolvedUser>;
    plugins: PluginConfig[];
    updateState(updates: Partial<CoreContextState>): void;
};

export const UserPermissionMap: { readonly [key in UserType]: ReadonlyArray<UserType> } = {
    USER: ['USER'],
    ADMIN: ['USER', 'ADMIN'],
    SUPERADMIN: ['USER', 'ADMIN', 'SUPERADMIN'],
};
