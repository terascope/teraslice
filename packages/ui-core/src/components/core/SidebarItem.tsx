import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu } from 'semantic-ui-react';

const SidebarItem: React.FC<Props> = ({ icon, link, label }) => {
    return (
        <Menu.Item
            dense
            as={Link}
            button
            key={`${link}-${label}`}
            to={link}
        >
            {icon}
            {label}
        </Menu.Item>
    );
};

type Props = {
    link: string;
    label: string;
    icon?: React.ReactElement,
};

SidebarItem.propTypes = {
    link: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.element,
};

export default SidebarItem;
