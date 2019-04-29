import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { CoreContext } from './CoreContext';

type Props = any;

class ProtectedRoute extends React.Component<Props> {
    static contextType = CoreContext;

    render() {
        const { component: Component, ...rest } = this.props;
        const { authenticated } = this.context;

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
                            state: { from: props.location }
                        }}
                    />
                )
            }
            />
        );
    }
}

export default ProtectedRoute;
