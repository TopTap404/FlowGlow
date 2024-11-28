const express = require("express"); //Express Framework ใช้สำหรับพัฒนา API
const bodyParser = require("body-parser"); //Middleware สำหรับอ่านข้อมูลแบบ JSON
const cors = require("cors"); //Middleware สำหรับจัดการ API ให้ทำงานเฉพาะ IP ที่กำหนด
const bcrypt = require('bcrypt'); //Library การเข้ารหัส
const morgan = require('morgan') //Middleware สำหรับตรวจสอบสถานะของ Server
const sql = require('mssql'); //Module SQLserver
const https = require("https"); //Module สำหรับทำ HTTPS
const fs = require("fs") //Module สำรหับ เขียน,อ่าน,สร้าง,ลบไฟล์

const app = express();
const port = 3001;  // Express port

const config = {
  user: 'siravit',
  password: 'Belllovecpe01',
  server: 'belldatabase.database.windows.net',
  database: 'belldatabase',
  options: {
    encrypt: true, 
    trustServerCertificate: false, 
  }
};

const sslkey = {
  key: fs.readFileSync('/home/paramet/privkey.pem'),
  cert: fs.readFileSync('/home/paramet/key/cert.pem'),
  ca: fs.readFileSync('/home/paramet/key/chain.pem')
}

let temperature = null;
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

app.use(morgan('dev'))  // Middleware ตรวจสอบสถานะ Server
app.use(bodyParser.json()); // Middleware แปลงข้อมูล JSON

app.use(cors({
  origin: '*' // Middleware ตรวจสอบสิทธิของ IP
}));

// API POST สำหรับ ESP32 ให้ส่งข้อมูลเข้ามาหา Server
app.post("/upTemp", (req, res) => {
  const temp = req.body.temperature;
  if (temp !== undefined) { // ตรวจสอบว่าค่า temp มีค่าจริงหรือไม่
    temperature = temp;
    console.log(`Received temperature: ${temperature}`);
    res.status(200).send("Data received");
  } else {
    console.log("Temperature data is missing");
    res.status(400).send("Temperature data is missing");
  }
});
// API POST สำหรับ ESP32 ให้ส่งข้อมูลเข้ามาหา Server
app.post("/upHum", (req, res) => {
  const hum = req.body.humidity;
  if (hum !== undefined) { // ตรวจสอบว่าค่า hum มีค่าจริงหรือไม่
    humidity = hum;
    console.log(`Received humidity: ${humidity}`);
    res.status(200).send("Data received");
  } else {
    console.log("Humidity data is missing");
    res.status(400).send("Humidity data is missing");
  }
});

// API สำหรับ Website ให้ดึงข้อมูลจาก Express ไปใช้
app.get("/getTemp", (req, res) => {
  if (temperature !== null) { 
    res.json({ temperature: temperature });
  } else {
    res.status(404).send("Temperature data not available");
  }
});

app.get("/getHum", (req, res) => {
  if (humidity !== null) { 
    res.json({ humidity: humidity });
  } else {
    res.status(404).send("Humidity data not available");
  }
});

// API สมัครสมาชิกโดยรับข้อมูลจาก Website และเก็บข้อมูลลง Database
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) { // ตรวจสอบว่า email และ password ถูกกรอกครบถ้วน
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const pool = await connectDB(); // connect Database
    const existingUser = await pool.request() // ตรวจสอบว่ามีชื่อผู้ใช้อยู่แล้วหรือไม่โดยการส่ง request ไปยัง Database เพื่อเทียบข้อมูลตัวแปร email กับ Database
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'email already exists' });
    }

    const salt = await bcrypt.genSalt(10); // สร้างตัวแปร Hash สำหรับ password
    const passwordHash = await bcrypt.hash(password, salt); // นำ password มาเข้ารหัส

    await pool.request() // ส่ง request เพื่อเพิ่มข้อมูลใน Database
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

// function เก็บข้อมูลลง database
async function savetempandHumtodatabase(data,data2){
  try {const pool = await connectDB();
  await pool.request()
    .input('temperature', sql.Float, data)
    .input('humidity', sql.Float, data2)
    .query('INSERT INTO SensorData (temperature, humidity) VALUES (@temperature,@humidity)');
    
    console.log("Data inserted successfully!");
  }catch(err){
    console.error('Error inserting data:', err);
  }
};
  
function startRealTimeDataCollection() {
  setInterval(async () => {
    if (temperature !== null && humidity !== null) {
      console.log(`Saving data to database: Temperature = ${temperature}, Humidity = ${humidity}`);
      await savetempandHumtodatabase(temperature, humidity);
    } else {
      console.log('No data to save');
    }
  }, 5000); 
}

startRealTimeDataCollection();

https.createServer(sslOptions, app).listen(port, () => {
  console.log('HTTPS Server is Running on port ${port}')
});
