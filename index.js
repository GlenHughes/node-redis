const express = require("express")
const fetch = require("node-fetch")
const redis = require("redis")

const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.REDIS_PORT || 6379

const client = redis.createClient(REDIS_PORT)

const app = express()

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} GitHub repos</h2>`
}

// make request to github for data
async function getTotalRepos(req, res, next) {
  try {
    console.log("Fetching data...")

    const { username } = req.params

    const response = await fetch(`https://api.github.com/users/${username}`)

    const data = await response.json()

    const repos = data.public_repos

    // Set data to redis
    client.setex(username, 3600, repos)


    res.send(setResponse(username, repos))
   } catch (error){
    console.error(error)
    res.status(500)
  }
}

// Cache middleware
function cache(req, res, next) {
  const { username } = req.params

  client.get(username, (err, data) => {
    if (err) {
      throw err
    }

    if (data !== null) {
      res.send(setResponse(username, data))
    } else {
      next()
    }
  })
}

app.get("/repos/:username", cache, getTotalRepos)

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`)
})