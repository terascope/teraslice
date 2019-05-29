import React from 'react';
import {
    formatPath,
    PluginService,
    PluginPage,
} from '@terascope/ui-components';
import ProtectedRoute from './ProtectedRoute';

const Routes: React.FC = () => {
    return (
        <div>
            {PluginService.plugins().flatMap((plugin, pi) =>
                plugin.routes.map((route, ri) => {
                    const path = formatPath(plugin.basepath, route.path);
                    return (
                        <ProtectedRoute
                            key={`route-${pi}-${ri}`}
                            path={path}
                            component={PluginPage}
                            exact
                        />
                    );
                })
            )}
        </div>
    );
};

export default Routes;
