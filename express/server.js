const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require('bcrypt');
const morgan = require('morgan')
const sql = require('mssql');

const app = express();
const port = 3001;  // Express port

const config = {
  user: 'siravit',
  password: 'Belllovecpe01',
  server: 'belldatabase.database.windows.net',
  database: 'belldatabase',
  options: {
    encrypt: true, // ใช้การเข้ารหัส
    trustServerCertificate: false, // ควรตั้งเป็น false เพื่อความปลอดภัย
  }
};

let temperature = null; // สร้างตัวแปรข้อมูลอุณหภูมิ
let humidity = null;

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw new Error('Database connection error');
  }
}

// Middleware แปลงข้อมูล JSON
app.use(morgan('dev'))
app.use(bodyParser.json());

app.use(cors({
  origin: '*'
}));

// API POST สำหรับ ESP32 ให้ส่งข้อมูลเข้ามา
app.post("/updateTemperature", (req, res) => {
  const temp = req.body.temperature;
  if (temp !== undefined) {
    temperature = temp;
    console.log(`Received temperature: ${temperature}`);
    res.status(200).send("Data received");
  } else {
    console.log("Temperature data is missing");
    res.status(400).send("Temperature data is missing");
  }
});

app.post("/updateHumidity", (req, res) => {
  const hum = req.body.humidity;
  if (hum !== undefined) {
    humidity = hum;
    console.log(`Received humidity: ${humidity}`);
    res.status(200).send("Data received");
  } else {
    console.log("Humidity data is missing");
    res.status(400).send("Humidity data is missing");
  }
});

// API สำหรับ React web ให้ดึงข้อมูลจาก Express ไปใช้
app.get("/getTemperature", (req, res) => {
  if (temperature !== null) {
    res.json({ temperature: temperature });
  } else {
    res.status(404).send("Temperature data not available");
  }
});

app.get("/getHumidity", (req, res) => {
  if (humidity !== null) {
    res.json({ humidity: humidity });
  } else {
    res.status(404).send("Humidity data not available");
  }
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const pool = await connectDB();
    const existingUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'email already exists' });
    }

    const salt = await bcrypt.genSalt(10); // ใช้แบบ asynchronous
    const passwordHash = await bcrypt.hash(password, salt); // ใช้แบบ asynchronous

    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, passwordHash)
      .query('INSERT INTO Users (email, password_hash) VALUES (@email, @password_hash)');

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const pool = await connectDB();
    const user = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (user.recordset.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const storedPasswordHash = user.recordset[0].password_hash;
    
    // ตรวจสอบรหัสผ่านแบบ asynchronous
    const isPasswordValid = await bcrypt.compare(password, storedPasswordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// เปิดใช้งาน Express พร้อมแสดงข้อความ
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});