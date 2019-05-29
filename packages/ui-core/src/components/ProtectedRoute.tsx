import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import {
    useCoreContext,
    findPluginRoute,
    hasAccessToRoute,
} from '@terascope/ui-components';

const ProtectedRoute: React.FC<any> = ({ component: Component, ...rest }) => {
    const { authenticated, authUser } = useCoreContext();

    return (
        <Route
            {...rest}
            render={props => {
                const result = findPluginRoute(props.location.pathname);

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
