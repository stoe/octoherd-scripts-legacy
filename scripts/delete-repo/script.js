module.exports.script = async (octokit, repository) => {
  const owner = repository.owner.login
  const repo = repository.name

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
