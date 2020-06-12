# graphiql-static

A package to extend the default [GraphiQL][graphiql] IDE with useful features. This repo is the source for building a static html/js standalone web GraphiQL instance.

_Note:_ accessible at `http://localhost:8245/` after running `npm run serve`

You can use this right away at https://unpkg.com/graphiql-static/index.html.

## Features

- Offline support - for when you need to work on your excellent GraphQL app on a plane, train, or elsewhere off the grid
- [GraphiQL Explorer][graphiql-explorer] - an interactive explorer plugin to visually create and interact with the GraphQL schema
- [Graphiql Code Exporter][graphiql-code-exporter] - a codegen tool to take your GraphQL queries and plug them into your app
- _All_ the expected features you know and love from [GraphiQL][graphiql]

[graphiql]: https://github.com/graphql/graphiql
[graphiql-explorer]: https://github.com/OneGraph/graphiql-explorer
[graphiql-code-exporter]: [https://github.com/OneGraph/graphiql-code-exporter]

# How to use

Build this app with `npm build` and host it on your favorite static hosting service.
Pass in the URL parameters at the end of your URL (after `?`, before `#`) to provide inputs to the GraphiQL IDE.

- `endpoint`: Sets the endpoint to send GraphQL queries to. **Default:** `hostname`
- `headers`: Sets headers to include in requests to the GraphQL endpoint as URL-Encoded JSON. **Default:** `{"Content-Type": "application/json" }`
- `query`: Sets the default query to include in the Query pane. **Default:** The GraphiQL default
- `variables`: Sets the default query to include in the Variables pane. **Default:** none
- `operationName`: Sets the default operation to execute and display in the Output pane. **Default:** none

The values of these parameters will be persisted to browser localStorage whenever the window is closed. Including these parameters in the request to load the page will ignore the localStorage values. The page URL will be continuously updated with these parameters so you can easily share the IDE state.

# License

MIT