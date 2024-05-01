const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'app.db')
let database = null

const initilization = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server runing at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error at ${e.massege}`)
    process.exit(1)
  }
}

initilization()

const authentication = (request, response, next) => {
  let jwtToken = null
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'My_screct_Token', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        request.id = payload.id
      }
    })
  }
}

// API POST
app.post('/tesks/', async (request, response) => {
  const {id, title, description, status, assignee_id, created_at, updated_at} =
    request.body
  const tesksQuery = `
  INSERT INTO Tesks(id, title, description, status, assignee_id, created_at, updated_at)
  VALUES (
    ${id},
    '${title}',
    '${description}',
    '${status}',
    ${assignee_id},
    '${created_at}',
    '${updated_at}'
  );
  `
  await database.run(tesksQuery)
  response.send('create Successfuly')
})

//API GET ALL
app.get('/tesks/', async (request, response) => {
  const tesksQuery = `
  SELECT *
  FROM Tesks
  ORDER BY 
  id;
  `
  const allthetesks = await database.all(tesksQuery)
  response.send(allthetesks)
})
// API GET ID
app.get('/tasks/:id/', async (request, response) => {
  const {id} = request.params
  const gettaskQuery = `
  SELECT *
  FROM Tesks
  WHERE
  id = ${id}
  ORDER BY 
  id;
  `
  const testnumber = await database.get(gettaskQuery)
  response.send(testnumber)
})

//API UPDATE
app.put('/tasks/:id/', async (request, response) => {
  const {id} = request.params
  const {title, description, status, created_at, updated_at} = request.body
  const updattask = `
  UPDATE
  Tesks
  SET
  title='${title}',
  description='${description}',
  status='${status}',
  created_at='${created_at}',
  updated_at='${updated_at}'
  WHERE 
  id = ${id};
  `
  await database.run(updattask)
  response.send('update Task')
})
//API delete
app.delete('/tasks/:id/', async (request, response) => {
  const {id} = request.params
  const deletetask = `
  DELETE FROM 
  Tesks
  WHERE 
  id = ${id};
  `
  await database.run(deletetask)
  response.send('Book Deleted Successfully')
})
// json web Token
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectuserQuery = `SELECT * FROM users WHERE username = '${username}';`
  const dbUser = await database.get(selectuserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password_hash)
    if (isPasswordMatch) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'My_screct_Token')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
//middleWare
app.get('/users/', authentication, async (request, response) => {
  const getusersQuery = `
  SELECT * 
  FROM users 
  ORDER BY 
  id;
  `
  const listdata = await database.all(getusersQuery)
  response.send(listdata)
})
module.exports = app
