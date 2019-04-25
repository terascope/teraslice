import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { parseErrorInfo } from '@terascope/utils';
import { corePropTypes, CoreProps } from '../../helpers';

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

type ErrorInfoProps = CoreProps & {
    error: any;
};

const ErrorInfo: React.FC<ErrorInfoProps> = ({ error, classes }) => {
    const { message } = parseErrorInfo(error);
    return (
        <Paper className={classes.root} elevation={1}>
            <Typography variant="h4" component="h4" align="center" className={classes.item}>
                Error
            </Typography>
            <Typography variant="h5" component="h5" align="center" className={classes.item}>
                {message}
            </Typography>
        </Paper>
    );
};

ErrorInfo.propTypes = {
    ...corePropTypes,
    error: PropTypes.any.isRequired,
};

export default withStyles(styles)(ErrorInfo);
