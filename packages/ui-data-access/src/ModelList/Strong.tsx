import React from 'react';

const Strong: React.FC = ({ children }) => <span className="daStrongItem">{children}</span>;

export default Strong;
export function formatStrong(text: string): any {
    return <Strong>{text}</Strong>;
}
