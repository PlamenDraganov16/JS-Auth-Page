const mysql = require('mysql2');

require('dotenv').config();

// Create a connection to the MySQL database using configuration options
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.PASSWORD,
  database: 'auth_app'
});

// Connect to the MySQL database and handle any connection errors
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

module.exports = db;

