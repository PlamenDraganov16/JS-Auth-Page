const mysql = require('mysql2');

require('dotenv').config();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.PASSWORD, 
  database: 'auth_app'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

module.exports = db;