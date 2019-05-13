import React from 'react';
import { History } from 'history';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { get } from '@terascope/utils';
import { Container, Segment, Button, Menu, Icon } from 'semantic-ui-react';
import { PageAction, PageActionProp } from './interfaces';
import { tsWithRouter } from './utils';

const Title = styled.h2`
    padding-left: 1rem;
    padding-top: 0.5rem;
`;

const Page = tsWithRouter<Props>(({ title, actions = [], ...props }) => {
    const history: History = get(props, 'history');

    return (
        <Container>
            <Segment padded>
                <Menu secondary>
                    <Menu.Header as={Title}>{title}</Menu.Header>
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
                                    {action.icon && <Icon name={action.icon as any} />}
                                    {action.label}
                                </Button>
                            </Menu.Item>
                        );
                    })}
                </Menu>
                {props.children}
            </Segment>
        </Container>
    );
});

type Props = {
    title: string;
    actions?: PageAction[];
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PageActionProp.isRequired),
};

export default Page;
