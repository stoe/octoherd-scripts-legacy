const SYNC_LABELS = require('./labels.json')
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

  const {data} = await octokit.request('GET /repos/{owner}/{repo}/labels', {
    owner,
    repo
  })

  const deleteLabels = data.filter(have => {
    return !SYNC_LABELS.some(want => {
      return have.name === want.name
    })
  })

  for (const label of deleteLabels) {
    const {name} = label

    // https://docs.github.com/en/rest/reference/issues#delete-a-label
    await octokit.request('DELETE /repos/{owner}/{repo}/labels/{name}', {owner, repo, name}).then(
      response => {
        logger.log({
          level: 'debug',
          message: `${owner}/${repo} label deleted`,
          label: name,
          url: repository.html_url
        })
      },
      error => null
    )
  }

  const createLabels = SYNC_LABELS.filter(want => {
    return !data.some(have => {
      return want.name === have.name
    })
  })

  for (const label of createLabels) {
    const {name, color, description} = label

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
          logger.log({
            level: 'debug',
            message: `${owner}/${repo} label created`,
            label: name,
            url: repository.html_url
          })
        },
        error => null
      )
  }

  logger.info(`${repository.html_url}/labels updated`)
}
