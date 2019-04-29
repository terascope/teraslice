import React from 'react';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { corePropTypes, CoreProps } from '../../helpers';

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

const Loading: React.FC<CoreProps> = ({ classes }) => {
    return (
        <div className={classes.root}>
            <CircularProgress className={classes.progress} />
            <Typography component="h3" align="center">
                Loading...
            </Typography>
        </div>
    );
};

Loading.propTypes = { ...corePropTypes };

export default withStyles(styles)(Loading);
