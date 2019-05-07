import React from 'react';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import { useCoreContext } from '../core';

const Routes: React.FC = () => {
    const { plugins } = useCoreContext();

    return (
        <div>
            {plugins.map((plugin, pi) => {
                return (
                    <Router key={`route-${pi}`} basename={plugin.basepath || '/'}>
                        {plugin.routes.map((route, ri) => {
                            return (
                                <Route
                                    key={`route-${pi}-${ri}`}
                                    path={route.path}
                                    component={route.component}
                                />
                            );
                        })}
                    </Router>
                );
            })};
        </div>
    );
};

export default Routes;
