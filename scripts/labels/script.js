const SYNC_LABELS = require('./labels.json')
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

  const {data} = await octokit
    .request('GET /repos/{owner}/{repo}/labels', {
      owner,
      repo
    })

  for (const label of data) {
    const {name} = label

    // Skip matching labels
    if (SYNC_LABELS.find(({name: n}) => n === name)) continue

    try {
      // https://docs.github.com/en/rest/reference/issues#delete-a-label
      await octokit.request('DELETE /repos/{owner}/{repo}/labels/{name}', {owner, repo, name}).then(
        response => {
          octokit.log.info(`${repository.html_url} label(${name}) deleted.`)
        },
        error => null
      )
    } catch (err) {
      // do nothing, label already exists
    }
  }

  for (const label of SYNC_LABELS) {
    const {name, color, description} = label

    // Skip matching labels
    if (data.find(({name: n}) => n === name)) continue

    try {
      // https://docs.github.com/en/rest/reference/issues#create-a-label
      await octokit
        .request('POST /repos/{owner}/{repo}/labels', {
          owner,
          repo,
          name,
          color,
          description
        })
        .then(
          response => {
            octokit.log.info(`${repository.html_url} label(${name}) created.`)
          },
          error => null
        )
    } catch (err) {
      // do nothing, label already exists
    }
  }

  octokit.log.info(`${repository.html_url} labels updated.`)
}
