import React from 'react';
import { Route } from 'react-router-dom';
import { useCoreContext } from '../core';
import { formatPath } from '../../helpers';

const Routes: React.FC = () => {
    const { plugins } = useCoreContext();

    return (
        <div>
            {plugins.map((plugin, pi) => plugin.routes.map((route, ri) => (
                <Route
                    key={`route-${pi}-${ri}`}
                    path={formatPath(plugin.basepath, route.path)}
                    component={route.component}
                />
            )))}
        </div>
    );
};

export default Routes;
