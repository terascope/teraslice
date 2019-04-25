import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { CoreProps, corePropTypes } from '../../helpers';

type Props = CoreProps & {
    title: string;
};

const styles = (theme: Theme) => createStyles({
    root: {
        display: 'flex',
        alignItems: 'space-around',
        flexDirection: 'column',
        padding: theme.spacing.unit,
    },
    paper: {
        padding: theme.spacing.unit * 3,
    }
});

const Page: React.FC<Props> = ({ children, title, classes }) => {
    return (
        <div className={classes.root}>
            <Paper className={classes.paper}>
                <Typography variant="h4" component="h4" align="center" className={classes.item}>
                    {title}
                </Typography>
                {children}
            </Paper>
        </div>
    );
};

Page.propTypes = {
    ...corePropTypes,
    title: PropTypes.string.isRequired,
};

export default withStyles(styles)(Page);
