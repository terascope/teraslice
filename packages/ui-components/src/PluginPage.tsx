import React from 'react';
import { PageAction } from './interfaces';
import { useCoreContext } from './CoreContext';
import { tsWithRouter, findPluginRoute } from './utils';
import ErrorPage from './ErrorPage';
import Page from './Page';

const PluginPage = tsWithRouter(({ location, match }) => {
    const { authUser } = useCoreContext();
    const result = findPluginRoute(location.pathname);

    if (!result) return <ErrorPage error="Invalid Plugin" />;

    const { route } = result;
    const actions: PageAction[] = [];

    if (route.actions) {
        for (const actionPath of route.actions) {
            const _result = findPluginRoute(actionPath, authUser);
            if (!_result) continue;

            const _route = _result.route;
            actions.push({
                label: _route.name,
                to: _route.path,
                icon: _route.icon,
            });
        }
    }
    const PageComponent = route.component;

    return (
        <Page title={route.name} actions={actions} fullWidth>
            <PageComponent {...match.params} />
        </Page>
    );
});

export default PluginPage;
