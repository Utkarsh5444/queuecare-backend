// Chatbot functionality
function openChatbot() {
  window.open("https://queucarebot-duvgwz7nq2hxzmggmux8xx.streamlit.app/", "_blank");
}

// Get user role from localStorage
function getUserRole() {
  return localStorage.getItem("userRole"); // 'admin', 'user', or null
}

document.addEventListener("DOMContentLoaded", () => {
  const authActionBtn = document.getElementById("authActionBtn");
  const role = getUserRole();

  // Handle role-based action button
  if (role === "admin") {
    authActionBtn.textContent = "Go to Dashboard";
    authActionBtn.addEventListener("click", () => {
      window.location.href = "/admin-dashboard.html";
    });
  } else if (role === "user") {
    authActionBtn.textContent = "Join Queue";
    authActionBtn.addEventListener("click", () => {
      window.location.href = "/join-queue.html";
    });
  } else {
    // For visitors with no role set
    authActionBtn.textContent = "Login / Register";
    authActionBtn.addEventListener("click", () => {
      document.getElementById("authModal").classList.add("show");
    });
  }

  // Family Mode Modal
  const familyModeBtn = document.getElementById("familyModeBtn");
  const familyModal = document.getElementById("familyModeModal");
  const closeModalBtn = document.getElementById("closeFamilyModal");
  const submitFamilyIdBtn = document.getElementById("submitFamilyIdBtn");
  const familyIdInput = document.getElementById("familyIdInput");

  if (familyModeBtn && familyModal) {
    familyModeBtn.addEventListener("click", () => {
      familyModal.classList.add("show");
    });

    closeModalBtn.addEventListener("click", () => {
      familyModal.classList.remove("show");
    });

    window.addEventListener("click", (event) => {
      if (event.target === familyModal) {
        familyModal.classList.remove("show");
      }
    });

    submitFamilyIdBtn.addEventListener("click", () => {
      const familyId = familyIdInput.value.trim();
    
      if (familyId === "1919") { // compare as string
        alert(`Family ID entered: ${familyId}`);
        familyModal.classList.remove("show");
        window.location.href = "family.html"; // redirect immediately
      } else {
        alert("Please enter a valid Family ID.");
      }
    });
    
  }

  // Auth Modal Close
  const authModal = document.getElementById("authModal");
  const closeAuthBtn = document.getElementById("closeAuthModal");

  if (closeAuthBtn && authModal) {
    closeAuthBtn.addEventListener("click", () => {
      authModal.classList.remove("show");
    });

    window.addEventListener("click", (e) => {
      if (e.target === authModal) {
        authModal.classList.remove("show");
      }
    });
  }

  // Login buttons
  const userLoginBtn = document.getElementById("userLoginBtn");
  const adminLoginBtn = document.getElementById("adminLoginBtn");

  if (userLoginBtn) {
    userLoginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }
});
