import React from 'react';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { Page } from '../core';
import { corePropTypes, CoreProps } from '../../helpers';

const styles = {};

const Welcome: React.FC<CoreProps> = () => {
    return (
        <Page title="Welcome">
            <Typography variant="h5" component="h5" align="center">
            ...
            </Typography>
        </Page>
    );
};

Welcome.propTypes = {
    ...corePropTypes
};

export default withStyles(styles)(Welcome);
