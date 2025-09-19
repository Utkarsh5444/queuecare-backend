let selectedHospital = null;
let selectedService = null;

// Hospital selection logic
document.querySelectorAll('.hospital-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.hospital-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedHospital = card.textContent.trim();
  });
});

// Service selection logic
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedService = card.querySelector('.service-name').textContent.trim();
  });
});

// Notify Python backend when a key user action is taken
function markActionCompleted(action) {
  fetch("http://localhost:5000/mark-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action })
  })
    .then(res => console.log("Action marked:", action))
    .catch(err => console.error("Failed to notify backend:", err));
}

function joinQueue() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const date = document.getElementById("appointmentDate").value;

  if (!name || !phone || !date || !selectedHospital || !selectedService) {
    alert("Please fill all fields and select hospital and service.");
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    alert("Enter a valid 10-digit phone number.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const queueRef = db.ref("queues/" + today);
  const timestamp = Date.now();
  const newEntry = { name, phone, timestamp, date, hospital: selectedHospital, service: selectedService };

  queueRef.push(newEntry).then((ref) => {
    document.getElementById("leaveBtn").style.display = "inline-block";
    const userId = ref.key;
    trackQueuePosition(userId, timestamp, name, phone, date, selectedHospital, selectedService, queueRef);
  });
}

function trackQueuePosition(userId, timestamp, name, phone, date, hospital, service, queueRef) {
  queueRef.on("value", (snapshot) => {
    const all = snapshot.val();
    if (!all) return;

    const sorted = Object.entries(all).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const position = sorted.findIndex(([key, val]) => key === userId) + 1;
    const estWait = (position - 1) * 5;

    const msg = `You are #${position} in the queue. Est. wait: ${estWait} mins.`;
    const positionMsg = document.getElementById("positionMsg");
    positionMsg.innerText = msg;

    // QR Code
    const qrData = https://digital-queue-system-ca4a3.web.app/scan-result.html?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&pos=${position}&wait=${estWait}&hospital=${encodeURIComponent(hospital)}&service=${encodeURIComponent(service)};
    const qrURL = https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=150x150;

    const qrImg = document.getElementById("qrCode");
    qrImg.src = qrURL;

    // Ticket Display
    document.getElementById("ticketName").innerText = name;
    document.getElementById("ticketPhone").innerText = phone;
    document.getElementById("ticketDate").innerText = date;
    document.getElementById("ticketPosition").innerText = position;

    const ticketEl = document.getElementById("ticket");
    ticketEl.style.display = "block";

    if (!document.getElementById("ticketHospital")) {
      const hosp = document.createElement("p");
      hosp.innerHTML = <strong>Hospital:</strong> <span id="ticketHospital">${hospital}</span>;
      ticketEl.insertBefore(hosp, qrImg);
    } else {
      document.getElementById("ticketHospital").innerText = hospital;
    }

    if (!document.getElementById("ticketService")) {
      const serv = document.createElement("p");
      serv.innerHTML = <strong>Service:</strong> <span id="ticketService">${service}</span>;
      ticketEl.insertBefore(serv, qrImg);
    } else {
      document.getElementById("ticketService").innerText = service;
    }

    // WhatsApp Link
    const waText = `Hi ${name}, you're #${position} in the queue for ${service} at ${hospital} on ${date}. Estimated wait: ${estWait} mins.`;
    const waLink = https://wa.me/91${phone}?text=${encodeURIComponent(waText)};
    const waBtn = document.createElement("a");
    waBtn.href = waLink;
    waBtn.target = "_blank";
    waBtn.innerText = "Send via WhatsApp";
    waBtn.style.display = "block";
    waBtn.style.marginTop = "10px";

    // Clear previous children
    positionMsg.innerHTML = msg;
    positionMsg.appendChild(qrImg.cloneNode(true));
    positionMsg.appendChild(waBtn);
    
  });
}
// Print Ticket
function printTicket() {
  window.print();
  markActionCompleted("print");
}

// Leave Queue
function leaveQueue() {
  alert("You have left the queue.");
  markActionCompleted("leave");
}

// Optional: Start Jarvis Voice Assistant
function startVoiceAssistant() {
  fetch("http://localhost:5000/start-jarvis")
    .then(response => console.log("Jarvis started"))
    .catch(error => console.error("Error starting Jarvis:", error));
}

function renderQueueList() {
  const today = new Date().toISOString().split("T")[0];
  const queueRef = db.ref("queues/" + today);

  queueRef.on("value", (snapshot) => {
    const data = snapshot.val();
    const queueList = document.getElementById("queueList");
    queueList.innerHTML = ""; // Clear current list

    if (!data) {
      queueList.innerHTML = "<li>No users in queue.</li>";
      return;
    }

    const sorted = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp);

    sorted.forEach(([key, user], index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>#${index + 1}</strong> ${user.name} (${user.phone}) 
        - <em>${user.service} at ${user.hospital}</em>
        <button onclick="removeUser('${key}')">Remove</button>
        <button onclick="promoteToEmergency('${key}')">Emergency</button>
      `;
      queueList.appendChild(li);
    });
  });
}

function nextPerson() {
  const today = new Date().toISOString().split("T")[0];
  const queueRef = db.ref("queues/" + today);

  queueRef.once("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return alert("No one is in the queue.");

    const sorted = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const [firstKey, firstUser] = sorted[0];

    alert(Calling: ${firstUser.name} (${firstUser.phone}));

    // Optionally remove the person after calling
    queueRef.child(firstKey).remove();
  });
}

function removeUser(userId) {
  const today = new Date().toISOString().split("T")[0];
  db.ref(queues/${today}/${userId}).remove()
    .then(() => console.log(Removed ${userId}))
    .catch(err => console.error("Error removing user:", err));
}

function promoteToEmergency(userId) {
  const today = new Date().toISOString().split("T")[0];
  const userRef = db.ref(queues/${today}/${userId});
  const queueRef = db.ref(queues/${today});

  userRef.once("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const emergencyData = {
      ...data,
      timestamp: 1// Ensure it's older than any other
    };

    // Remove and re-add with older timestamp
    userRef.remove()
      .then(() => queueRef.push(emergencyData))
      .then(() => console.log("User promoted to emergency"))
      .catch(err => console.error("Error promoting:", err));
  });
}



if (document.querySelector(".admin-panel")) {
  renderQueueList();
}



