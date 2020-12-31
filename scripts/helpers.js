module.exports = {
  /**
   * @param {import('@octokit/openapi-types').components["schemas"]["repository"]} repository
   * @returns {string|undefined} Skip repository for this reason
   */
  skipRepoReason: repository => {
    if (repository.archived) return 'archived'

    if (repository.disabled) return 'disabled'

    if (repository.fork) return 'a fork'

    return undefined
  }
}
