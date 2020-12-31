module.exports.script = async (octokit, repository, options) => {
  const owner = repository.owner.login
  const repo = repository.name
  const new_owner = options.newOwner

  await octokit
    .request('POST /repos/{owner}/{repo}/transfer', {
      owner,
      repo,
      new_owner
    })
    .then(
      response => {
        octokit.log.info(`${owner}/${repo} transfered to ${new_owner}/${repo}\n`)
      },
      error => {
        octokit.log.error(`[ERROR] ${error.errors[0].message}\n`)
      }
    )
}
