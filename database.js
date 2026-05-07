const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        major TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        score INTEGER DEFAULT 0,
        finished INTEGER DEFAULT 0,
        answers TEXT,
        current_index INTEGER DEFAULT 0
    )`);
});

module.exports = db;