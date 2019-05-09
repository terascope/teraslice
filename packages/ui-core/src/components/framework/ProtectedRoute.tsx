import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useCoreContext } from '../core';

const ProtectedRoute: React.FC<any> = ({ component: Component, ...rest }) => {
    const { authenticated } = useCoreContext();

    return (
        <Route
            {...rest}
            render={props =>
                authenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect
                        to={{
                            pathname: '/login',
                            state: { from: props.location },
                        }}
                    />
                )
            }
        />
    );
};

export default ProtectedRoute;
