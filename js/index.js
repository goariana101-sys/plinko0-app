/* Page Title: Landing Page Logic & URL Parameter Capture */

window.addEventListener('DOMContentLoaded', () => {
    // Check if user arrived via a Referral Link
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
        console.log("Referral Code Detected:", refCode);
        const refInput = document.getElementById('regRef');
        if (refInput) {
            refInput.value = refCode;
            // Add a glow to show the bonus is active
            refInput.style.border = "2px solid #00ff88";
            refInput.style.boxShadow = "0 0 10px #00ff88";
        }
    }
});

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target.className === 'modal-overlay') {
        event.target.style.display = 'none';
    }
}
