import React from 'react';
import PropTypes from 'prop-types';
import { Container, Segment, Button, Menu, Icon } from 'semantic-ui-react';
import { PageAction, PageActionProp } from './interfaces';
import { tsWithRouter } from './utils';

const Page = tsWithRouter<Props>(
    ({ title, actions = [], history, children, fullWidth }) => {
        return (
            <Container fluid={fullWidth}>
                <Segment padded>
                    <Menu secondary>
                        <Menu.Header as="h2" className="pageTitle">
                            {title}
                        </Menu.Header>
                        {actions.map((action, i) => {
                            const onClick = action.onClick
                                ? action.onClick
                                : () => {
                                    if (!action.to) return;
                                    history.push(action.to);
                                };

                            return (
                                <Menu.Item
                                    onClick={onClick}
                                    key={`page-item-${i}`}
                                    position="right"
                                    className="noActiveBg"
                                >
                                    <Button>
                                        {action.icon && (
                                            <Icon name={action.icon as any} />
                                        )}
                                        {action.label}
                                    </Button>
                                </Menu.Item>
                            );
                        })}
                    </Menu>
                    {children}
                </Segment>
            </Container>
        );
    }
);

type Props = {
    title: string;
    fullWidth?: boolean;
    actions?: PageAction[];
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    fullWidth: PropTypes.bool,
    actions: PropTypes.arrayOf(PageActionProp.isRequired),
};

export default Page;
