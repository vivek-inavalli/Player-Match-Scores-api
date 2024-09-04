const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()

app.use(express.json())

let db = null

const initializing = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server: http://localhost:3000')
    })
  } catch (err) {
    process.exit(1)
  }
}

initializing()

app.get('/players/', async (req, res) => {
  const playerQuery = `
    SELECT player_id as playerId , player_name as playerName FROM   player_details;
   `
  const playerRes = await db.all(playerQuery)
  res.send(playerRes)
})

app.get('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const getPlayerId = `
   SELECT player_id as playerId , player_name as playerName FROM   player_details
   WHERE player_id = ${playerId};
  `
  const getPlayerIdRes = await db.get(getPlayerId)
  res.send(getPlayerIdRes)
})

app.put('/players/:playerId/', async (req, res) => {
  const {playerName} = req.body
  const {playerId} = req.params
  const playerNameQuery = `
   UPDATE player_details
  SET 
      player_name = '${playerName}'
  WHERE player_id = ${playerId}
   `
  await db.run(playerNameQuery)
  res.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (req, res) => {
  const {matchId} = req.params
  const getMatchesQuery = `
  SELECT match_id as matchId , match , year FROM match_details
  WHERE match_id = ${matchId};
  `
  const getmatchRes = await db.get(getMatchesQuery)
  res.send(getmatchRes)
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
    SELECT 
      match_details.match_id AS matchId, 
      match_details.match AS match, 
      match_details.year AS year 
    FROM 
      match_details 
    INNER JOIN 
      player_match_score 
    ON 
      match_details.match_id = player_match_score.match_id 
    WHERE 
      player_match_score.player_id = ${playerId};
  `
  const matches = await db.all(getPlayerMatchesQuery)
  response.send(matches)
})
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersInMatchQuery = `
    SELECT 
      player_details.player_id AS playerId, 
      player_details.player_name AS playerName 
    FROM 
      player_details 
    INNER JOIN 
      player_match_score 
    ON 
      player_details.player_id = player_match_score.player_id 
    WHERE 
      player_match_score.match_id = ${matchId};
  `
  const players = await db.all(getPlayersInMatchQuery)
  response.send(players)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerStatsQuery = `
    SELECT 
      player_details.player_id AS playerId, 
      player_details.player_name AS playerName, 
      SUM(player_match_score.score) AS totalScore, 
      SUM(player_match_score.fours) AS totalFours, 
      SUM(player_match_score.sixes) AS totalSixes 
    FROM 
      player_details 
    INNER JOIN 
      player_match_score 
    ON 
      player_details.player_id = player_match_score.player_id 
    WHERE 
      player_details.player_id = ${playerId};
  `
  const playerStats = await db.get(getPlayerStatsQuery)
  response.send(playerStats)
})
module.exports = app
