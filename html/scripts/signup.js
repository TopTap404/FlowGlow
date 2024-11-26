document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // ป้องกันการโหลดหน้าใหม่
  
    // ดึงค่าจากฟอร์ม
    const email = document.getElementById('email').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const apiUrl = 'http://localhost:3001/register';
  
    // ตรวจสอบว่ารหัสผ่านตรงกัน
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (password == confirmPassword) {
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),  // ส่งข้อมูลไปในรูปแบบ JSON
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            // ถ้าการเข้าสู่ระบบสำเร็จ
            window.location.href ="./index.html";
          }
        })
        .catch(error => {
          console.error('Error:', error);
        }); 
    } else {
      console.error('Error:Password not Match');
    }
  });