import React from 'react';

const Strong: React.FC = ({ children }) => {
    return <span className="daStrongItem">{children}</span>;
};

export default Strong;
export function formatStrong(text: string): any {
    return <Strong>{text}</Strong>;
}
