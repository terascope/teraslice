import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { withStyles, createStyles, Theme } from '@material-ui/core/styles';
import { CoreProps } from '../../../helpers';

const styles = (theme: Theme) => createStyles({
    link: {
        textTransform: 'none',
        padding: theme.spacing.unit,
    }
});

const LogoutLink: React.FC<CoreProps> = ({ classes, children }) => {
    return (
        <Button
            className={classes.link}
            // @ts-ignore
            component={Link} to="/logout"
        >{children}</Button>
    );
};

export default withStyles(styles)(LogoutLink) as React.FC;
