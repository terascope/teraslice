export const schema = `
    enum UserType {
        USER
        ADMIN
        SUPERADMIN
    }
`;

export const commonViewModel = `excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean`;
