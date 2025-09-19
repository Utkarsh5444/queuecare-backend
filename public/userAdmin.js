let selectedHospital = null;
let selectedService = null;

// Wait for DOM to be ready before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeSelections();
});

// Also try when window loads (backup)
window.addEventListener('load', function() {
    initializeSelections();
});

function initializeSelections() {
    // Hospital selection logic
    const hospitalCards = document.querySelectorAll('.hospital-card');
    console.log('Found hospital cards:', hospitalCards.length); // Debug log
    
    hospitalCards.forEach(card => {
        card.addEventListener('click', () => {
            console.log('Hospital card clicked:', card.textContent.trim()); // Debug log
            hospitalCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedHospital = card.textContent.trim();
            console.log('Selected hospital:', selectedHospital); // Debug log
        });
    });

    // Service selection logic
    const serviceCards = document.querySelectorAll('.service-card');
    console.log('Found service cards:', serviceCards.length); // Debug log
    
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            console.log('Service card clicked:', card.querySelector('.service-name').textContent.trim()); // Debug log
            serviceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedService = card.querySelector('.service-name').textContent.trim();
            console.log('Selected service:', selectedService); // Debug log
        });
    });
}

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

// FIXED: Join Queue function with proper syntax
function joinQueue() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("appointmentDate").value;
    
    console.log('Join queue called with:', { name, phone, date, selectedHospital, selectedService }); // Debug log
    
    if (!name || !phone || !date || !selectedHospital || !selectedService) {
        alert("Please fill all fields and select hospital and service.");
        return;
    } // FIXED: Added missing closing brace
    
    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Enter a valid 10-digit phone number.");
        return;
    } // FIXED: Added missing closing brace
    
    const today = new Date().toISOString().split("T")[0];
    const queueRef = db.ref("queues/" + today);
    const timestamp = Date.now();
    const newEntry = { 
        name, 
        phone, 
        timestamp, 
        date, 
        hospital: selectedHospital, 
        service: selectedService 
    };
    
    queueRef.push(newEntry).then((ref) => {
        document.getElementById("leaveBtn").style.display = "inline-block";
        const userId = ref.key;
        trackQueuePosition(userId, timestamp, name, phone, date, selectedHospital, selectedService, queueRef);
    });
} // FIXED: Added missing closing brace

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
            hosp.innerHTML = `<strong>Hospital:</strong> ${hospital}`;
            hosp.id = "ticketHospital";
            ticketEl.insertBefore(hosp, qrImg);
        } else {
            document.getElementById("ticketHospital").innerHTML = `<strong>Hospital:</strong> ${hospital}`;
        }
        
        if (!document.getElementById("ticketService")) {
            const serv = document.createElement("p");
            serv.innerHTML = `<strong>Service:</strong> ${service}`;
            serv.id = "ticketService";
            ticketEl.insertBefore(serv, qrImg);
        } else {
            document.getElementById("ticketService").innerHTML = `<strong>Service:</strong> ${service}`;
        }
        
        // WhatsApp Link - Updated to use your desired format
        const now = new Date();
        const bookingTime = now.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const waText = `🏥 *AyurSutra Hospital - Digital Queue*

🎟️ *Your Appointment Details:*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Patient:* ${name}
📞 *Phone:* ${phone}
📅 *Date:* ${date}
🔢 *Queue Number:* ${position}
⏰ *Booked:* ${bookingTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *Instructions:*
• Please arrive 15 minutes before your appointment
• Show this message at the reception desk
• Keep your phone ready for queue updates
• Wait for your number to be called

🏥 *Hospital:* ${hospital}
📍 *Location:* [Your Hospital Address]
☎️ *Contact:* [Hospital Phone Number]

✅ *Status:* CONFIRMED APPOINTMENT
🌿 Thank you for choosing AyurSutra Healthcare!

_This is an automated message from AyurSutra Digital Queue System_`;
        
        const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`;
        
        // Update WhatsApp button
        const waBtn = document.getElementById("waBtn");
        if (waBtn) {
            waBtn.href = waLink;
            waBtn.onclick = function() {
                window.open(waLink, '_blank');
                return false;
            };
        }
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
            queueList.innerHTML = "<li>No patients in queue today.</li>";
            return;
        }
        
        // Convert to array and sort by timestamp
        const entries = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        entries.forEach(([key, patient], index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>#${index + 1}</strong> - ${patient.name} 
                <br><small>${patient.service} at ${patient.hospital}</small>
                <br><small>Phone: ${patient.phone}, Date: ${patient.date}</small>
            `;
            queueList.appendChild(li);
        });
    });
}

// Admin function for calling next person
function nextPerson() {
    const today = new Date().toISOString().split("T")[0];
    const queueRef = db.ref("queues/" + today);
    
    queueRef.once("value", (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            alert("No patients in queue.");
            return;
        }
        
        // Get the first person in queue (oldest timestamp)
        const entries = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp);
        const [nextKey, nextPatient] = entries[0];
        
        if (confirm(`Call ${nextPatient.name} for ${nextPatient.service}?`)) {
            // Remove from queue
            queueRef.child(nextKey).remove();
            alert(`${nextPatient.name} has been called and removed from queue.`);
        }
    });
}
