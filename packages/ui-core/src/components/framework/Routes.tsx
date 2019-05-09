import React from 'react';
import { useCoreContext } from '../core';
import { formatPath } from '../../helpers';
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
                        exact
                    />
                ))
            )}
        </div>
    );
};

export default Routes;
