import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { getErrorInfo } from '../utils';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: '100%'
    },
    item: {
        margin: theme.spacing.unit
    }
});

// tslint:disable-next-line function-name
function ErrorPage({ classes, error }) {
    const { message, statusCode } = getErrorInfo(error);
    return (
        <div>
            <Paper className={classes.root} elevation={1}>
                <Typography variant="h4" component="h4" align="center" className={classes.item}>
                    Error
                </Typography>
                <Typography variant="h5" component="h5" align="center" className={classes.item}>
                   {message}
                </Typography>
                <Typography variant="caption" component="small" align="center" className={classes.item}>
                   StatusCode: {statusCode}
                </Typography>
            </Paper>
        </div>
    );
}

ErrorPage.propTypes = {
    classes: PropTypes.object.isRequired,
    error: PropTypes.any.isRequired,
};

export default withStyles(styles)(ErrorPage);
