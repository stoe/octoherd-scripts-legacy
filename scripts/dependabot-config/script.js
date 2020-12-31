const fs = require('fs')
const path = require('path')

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
  const branch = repository.default_branch || null
  const language = repository.language ? repository.language.toLowerCase() : null
  const dependabotPath = '.github/dependabot.yml'

  let commits = 0

  if (branch) {
    // https://docs.github.com/rest/reference/repos#list-commits
    commits = await octokit
      .request('GET /repos/{owner}/{repo}/commits', {
        owner,
        repo,
        sha: branch,
        per_page: 10,
        page: 1
      })
      .then(
        response => response.data.length,
        error => 0
      )
  }

  if (commits < 1) {
    octokit.log.info(`${repository.html_url} is empty, ignoring.`)
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
    content
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

  octokit.log.info(`${url} ${sha ? 'updated' : 'added'}.`)
}
