import * as React from 'react';
import { withUsers } from '../queries/users';

export default withUsers(({ loading, users, error }) => {
    if (loading) return <div>Loading</div>;
    if (error) return <h1>ERROR</h1>;
    return <pre>{JSON.stringify(users, null, 2)}</pre>;
});
