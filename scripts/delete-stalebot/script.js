const {skipRepoReason} = require('../helpers')

/**
 * @param {import('@octokit/core').Octokit} octokit
 * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
 */
module.exports.script = async (octokit, repository) => {
  const skip = skipRepoReason(repository)
  if (skip) {
    octokit.log.info(`${repository.html_url} is ${skip}, ignoring.`)
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

  if (!sha) return

  await octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
    sha,
    message: '🤖 Delete stalebot config'
  })

  octokit.log.info(`${repository.html_url} ${path} deleted.`)
}
