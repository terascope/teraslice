import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { CoreProps, corePropTypes } from '../../helpers';

const styles = createStyles({
    item: {}
});

const SidebarItem: React.FC<Props> = ({ classes, icon, link, label }) => {
    return (
        <ListItem
            dense
            // @ts-ignore
            component={Link}
            button
            key={`${link}-${label}`}
            className={classes.item}
            {...{ to: link }}
        >
            {icon && (
                <ListItemIcon>{icon}</ListItemIcon>
            )}
            <ListItemText primary={label} />
        </ListItem>
    );
};

type Props = CoreProps & {
    link: string;
    label: string;
    icon?: React.ReactElement,
};

SidebarItem.propTypes = {
    ...corePropTypes,
    link: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.element,
};

export default withStyles(styles)(SidebarItem);
