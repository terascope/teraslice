import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useCoreContext, findPluginRoute, hasAccessToRoute } from '../core';

const ProtectedRoute: React.FC<any> = ({ component: Component, ...rest }) => {
    const { authenticated, plugins, authUser } = useCoreContext();

    return (
        <Route
            {...rest}
            render={props => {
                const result = findPluginRoute(
                    plugins,
                    props.location.pathname
                );

                if (authenticated) {
                    if (hasAccessToRoute(authUser, result)) {
                        return <Component {...props} />;
                    }

                    return (
                        <Redirect
                            to={{
                                pathname: '/',
                                state: { from: props.location },
                            }}
                        />
                    );
                }

                return (
                    <Redirect
                        to={{
                            pathname: '/login',
                            state: { from: props.location },
                        }}
                    />
                );
            }}
        />
    );
};

export default ProtectedRoute;
