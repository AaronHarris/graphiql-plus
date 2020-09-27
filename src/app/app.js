import React from "react"
import ReactDOM from "react-dom"

import GraphiQL from "graphiql"
import GraphiQLExplorer from "graphiql-explorer"
import { getIntrospectionQuery, buildClientSchema, parse } from "graphql"
import CodeExporter from "graphiql-code-exporter"
import snippets from "./snippets"

import "whatwg-fetch"

import "graphiql/graphiql.css"
import "./app.css"
import "graphiql-code-exporter/CodeExporter.css"

const parameters = {}
const searchParams = new URLSearchParams(window.location.search);
window.location.search
  .substr(1)
  .split('&')
  .forEach(function (entry) {
    var eq = entry.indexOf('=')
    if (eq >= 0) {
      parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(
        entry.slice(eq + 1)
      )
    }
  })

  // If `variables` was provided, try to format it.
if (parameters.variables) {
  try {
    parameters.variables = JSON.stringify(
      JSON.parse(parameters.variables),
      null,
      2,
    );
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// If `headers` was provided, try to format it.
if (parameters.headers) {
  try {
    parameters.headers = JSON.stringify(
      JSON.parse(parameters.headers),
      null,
      2,
    );
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

function graphQLFetcher(graphQLParams, opts = { headers: {} }) {
  let headers = opts.headers;
  // Convert headers to an object.
  if (typeof headers === 'string') {
    headers = JSON.parse(opts.headers);
  }
  return fetch(parameters.endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(graphQLParams),
    credentials: 'omit',
  }).then(response =>
    response.clone().json().catch(() => response.text())
  );
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
function onEditVariables(newVariables) {
  parameters.variables = newVariables
  updateURL()
}
function onEditHeaders(newHeaders) {
  parameters.headers = newHeaders;
  updateURL();
}
function onEditOperationName(newOperationName) {
  parameters.operationName = newOperationName
  updateURL()
}
// Produce a Location query string from a parameter object.
function locationQuery(params) {
  return (
    '?' +
    Object.keys(params)
      .filter(function (key) {
        return Boolean(params[key]);
      })
      .map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
      })
      .join('&')
  )
}
function updateURL() {
  history.replaceState(null, null, locationQuery(parameters))
}

// We control query, so we need to recreate initial query text that show up
// on visiting graphiql - in order it will be
//  - query from query string (if set)
//  - query stored in localStorage (which graphiql set when closing window)
//  - default empty query
const DEFAULT_QUERY =
  parameters.query ||
  (window.localStorage && window.localStorage.getItem('graphiql:query')) ||
  undefined

const DEFAULT_VARIABLES =
  parameters.variables ||
  (window.localStorage && window.localStorage.getItem('graphiql:variables')) ||
  undefined

const DEFAULT_OPERATION_NAME =
  parameters.operationName ||
  (window.localStorage && window.localStorage.getItem('graphiql:operationName')) ||
  undefined

const DEFAULT_HEADERS =
  parameters.headers ||
  (window.localStorage && window.localStorage.getItem('graphiql:headers')) ||
  undefined

const DEFAULT_ENDPOINT =
  parameters.endpoint ||
  (window.localStorage && window.localStorage.getItem('graphiql:endpoint')) ||
  undefined

const storedExplorerPaneState =
  typeof parameters.explorerIsOpen !== `undefined`
    ? parameters.explorerIsOpen === `false`
      ? false
      : true
    : window.localStorage
    ? window.localStorage.getItem(`graphiql:graphiqlExplorerOpen`) !== `false`
    : true

const storedCodeExporterPaneState =
  typeof parameters.codeExporterIsOpen !== `undefined`
    ? parameters.codeExporterIsOpen === `false`
      ? false
      : true
    : window.localStorage
    ? window.localStorage.getItem(`graphiql:graphiqlCodeExporterOpen`) ===
      `true`
    : false

class App extends React.Component {
  state = {
    schema: null,
    query: DEFAULT_QUERY,
    variables: DEFAULT_VARIABLES,
    operationName: DEFAULT_OPERATION_NAME,
    headers: DEFAULT_HEADERS,
    endpoint: DEFAULT_ENDPOINT,
    explorerIsOpen: storedExplorerPaneState,
    codeExporterIsOpen: storedCodeExporterPaneState,
  }

  componentDidMount() {
    graphQLFetcher({
      query: getIntrospectionQuery(),
    }).then(result => {
      const newState = { schema: buildClientSchema(result.data) }
      this.setState(newState)
    })

    const editor = this._graphiql.getQueryEditor()
    editor.setOption(`extraKeys`, {
      ...(editor.options.extraKeys || {}),
      "Shift-Alt-LeftClick": this._handleInspectOperation,
    })
  }

  _handleInspectOperation = (cm, mousePos) => {
    const parsedQuery = parse(this.state.query || '')

    if (!parsedQuery) {
      console.error(`Couldn't parse query document`)
      return null
    }

    const token = cm.getTokenAt(mousePos)
    const start = { line: mousePos.line, ch: token.start }
    const end = { line: mousePos.line, ch: token.end }
    const relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end),
    }

    const position = relevantMousePos

    const def = parsedQuery.definitions.find(definition => {
      if (!definition.loc) {
        console.log(`Missing location information for definition`)
        return false
      }

      const { start, end } = definition.loc
      return start <= position.start && end >= position.end
    })

    if (!def) {
      console.error(`Unable to find definition corresponding to mouse position`)
      return null
    }

    const operationKind =
      def.kind === `OperationDefinition`
        ? def.operation
        : def.kind === `FragmentDefinition`
        ? `fragment`
        : `unknown`

    const operationName =
      def.kind === `OperationDefinition` && !!def.name
        ? def.name.value
        : def.kind === `FragmentDefinition` && !!def.name
        ? def.name.value
        : `unknown`

    const selector = `.graphiql-explorer-root #${operationKind}-${operationName}`

    const el = document.querySelector(selector)
    if (el) {
      el.scrollIntoView()
      return true
    }

    return false
  }

  _handleEditQuery = query => {
    parameters.query = query
    updateURL()
    this.setState({ query })
  }

  _handleToggleExplorer = () => {
    const newExplorerIsOpen = !this.state.explorerIsOpen
    if (window.localStorage) {
      window.localStorage.setItem(
        `graphiql:graphiqlExplorerOpen`,
        newExplorerIsOpen
      )
    }
    parameters.explorerIsOpen = newExplorerIsOpen
    updateURL()
    this.setState({ explorerIsOpen: newExplorerIsOpen })
  }

  _handleToggleExporter = () => {
    const newCodeExporterIsOpen = !this.state.codeExporterIsOpen
    if (window.localStorage) {
      window.localStorage.setItem(
        `graphiql:graphiqlCodeExporterOpen`,
        newCodeExporterIsOpen
      )
    }
    parameters.codeExporterIsOpen = newCodeExporterIsOpen
    updateURL()
    this.setState({ codeExporterIsOpen: newCodeExporterIsOpen })
  }

  render() {
    const { query, variables, headers, endpoint, operationName, schema, codeExporterIsOpen, explorerIsOpen } = this.state
    const codeExporter = codeExporterIsOpen ? (
      <CodeExporter
        hideCodeExporter={this._handleToggleExporter}
        snippets={snippets}
        query={query}
        codeMirrorTheme="default"
      />
    ) : null

    return (
      <React.Fragment>
        <GraphiQLExplorer
          schema={schema}
          query={query}
          explorerIsOpen={explorerIsOpen}
          onEdit={this._handleEditQuery}
          onToggleExplorer={this._handleToggleExplorer}
          onRunOperation={operationName =>
            this._graphiql.handleRunQuery(operationName)
          }
        />
        <GraphiQL
          ref={ref => (this._graphiql = ref)}
          fetcher={graphQLFetcher}
          schema={schema}
          query={query}
          variables={variables}
          headers={headers}
          operationName={operationName}
          onEditQuery={this._handleEditQuery}
          onEditVariables={onEditVariables}
          onEditHeaders={onEditHeaders}
          onEditOperationName={onEditOperationName}
          headerEditorEnabled={true}
        >
          <GraphiQL.Toolbar>
            <GraphiQL.Button
              onClick={() => this._graphiql.handlePrettifyQuery()}
              label="Prettify"
              title="Prettify Query (Shift-Ctrl-P)"
            />
            <GraphiQL.Button
              onClick={() => this._graphiql.handleToggleHistory()}
              label="History"
              title="Show History"
            />
            <GraphiQL.Button
              onClick={this._handleToggleExplorer}
              label="Explorer"
              title="Toggle Explorer"
            />
            <GraphiQL.Button
              onClick={this._handleToggleExporter}
              label="Code Exporter"
              title="Toggle Code Exporter"
            />
            <span style={{ alignSelf: 'center' }}>Endpoint: <strong>{endpoint}</strong></span>
          </GraphiQL.Toolbar>
        </GraphiQL>
        {codeExporter}
      </React.Fragment>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
