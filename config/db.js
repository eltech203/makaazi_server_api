const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

pool.on('connection', () => {
  console.log('✅ MySQL pool connection established');
});

module.exports = pool;



// require('dotenv').config();
// const express = require('express')
// const router = express.Router();
// const mysql  = require('mysql2')
//  const socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
// let db;

// if(socketPath != null){
//         db =  mysql.createConnection({
//         socketPath: socketPath,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME
//         });
// }else{    
//     db = mysql.createConnection({
//             host     : 'localhost',
//             user     : 'root',
//             database : 'test_makaazi_db',
            
//         });

// }




// //Create a Connection to Database

// db.connect((err)=>{
//     if(err!=null){
//         console.log('No Connect to database')
        
//     }else{
//         console.log('Connect to database')
//     }
    
// })

// module.exports = db;