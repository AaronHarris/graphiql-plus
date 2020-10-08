const getQuery = (arg, spaceCount) => {
  const { operationDataList } = arg
  const { query, variables } = operationDataList[0]
  const anonymousQuery = query.replace(/query\s.+{/gim, `{`)
  return (
    ` `.repeat(spaceCount) +
    anonymousQuery.replace(/\n/g, `\n` + ` `.repeat(spaceCount))
  )
}

const getVariables = (arg, spaceCount) => {
  const { operationDataList } = arg
  const { variables } = operationDataList[0]
  const pad = ' '.repeat(spaceCount)
  if (Object.keys(variables).length > 0) {
    return JSON.stringify(variables, null, 2).replace(/\n/g, '\n' + pad)
  }
  return ''
}

const graphqlRequest = {
  name: `graphql-request`,
  language: `JavaScript`,
  codeMirrorMode: `jsx`,
  options: [{
    id: 'client',
    label: 'reuseable client',
    initial: true,
  }],
  generate:   ({ serverUrl = '', headers = {}, context = {}, operationDataList = [], options = {} }) => {
    operationDataList
    hasVariables = Object.keys(arg.operationDataList[0]?.variables) != 0
    hasHeaders = Object.keys(arg.headers).length != 0
    if (arg.options.client || hasHeaders) {
      return `import { GraphQLClient, gql } from 'graphql-request'

const endpoint = '${arg.serverUrl}'
const graphQLClient = new GraphQLClient(endpoint${
  !hasHeaders ? '' : `, {
  headers: ${JSON.stringify(arg.headers, null, 2).replace(/\n/g, '\n    ')}
}`})

const query = gql\`
${getQuery(arg, 2)}
\`
${hasVariables ? `const variables = ${getVariables(arg, 0)}\n` : ''}
graphQLClient.request(query${hasVariables ? ', variables' : ''})
  .then(data => console.log(data))
  .catch(errors => console.error(errors))
`
    }
    return `import { request, gql } from 'graphql-request'

const query = gql\`
${getQuery(arg, 2)}
\`
${hasVariables ? `const variables = ${getVariables(arg, 0)}\n` : ''}
request('${arg.serverUrl}', query${!hasVariables ? '' : `, ${getVariables(arg, 2)}`})
  .then(data => console.log(data))
  .catch(error => console.error(error))
`
  },
};

export default [graphqlRequest]
