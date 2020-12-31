/**
 * @param {import('@octokit/core').Octokit} octokit
 * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
 */
module.exports.script = async (octokit, repository) => {
  const owner = repository.owner.login
  const repo = repository.name

  // https://docs.github.com/rest/reference/repos#delete-a-repository
  const status = await octokit
    .request('DELETE /repos/{owner}/{repo}', {
      owner,
      repo
    })
    .then(
      response => response.status,
      error => null
    )

  if (status === 204) {
    octokit.log.info(`${owner}/${repo} deleted`)
  } else {
    octokit.log.error(`${owner}/${repo} not deleted`)
  }
}
