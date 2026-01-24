firebase.firestore()
.collection("supportChats")
.where("status", "==", "waiting")
.onSnapshot(snapshot => {
    const box = document.getElementById("adminChats");
    box.innerHTML = "";

    snapshot.forEach(doc => {
        box.innerHTML += `
            <div>
                New Chat: ${doc.id}
                <button onclick="acceptChat('${doc.id}')">Accept</button>
            </div>
        `;
    });
});

async function acceptChat(chatId) {
    await firebase.firestore()
      .collection("supportChats")
      .doc(chatId)
      .update({ status: "live" });

    alert("Chat connected!");
}