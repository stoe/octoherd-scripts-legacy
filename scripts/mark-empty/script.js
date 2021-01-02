const {isRepoEmpty, logger, skipRepoReason} = require('../helpers')

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

  if (await isRepoEmpty(octokit, repository)) {
    // https://docs.github.com/rest/reference/activity#unstar-a-repository-for-the-authenticated-user
    await octokit.request('DELETE /user/starred/{owner}/{repo}', {
      owner,
      repo
    }).then(
      response => null,
      error => null
    )

    // https://docs.github.com/rest/reference/repos#replace-all-repository-topics
    await octokit
      .request('PUT /repos/{owner}/{repo}/topics', {
        owner,
        repo,
        names: ['empty-repo'],
        mediaType: {
          previews: ['mercy']
        }
      })
      .then(
        response => {
          logger.info(`${repository.html_url} marked as empty`)
        },
        error => null
      )
  }
}
