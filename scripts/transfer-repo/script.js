/**
 * @param {import('@octokit/core').Octokit} octokit
 * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
 * @param {object} options
 * @param {string} options.newOwner GitHub login to transfer the repository to.
 */
module.exports.script = async (octokit, repository, options) => {
  const owner = repository.owner.login
  const repo = repository.name
  const new_owner = options.newOwner

  // https://docs.github.com/rest/reference/repos#transfer-a-repository
  await octokit
    .request('POST /repos/{owner}/{repo}/transfer', {
      owner,
      repo,
      new_owner
    })
    .then(
      response => {
        octokit.log.info(`${owner}/${repo} transfered to ${new_owner}/${repo}`)
      },
      error => {
        octokit.log.error(`[ERROR] ${error.errors[0].message}`)
      }
    )
}
