import React from 'react';
import _parseDate from 'date-fns/parse';
import _formatDate from 'date-fns/format';
import { withRouter, RouteComponentProps, matchPath } from 'react-router-dom';
import {
    PluginConfig,
    PluginRoute,
    ResolvedUser,
    UserPermissionMap,
} from './interfaces';
import { UserType } from '@terascope/data-access';

export function formatPath(...paths: (string | undefined)[]) {
    return `/${paths
        .map(trimSlashes)
        .filter(s => !!s)
        .join('/')}`;
}

export function trimSlashes(str?: string) {
    let path = str;
    if (!path) return '';
    path = path.replace(/^\//, '');
    path = path.replace(/\/$/, '');
    return path;
}

// Fix weird with router issue
export type PropsWithRouter<P> = P & RouteComponentProps<any>;

export function tsWithRouter<P>(fc: React.FC<PropsWithRouter<P>>): React.FC<P> {
    return (withRouter(fc as any) as unknown) as React.FC<P>;
}

export function formatDate(dateStr: any): string {
    const date = _parseDate(dateStr);
    if (!date || !dateStr) return '--';
    return _formatDate(date, 'MMM D, YYYY HH:mm A');
}

type FindPluginRouteResult = { plugin: PluginConfig; route: PluginRoute };
export function findPluginRoute(
    plugins: PluginConfig[],
    pathname: string
): FindPluginRouteResult | undefined {
    for (const plugin of plugins) {
        const route = plugin.routes.find(({ path }) => {
            return !!matchPath(pathname, {
                path,
                exact: true,
            });
        });

        if (route) {
            return { route, plugin };
        }
    }
}

export function hasAccessToRoute(
    authUser?: ResolvedUser,
    result?: FindPluginRouteResult
): boolean {
    if (!result) return false;
    return hasAccessTo(authUser, result.route.access || result.plugin.access);
}

export function hasAccessTo(authUser?: ResolvedUser, type: UserType = 'ADMIN') {
    const authType = (authUser && authUser.type) || 'USER';
    const accessTo = type || 'ADMIN';
    const permissions = UserPermissionMap[authType];
    return permissions && permissions.includes(accessTo);
}
