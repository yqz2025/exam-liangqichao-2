const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const XLSX = require('xlsx');
const os = require('os');
const questions = require('./questions.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 管理员密码 自行修改
const ADMIN_PASSWORD = "123456";

app.post('/api/register', (req, res) => {
    const { name, className, major } = req.body;
    db.get('SELECT * FROM students WHERE name = ? AND class = ? AND major = ?', [name, className, major], (err, row) => {
        if (row) {
            if (row.finished === 1) {
                return res.json({ success: false, msg: "你已完成答题，不能重复作答" });
            }
            return res.json({ success: true, student: row, msg: "欢迎继续答题" });
        }
        const sql = `INSERT INTO students (name, class, major, start_time, current_index) 
                     VALUES (?, ?, ?, datetime('now'), 0)`;
        db.run(sql, [name, className, major], function () {
            res.json({ success: true, student: { id: this.lastID } });
        });
    });
});

app.get('/api/questions', (req, res) => {
    res.json(questions);
});

app.post('/api/save-progress', (req, res) => {
    const { studentId, currentIndex, answers } = req.body;
    db.run(`UPDATE students SET current_index = ?, answers = ? WHERE id = ?`,
        [currentIndex, JSON.stringify(answers), studentId],
        () => res.json({ success: true })
    );
});

app.post('/api/submit', (req, res) => {
    const { studentId, answers } = req.body;
    let score = 0;
    questions.forEach((q, idx) => {
        const userAns = answers[idx]?.toString();
        const rightAns = q.answer.toString();
        if (userAns === rightAns) {
            score += q.type === "多选题" ? 4 : 3;
        }
    });
    db.run(`UPDATE students SET score = ?, finished = 1, end_time = datetime('now'), answers = ? WHERE id = ?`,
        [score, JSON.stringify(answers), studentId],
        () => res.json({ success: true, score })
    );
});

app.post('/api/admin-login', (req, res) => {
    res.json({ success: req.body.password === ADMIN_PASSWORD });
});

app.get('/api/admin/students', (req, res) => {
    db.all('SELECT * FROM students ORDER BY id DESC', (err, rows) => {
        res.json(rows);
    });
});

app.get('/api/admin/export', (req, res) => {
    db.all('SELECT * FROM students', (err, rows) => {
        const data = rows.map(s => ({
            姓名: s.name,
            班别: s.class,
            专业部门: s.major,
            开始时间: s.start_time,
            交卷时间: s.end_time,
            得分: s.score,
            状态: s.finished ? "已完成" : "未完成"
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "成绩");
        const file = "梁启超家风知识竞赛成绩.xlsx";
        XLSX.writeFile(wb, file);
        res.download(file);
    });
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}



const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`==========================================`);
  console.log(`✅ 服务启动成功`);
  console.log(`🌐 学生答题地址：http://${ip}:${PORT}`);
  console.log(`🔐 管理员后台：http://${ip}:${PORT}/admin.html`);
  console.log(`==========================================`);
});