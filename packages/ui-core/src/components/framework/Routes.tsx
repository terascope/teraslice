import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useCoreContext, formatPath } from '../core';
import ProtectedRoute from './ProtectedRoute';
import NoMatch from './NoMatch';

const Routes: React.FC = () => {
    const { plugins } = useCoreContext();

    return (
        <Switch>
            {plugins.map((plugin, pi) =>
                plugin.routes.map((route, ri) => {
                    const path = formatPath(plugin.basepath, route.path);
                    return (
                        <ProtectedRoute
                            key={`route-${pi}-${ri}`}
                            path={path}
                            component={route.component}
                            exact={!!route.exact}
                        />
                    );
                })
            )}
            <Route component={NoMatch} />
        </Switch>
    );
};

export default Routes;
