import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    },
});

// tslint:disable-next-line function-name
function Welcome({ classes }) {
    return (
        <div>
            <Paper className={classes.root} elevation={1}>
                <Typography variant="h4" component="h4" align="center">
                    Welcome
                </Typography>
                <Typography variant="h5" component="h5" align="center">
                    ...
                </Typography>
            </Paper>
        </div>
    );
}

Welcome.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Welcome);
