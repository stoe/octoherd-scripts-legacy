const {isRepoEmpty, logger, skipRepoReason} = require('../helpers')

/**
 * @param {import('@octokit/core').Octokit} octokit
 * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
 * @param {object} options
 * @param {boolean} options.signature Require commit signature protection
 */
module.exports.script = async (octokit, repository, options) => {
  const skip = skipRepoReason(repository)
  if (skip) {
    logger.debug(`${repository.html_url} is ${skip}, ignoring`)
    return
  }

  const owner = repository.owner.login
  const repo = repository.name

  const method = options.signature ? 'POST' : 'DELETE'

  // https://docs.github.com/rest/reference/repos#enable-vulnerability-alerts
  await octokit.request('PUT /repos/{owner}/{repo}/vulnerability-alerts', {
    owner,
    repo,
    mediaType: {
      previews: ['dorian']
    }
  })

  // https://docs.github.com/rest/reference/repos#enable-automated-security-fixes
  await octokit.request('PUT /repos/{owner}/{repo}/automated-security-fixes', {
    owner,
    repo,
    mediaType: {
      previews: ['london']
    }
  })

  // https://docs.github.com/rest/reference/repos#update-a-repository
  await octokit.request('PATCH /repos/{owner}/{repo}', {
    owner,
    repo,
    name: repo,
    has_issues: true,
    has_projects: false,
    has_wiki: false,
    allow_squash_merge: true,
    allow_merge_commit: false,
    allow_rebase_merge: false,
    delete_branch_on_merge: true
  })

  const branch = repository.default_branch || null
  if (branch && !(await isRepoEmpty(octokit, repository))) {
    // https://docs.github.com/rest/reference/repos#update-branch-protection
    await octokit.request('PUT /repos/{owner}/{repo}/branches/{branch}/protection', {
      owner,
      repo,
      branch,
      required_linear_history: true,
      required_status_checks: null,
      required_pull_request_reviews: {
        require_code_owner_reviews: true
      },
      restrictions: null,
      enforce_admins: null
    })

    // https://docs.github.com/rest/reference/repos#delete-commit-signature-protection
    // https://docs.github.com/rest/reference/repos#create-commit-signature-protection
    logger.log({
      level: 'debug',
      message: `${method === 'POST' ? 'create' : 'delete'} commit signature protection requirement`,
      cmd: `${method} /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures`,
      docs: `https://docs.github.com/rest/reference/repos#${
        method === 'POST' ? 'create' : 'delete'
      }-commit-signature-protection`
    })
    await octokit.request(`/repos/{owner}/{repo}/branches/{branch}/protection/required_signatures`, {
      method,
      owner,
      repo,
      branch,
      mediaType: {
        previews: ['zzzax']
      }
    })
  }

  logger.info(`${repository.html_url} settings applied`)
}
