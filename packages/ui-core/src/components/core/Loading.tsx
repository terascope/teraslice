import React from 'react';
import styled from 'styled-components';
import { Placeholder, Segment, Container } from 'semantic-ui-react';

const StyledContainer = styled(Container)`
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: row;
`;

const StyledSegment = styled(Segment)`
    flex: 1;
`;

const Loading: React.FC = () => {
    return (
        <StyledContainer>
            <StyledSegment loading>
                <Placeholder fluid>
                    <Placeholder.Header>
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder.Header>
                    <Placeholder.Paragraph>
                        <Placeholder.Line />
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder.Paragraph>
                </Placeholder>
            </StyledSegment>
        </StyledContainer>
    );
};

export default Loading;
