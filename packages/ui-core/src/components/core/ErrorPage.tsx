import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Segment, Container } from 'semantic-ui-react';
import ErrorMessage from './ErrorMessage';

const StyledContainer = styled(Container)`
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: row;
`;

const StyledSegment = styled(Segment)`
    flex: 1;
`;

const ErrorPage: React.FC<Props> = ({ error }) => {
    return (
        <StyledContainer>
            <StyledSegment padded="very">
                <ErrorMessage error={error} />
            </StyledSegment>
        </StyledContainer>
    );
};

type Props = {
    error: any;
};

ErrorPage.propTypes = {
    error: PropTypes.any.isRequired,
};

export default ErrorPage;
