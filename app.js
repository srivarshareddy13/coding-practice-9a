const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
const dbPath = path.join(__dirname, 'userData.db')

app.use(express.json())
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('Success')
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer() 
const validateUser = (password) => {
    return password.length > 4 
}
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body;
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectedUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectedUserQuery)
  if (dbUser === undefined) {
      const createUser = `
            INSERT INTO 
                user (userrname, name, password, gender, location)
            VALUES (
               '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
                    );
                `;
        if (validateUser(password)) {
                    const result = await db.run(createUser)
                    
                    response.send('User created successfully');
                  }  else {
                        response.status(400)
                        response.send("Password is too short");
                  }
    }
      else {
            response.status(400)
            response.send('User already exists');
            }
});

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectedUserQuery = ` SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectedUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password);
    if (isPassword === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
});
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectedUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectedUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send("Invalid user")
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPassword === true) {
      if (validateUser(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword,10);
        const updateQuery = `
          UPDATE 
            user
          SET 
            password = '${hashedPassword}'
          WHERE 
            username = '${username}';
        `;
        const user = await db.run(updateQuery)
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short")
      }
    } else {
      response.status(400)
      response.send("Invalid current password")
    }
  }
  
})

module.exports = app;
