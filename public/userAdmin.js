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
    const qrData = `https://digital-queue-system-ca4a3.web.app/scan-result.html?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&pos=${position}&wait=${estWait}&hospital=${encodeURIComponent(hospital)}&service=${encodeURIComponent(service)}`;
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=150x150`;

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
      hosp.innerHTML = `<strong>Hospital:</strong> <span id="ticketHospital">${hospital}</span>`;
      ticketEl.insertBefore(hosp, qrImg);
    } else {
      document.getElementById("ticketHospital").innerText = hospital;
    }

    if (!document.getElementById("ticketService")) {
      const serv = document.createElement("p");
      serv.innerHTML = `<strong>Service:</strong> <span id="ticketService">${service}</span>`;
      ticketEl.insertBefore(serv, qrImg);
    } else {
      document.getElementById("ticketService").innerText = service;
    }

    // WhatsApp Link
    const waText = `Hi ${name}, you're #${position} in the queue for ${service} at ${hospital} on ${date}. Estimated wait: ${estWait} mins.`;
    const waLink = `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}`;
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
