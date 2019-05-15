import React from 'react';
import { PageAction } from './interfaces';
import { useCoreContext } from './CoreContext';
import { tsWithRouter, findPluginRoute } from './utils';
import Page from './Page';
import ErrorPage from './ErrorPage';

const PluginPage = tsWithRouter(({ location, match }) => {
    const { plugins } = useCoreContext();
    const route = findPluginRoute(plugins, location.pathname);

    if (!route) return <ErrorPage error="Invalid Plugin" />;

    const actions: PageAction[] = [];

    if (route.actions) {
        for (const actionPath of route.actions) {
            const _route = findPluginRoute(plugins, actionPath);
            if (!_route) continue;

            actions.push({
                label: _route.name,
                to: _route.path,
                icon: _route.icon,
            });
        }
    }
    const PageComponent = route.component;

    return (
        <Page title={route.name} actions={actions}>
            <PageComponent {...match} />
        </Page>
    );
});

export default PluginPage;
