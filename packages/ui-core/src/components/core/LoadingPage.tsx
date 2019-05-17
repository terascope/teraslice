import React from 'react';
import { Placeholder, Segment, Container } from 'semantic-ui-react';

const LoadingPage: React.FC = () => {
    return (
        <Container className="simplePageContainer">
            <Segment className="simplePageContent" padded="very">
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
            </Segment>
        </Container>
    );
};

export default LoadingPage;
