const API_URL = "http://localhost:3000/login";

const loginForm = document.getElementById("loginForm");
const error = document.getElementById("error");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  error.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      error.textContent = data.message;
      return;
    }

    localStorage.setItem("token", data.token);

    window.location.href = "dashboard.html";
  } catch (err) {
    error.textContent = "Something went wrong.";
    console.error(err);
  }
});
