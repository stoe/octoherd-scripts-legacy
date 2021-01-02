const fs = require('fs')
const path = require('path')

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
  const language = repository.language ? repository.language.toLowerCase() : null
  const dependabotPath = '.github/dependabot.yml'

  if (await isRepoEmpty(octokit, repository)) {
    logger.debug(`${repository.html_url} is empty, ignoring`)
    return
  }

  let config = undefined
  switch (language) {
    case 'javascript':
    case 'go':
      config = path.resolve(__dirname, `dependabot.${language}.yml`)
      break
    case 'hcl':
      config = path.resolve(__dirname, `dependabot.terraform.yml`)
      break
    default:
      config = path.resolve(__dirname, `dependabot.default.yml`)
      break
  }
  const content = fs.readFileSync(config).toString('base64')

  const payload = {
    owner,
    repo,
    path: dependabotPath,
    message: '🤖 Add dependabot config',
    content,
    committer: {
      name: '@stoe/octoherd-scripts',
      email: 'octoherd@stoelzle.me'
    },
    author: {
      name: 'Stefan Stölzle',
      email: 'stefan@stoelzle.me'
    }
  }

  const sha = await octokit
    .request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path: dependabotPath
    })
    .then(
      response => response.data.sha,
      error => null
    )

  if (sha) {
    payload.sha = sha
    payload.message = '🤖 Update dependabot config'
  }

  // https://docs.github.com/rest/reference/repos#create-or-update-file-contents
  const url = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', payload).then(
    response => response.data.content.html_url,
    error => null
  )

  url && logger.info(`${url} ${sha ? 'updated' : 'added'}`)
}
