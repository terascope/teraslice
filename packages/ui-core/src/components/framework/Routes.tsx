import React from 'react';
import { useCoreContext, formatPath } from '../core';
import ProtectedRoute from './ProtectedRoute';

const Routes: React.FC = () => {
    const { plugins } = useCoreContext();

    return (
        <div>
            {plugins.map((plugin, pi) =>
                plugin.routes.map((route, ri) => (
                    <ProtectedRoute
                        key={`route-${pi}-${ri}`}
                        path={formatPath(plugin.basepath, route.path)}
                        component={route.component}
                        exact={!!route.exact}
                    />
                ))
            )}
        </div>
    );
};

export default Routes;
