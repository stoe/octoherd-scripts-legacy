const octoherd = require('@octoherd/cli')

const token = process.env.GITHUB_TOKEN
const {Octokit} = require('@octokit/rest')
const octokit = new Octokit({
  auth: token
})

const {resolve} = require('path')
const {logger} = require('./scripts/helpers')

;(async () => {
  const data = await octokit.paginate('GET /user/repos', {
    visibility: 'all',
    affiliation: 'owner',
    sort: 'full_name'
  })

  let repos = []

  data.map(repository => {
    if (!repository.archived && !repository.disabled && !repository.fork) {
      repos.push(repository.full_name)
    }
  })

  logger.log({
    level: 'debug',
    message: `found ${repos.length} repositories`
  })

  try {
    // mark empty repos
    console.time('mark empty repos')
    await octoherd({
      token,
      script: resolve(process.env.PWD, 'scripts/mark-empty/script.js'),
      repos,
      cache: false
    })
    console.timeEnd('mark empty repos')

    // delete stalebot config
    console.time('delete stalebot config')
    await octoherd({
      token,
      script: resolve(process.env.PWD, 'scripts/delete-stalebot/script.js'),
      repos,
      cache: false
    })
    console.timeEnd('delete stalebot config')

    // sync labels
    console.time('sync labels')
    await octoherd({
      token,
      script: resolve(process.env.PWD, 'scripts/labels/script.js'),
      repos,
      cache: false
    })
    console.timeEnd('sync labels')
  } catch (err) {
    logger.error(err)
  }
})()
