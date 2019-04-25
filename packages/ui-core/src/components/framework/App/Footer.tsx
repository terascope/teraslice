import React from 'react';
import Typography from '@material-ui/core/Typography';
import { CoreProps, corePropTypes } from '../../../helpers';
import withStyles from './styles';

const Footer: React.FC<CoreProps> = ({ classes }) => {
    return (
        <Typography
            component="footer"
            align="center"
            variant="subtitle1"
            className={classes.footer}
        >
            Copyright &copy; 2019
        </Typography>
    );
};

Footer.propTypes = { ...corePropTypes };

export default withStyles(Footer);
