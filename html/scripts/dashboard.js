// ฟังก์ชัน Logout ไปหน้า Login
function logout() {
    window.location.href = "index.html"; // เปลี่ยนเป็นหน้า Login 
  }
  
  // ฟังก์ชันแสดงเวลาและวันที่แบบ Real-time
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
  
    document.getElementById("clock").textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById("date").textContent = `${day}, ${date} ${month} ${year}`;
  }
  
  async function fetchTemperature() {
    const displayElement = document.getElementById('temperature');
    try {
      const response = await fetch('http://104.214.176.253:3001/getTemperature');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      const temperature = data.temperature;
  
      displayElement.textContent = temperature !== null
        ? `Temperature : ${temperature} °C`
        : "No temperature data available.";
    } catch (error) {
      console.error('Error fetching temperature:', error);
      displayElement.textContent = "Loading Temperature..";
    }
  }

  async function fetchHumidity() {
    const displayElement = document.getElementById('humidity');
    try {
      const response = await fetch('http://104.214.176.253:3001/getHumidity');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      const humidity = data.humidity;
  
      displayElement.textContent = humidity !== null
        ? `Current Temperature: ${humidity}°C`
        : "No humidity data available.";
    } catch (error) {
      console.error('Error fetching humidity:', error);
      displayElement.textContent = "Failed to fetch humidity data.";
    }
  }
  // เรียกใช้ updateClock ทุก 1 วินาที
  setInterval(fetchTemperature, 1000);
  setInterval(updateClock, 1000);
  updateClock();
  window.onload = fetchTemperature();
  