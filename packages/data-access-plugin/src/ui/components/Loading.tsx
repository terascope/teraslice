import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';

const styles = (theme: Theme) => createStyles({
    root: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: theme.spacing.unit * 2,
    },
    progress: {
        margin: theme.spacing.unit * 2,
    },
});

// tslint:disable-next-line function-name
function Loading({ classes }) {
    return (
        <div>
            <Paper className={classes.root}>
                <CircularProgress className={classes.progress} />
                <Typography variant="subheading" component="h3" align="center">
                    Loading...
                </Typography>
            </Paper>
        </div>
    );
}

Loading.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Loading);
