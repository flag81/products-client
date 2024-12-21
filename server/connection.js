//jshint esversion: 6
import mysql from 'mysql2';


const db = mysql.createPool({
  connectionLimit:10,
  host: "localhost",
  user: "root",
  password: "prishtina81",
  database:"zbritje",
});

db.getConnection((err,connection)=> {
  if(err)
  throw err;
  console.log('Database connected successfully');
  connection.release();
});

export default db;