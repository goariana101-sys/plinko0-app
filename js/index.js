function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Close when clicking background
window.onclick = function(event) {
    if (event.target.className === 'modal-overlay') {
        event.target.style.display = 'none';
    }
}

// Placeholder functions for Auth
function handleLogin() { alert("Connecting to Robo-Server..."); }
function handleRegister() { alert("Registering for Arena..."); }
