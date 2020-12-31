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

  if (branch && commits > 0) {
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

    // https://docs.github.com/rest/reference/repos#create-commit-signature-protection
    await octokit.request('POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures', {
      owner,
      repo,
      branch,
      mediaType: {
        previews: ['zzzax']
      }
    })
  }

  octokit.log.info(`settings applied to ${repository.html_url}`)
}
