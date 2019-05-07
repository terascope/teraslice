import React from 'react';
import PropTypes from 'prop-types';

export type PluginRoute = {
    name: string,
    path: string,
    icon: string,
    component: React.FunctionComponent,
};

export type PluginConfig = {
    name: string,
    basepath?: string,
    routes: PluginRoute[];
};

export const PluginRoutesProp = PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    component: PropTypes.func.isRequired,
}).isRequired);

export const PluginConfigProp = PropTypes.shape({
    name: PropTypes.string.isRequired,
    basepath: PropTypes.string,
    routes: PluginRoutesProp.isRequired,
});

export const PluginsProp = PropTypes.arrayOf(PluginConfigProp.isRequired).isRequired;
