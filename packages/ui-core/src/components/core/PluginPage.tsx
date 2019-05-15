import React from 'react';
import { PageAction } from './interfaces';
import { useCoreContext } from './CoreContext';
import { tsWithRouter, findPluginRoute } from './utils';
import Page from './Page';

const PluginPage = tsWithRouter<Props>(({ children, location }) => {
    const { plugins } = useCoreContext();
    const route = findPluginRoute(plugins, location.pathname);

    if (!route) return <Page title="...">{children}</Page>;

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

    return (
        <Page title={route.name} actions={actions}>
            {children}
        </Page>
    );
});

type Props = {};

PluginPage.propTypes = {};

export default PluginPage;
