import React from 'react';
import _parseDate from 'date-fns/parse';
import _formatDate from 'date-fns/format';
import { withRouter, RouteComponentProps } from 'react-router-dom';

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
