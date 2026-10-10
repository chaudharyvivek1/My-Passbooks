import mysql from 'mysql2/promise';

if (!process.env.MYSQL_URI) {
  throw new Error('Invalid/Missing environment variable: "MYSQL_URI"');
}

const pool = mysql.createPool({
  uri: process.env.MYSQL_URI.replace('?ssl-mode=REQUIRED', ''),
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
