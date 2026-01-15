/* Turbo Plinko - Unified Admin Engine */
const ADMIN_SECRET_KEY = "Admin@2026"; // Ensure this matches your admin.html key
const db = firebase.firestore();

/**
 * Verifies admin access and initializes the dashboard
 */
function checkAdmin() {
    const enteredKey = document.getElementById('adminKeyInput').value;
    const dashboard = document.getElementById('dashboard');
    const authArea = document.getElementById('adminLogin');

    if (enteredKey === ADMIN_SECRET_KEY) {
        authArea.style.display = 'none';
        dashboard.style.display = 'block';
        loadAllUsers();
    } else {
        alert("Invalid Admin Key! Access Denied.");
    }
}

/**
 * Fetches all users from Firestore and populates the table
 */
async function loadAllUsers() {
    const tbody = document.getElementById('userListBody');
    tbody.innerHTML = "<tr><td colspan='4'>Loading users...</td></tr>";

    try {
        const snapshot = await db.collection("users").get();
        tbody.innerHTML = "";
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Displays '🏆 Won' if they hit the jackpot logic, otherwise '❌ No'
            const jackpotStatus = data.hasWonJackpot ? "<span style='color:#ffcc00'>🏆 Won</span>" : "❌ No";
            
            tbody.innerHTML += `
                <tr>
                    <td>${data.fullName || 'Unknown'}</td>
                    <td>$${(data.balance || 0).toFixed(2)}</td>
                    <td>${jackpotStatus}</td>
                    <td>
                        <button class="pill-btn-sm" onclick="viewProfile('${doc.id}')">Profile</button>
                        <button class="pill-btn-sm" onclick="editFunds('${doc.id}')">Funds</button>
                        <button class="pill-btn-sm" onclick="resetJackpot('${doc.id}')">Reset JP</button>
                        <button class="pill-btn-sm" onclick="deleteUser('${doc.id}')" style="background:red">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error loading users:", error);
        tbody.innerHTML = "<tr><td colspan='4' style='color:red'>Error loading database.</td></tr>";
    }
}

/**
 * Adds or subtracts funds from a specific user
 */
async function editFunds(userId) {
    const amount = prompt("Enter amount to add (use minus for subtraction, e.g., 500 or -200):");
    if (amount && !isNaN(amount)) {
        try {
            await db.collection('users').doc(userId).update({
                balance: firebase.firestore.FieldValue.increment(parseFloat(amount))
            });
            alert("Funds updated successfully!");
            loadAllUsers();
        } catch (error) {
            alert("Error updating funds.");
        }
    }
}

/**
 * Resets the jackpot status so a user can win the $10,000 again
 */
async function resetJackpot(userId) {
    if(confirm("Allow this user to win the jackpot again?")) {
        await db.collection('users').doc(userId).update({
            hasWonJackpot: false
        });
        alert("Jackpot status reset!");
        loadAllUsers();
    }
}

/**
 * Deletes a user permanently
 */
async function deleteUser(userId) {
    if(confirm("PERMANENTLY DELETE this user? This cannot be undone.")) {
        await db.collection('users').doc(userId).delete();
        alert("User removed.");
        loadAllUsers();
    }
}

/**
 * Displays full user details in a modal
 */
async function viewProfile(id) {
    const doc = await db.collection("users").doc(id).get();
    const u = doc.data();
    const modal = document.getElementById('profileModal');
    document.getElementById('profileContent').innerHTML = `
        <h2 style="color:var(--neon-orange)">User Profile</h2>
        <hr border="1" color="#333">
        <p><b>Name:</b> ${u.fullName}</p>
        <p><b>Email:</b> ${u.email}</p>
        <p><b>Phone:</b> ${u.phone || 'N/A'}</p>
        <p><b>Address:</b> ${u.address || 'N/A'}</p>
        <p><b>Balance:</b> $${(u.balance || 0).toFixed(2)}</p>
        <button onclick="document.getElementById('profileModal').style.display='none'" class="pill-btn-sm">Close</button>
    `;
    modal.style.display = 'flex';
}
