import React from 'react';
import _parseDate from 'date-fns/parse';
import _formatDate from 'date-fns/format';
import { UserType } from '@terascope/data-access';
import { withRouter, RouteComponentProps, matchPath } from 'react-router-dom';
import { PluginConfig, PluginRoute, ResolvedUser, UserPermissionMap, AccessLevel } from './interfaces';
import PluginService from './PluginService';

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
export function findPluginRoute(pathname: string, authUser?: ResolvedUser): FindPluginRouteResult | undefined {
    const plugins = PluginService.plugins();
    for (const plugin of plugins) {
        const route = plugin.routes.find(({ path }) => {
            return !!matchPath(pathname, {
                path,
                exact: true,
            });
        });

        if (route) {
            const result: FindPluginRouteResult = { route, plugin };
            if (!authUser || (authUser && hasAccessToRoute(authUser, result))) {
                return result;
            }
            return undefined;
        }
    }
    return undefined;
}

export function getAccessLevels(access?: AccessLevel): UserType[] | undefined {
    if (!access || !access.length) return;
    if (Array.isArray(access)) {
        return access;
    }
    if (access) {
        return [access];
    }

    return;
}

export function hasAccessToRoute(authUser?: ResolvedUser, result?: FindPluginRouteResult): boolean {
    if (!result) return false;

    const routeAccess = getAccessLevels(result.route.access);
    if (routeAccess) return routeAccess.some(type => hasAccessTo(authUser, type));

    const pluginAccess = getAccessLevels(result.plugin.access);
    if (pluginAccess) return pluginAccess.some(type => hasAccessTo(authUser, type));

    // default access
    return hasAccessTo(authUser);
}

export function hasAccessTo(authUser?: ResolvedUser, _access: AccessLevel = 'ADMIN') {
    const accessTo: UserType[] = getAccessLevels(_access) || ['ADMIN'];
    const authType = (authUser && authUser.type) || 'USER';
    const permissions = UserPermissionMap[authType];
    return permissions && accessTo.some(type => permissions.includes(type));
}
