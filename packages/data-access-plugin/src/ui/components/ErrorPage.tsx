import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { parseErrorInfo } from '@terascope/utils';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    },
});

// tslint:disable-next-line function-name
function Error({ classes, error }) {
    const { message, statusCode, code } = parseErrorInfo(error);
    return (
        <div>
            <Paper className={classes.root} elevation={1}>
                <Typography variant="h5" component="h3" align="center">
                    Error: {message}
                </Typography>
                <Typography variant="caption" component="div" align="center">
                    StatusCode: {statusCode}; Code: {code}
                </Typography>
            </Paper>
        </div>
    );
}

Error.propTypes = {
    classes: PropTypes.object.isRequired,
    error: PropTypes.any.isRequired,
};

export default withStyles(styles)(Error);
