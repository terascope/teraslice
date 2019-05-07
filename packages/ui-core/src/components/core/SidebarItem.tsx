import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Icon } from 'semantic-ui-react';

const SidebarItem: React.FC<Props> = ({ icon, link, label }) => {
    return (
        <Menu.Item key={`${link}-${label}`}>
            <Link to={link}>{label}</Link>
            {icon && <Icon name={icon as any} />}
        </Menu.Item>
    );
};

type Props = {
    link: string;
    label: string;
    icon?: string,
};

SidebarItem.propTypes = {
    link: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
};

export default SidebarItem;
