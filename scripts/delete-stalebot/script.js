const {logger, skipRepoReason} = require('../helpers')

/**
 * @param {import('@octokit/core').Octokit} octokit
 * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
 */
module.exports.script = async (octokit, repository) => {
  const skip = skipRepoReason(repository)
  if (skip) {
    logger.debug(`${repository.html_url} is ${skip}, ignoring`)
    return
  }

  const owner = repository.owner.login
  const repo = repository.name
  const path = '.github/stale.yml'

  const sha = await octokit
    .request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path
    })
    .then(
      response => response.data.sha,
      error => null
    )

  if (!sha) {
    logger.debug(`${repository.html_url} ${path} not found, ignoring`)
    return
  }

  await octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
    sha,
    message: '🤖 Delete stalebot config'
  })

  logger.info(`${repository.html_url} ${path} deleted`)
}
