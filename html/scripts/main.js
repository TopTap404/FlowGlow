document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // ป้องกันการโหลดหน้าใหม่
  
    // ดึงค่า username และ password จากฟอร์ม
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    const apiUrl = 'https://flowglow.eastasia.cloudapp.azure.com:3001/login';
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          window.location.href ="dashboard.html";
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  });