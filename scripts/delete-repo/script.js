const {logger} = require('../helpers')

/**
 * @param {import('@octokit/core').Octokit} octokit
 * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
 */
module.exports.script = async (octokit, repository) => {
  const owner = repository.owner.login
  const repo = repository.name

  // NOTE: disabled
  return

  // https://docs.github.com/rest/reference/repos#delete-a-repository
  const status = await octokit
    .request('DELETE /repos/{owner}/{repo}', {
      owner,
      repo
    })
    .then(
      response => response.status,
      error => error.status
    )

  if (status === 204) {
    logger.info(`${owner}/${repo} deleted`)
  } else {
    logger.error(`${owner}/${repo} not deleted`)
  }
}
