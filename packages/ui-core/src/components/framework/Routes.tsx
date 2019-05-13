import React from 'react';
import { useCoreContext, formatPath } from '../core';
import ProtectedRoute from './ProtectedRoute';

const Routes: React.FC = () => {
    const { plugins } = useCoreContext();

    return (
        <div>
            {plugins.flatMap((plugin, pi) =>
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
        </div>
    );
};

export default Routes;
