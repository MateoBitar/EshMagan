// src/stubs/apollo.js
// Stub for web — Apollo is not used on web (uses fetch-based gqlFetch instead)
module.exports = {
  ApolloClient: class {},
  InMemoryCache: class {},
  ApolloProvider: ({ children }) => children,
  createHttpLink: () => {},
  ApolloLink: class {},
  gql: () => {},
  useQuery: () => ({ data: null, loading: false, error: null }),
  useMutation: () => [() => {}, { loading: false }],
};