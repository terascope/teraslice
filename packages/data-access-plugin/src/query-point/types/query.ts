
export default `
type Query {
    authenticate(username: String, password: String, token: String): User!
}
`;
