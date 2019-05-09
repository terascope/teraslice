import React from 'react';
import PropTypes from 'prop-types';
import { Overwrite } from '@terascope/utils';
import { User, Role } from '@terascope/data-access';

export type PluginRoute = {
    name: string;
    path: string;
    icon: string;
    hidden?: boolean;
    component: React.FunctionComponent;
};

export const PluginRoutesProp = PropTypes.arrayOf(
    PropTypes.shape({
        name: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        component: PropTypes.func.isRequired,
        hidden: PropTypes.bool,
    }).isRequired
);

export type PluginConfig = {
    name: string;
    basepath?: string;
    routes: PluginRoute[];
};

export const PluginConfigProp = PropTypes.shape({
    name: PropTypes.string.isRequired,
    basepath: PropTypes.string,
    routes: PluginRoutesProp.isRequired,
});

export const PluginsProp = PropTypes.arrayOf(PluginConfigProp.isRequired).isRequired;

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

export type ResolvedUser = Overwrite<
    User,
    {
        role?: Role;
    }
>;

export type CoreContextState = {
    authenticated: boolean;
    authUser?: Readonly<ResolvedUser>;
    plugins: PluginConfig[];
    updateState(updates: Partial<CoreContextState>): void;
};
