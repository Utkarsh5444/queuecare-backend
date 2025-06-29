// Navigation Handling
function showDashboard() {
    document.getElementById('mainDashboard').style.display = 'flex';
    document.getElementById('healthHistorySection').style.display = 'none';
}

function showHealthHistory() {
    document.getElementById('mainDashboard').style.display = 'none';
    document.getElementById('healthHistorySection').style.display = 'block';
}

// Modal Handling
function toggleModal(modalId, memberId = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (modal.style.display === 'none' || !modal.style.display) {
        modal.style.display = 'flex';

        if (modalId === 'editMemberModal' && memberId) {
            // Populate modal with member data if needed
            console.log(`Edit member: ${memberId}`);
        }
    } else {
        modal.style.display = 'none';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Member Management
document.getElementById('addMemberForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('memberName').value.trim();
    const relation = document.getElementById('memberRelation').value.trim();
    const bloodGroup = document.getElementById('memberBloodGroup').value.trim();
    const tags = document.getElementById('memberTags').value.trim().split(',');

    if (name && relation && bloodGroup) {
        const newId = `member${Date.now()}`;
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        memberCard.dataset.id = newId;

        memberCard.innerHTML = `
            <div class="member-avatar member-avatar-placeholder"><span>${name[0]}</span></div>
            <div class="member-info">
                <div class="member-name">${name}</div>
                <div class="member-relation">${relation}</div>
                <div class="member-tags">${tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}</div>
                <div class="member-actions">
                    <button class="icon-button" onclick="toggleModal('editMemberModal', '${newId}')">✏️</button>
                    <button class="delete-btn" onclick="deleteMember('${newId}')">Delete</button>
                </div>
            </div>
        `;

        document.getElementById('familyMembersList').appendChild(memberCard);
        closeModal('addMemberModal');
        this.reset();
    }
});

function deleteMember(memberId) {
    const member = document.querySelector(`.member-card[data-id="${memberId}"]`);
    if (member) member.remove();
}

// Queue Filter
function showAllQueues() {
    document.querySelectorAll('.queue-card').forEach(card => card.style.display = 'block');
}

function filterQueues(status) {
    document.querySelectorAll('.queue-card').forEach(card => {
        card.style.display = card.dataset.status === status ? 'block' : 'none';
    });
}

// Health History Filter (simulation)
function showAllHistory() {
    document.querySelectorAll('.history-table tbody tr').forEach(row => {
        row.style.display = 'table-row';
    });
}

function filterHistory(memberKey) {
    document.querySelectorAll('.history-table tbody tr').forEach(row => {
        row.style.display = row.classList.contains(memberKey) ? 'table-row' : 'none';
    });
}

// Close modals on click outside
window.addEventListener('click', function (e) {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    function showMemberAppointments(memberId) {
        // Show all sections
        showDashboard();
    
        // Highlight selected member (optional UI enhancement)
        document.querySelectorAll('.member-card').forEach(card => {
            card.classList.remove('selected-member');
            if (card.dataset.id === memberId) {
                card.classList.add('selected-member');
            }
        });
    
        // Filter queue cards
        document.querySelectorAll('.queue-card').forEach(card => {
            if (card.dataset.member === memberId) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    
        // Optional: Reset filter buttons
        // document.querySelector('.filter-btn.active')?.classList.remove('active');
    }
    
    function showAllQueues() {
        document.querySelectorAll('.queue-card').forEach(card => card.style.display = 'block');
    
        // Remove selected member highlight
        document.querySelectorAll('.member-card').forEach(card => {
            card.classList.remove('selected-member');
        });
    }
    
});
