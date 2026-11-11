import { db } from "./admin/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// SKILLS
const skillsContainer = document.getElementById("skills-container");

onSnapshot(collection(db, "skills"), (snapshot) => {
    skillsContainer.innerHTML = "";

    snapshot.forEach((doc) => {
        const skill = doc.data();

        const bubble = document.createElement("div");
        bubble.className = "skill-bubble";
        bubble.textContent = skill.name || "Unnamed Skill";

        skillsContainer.appendChild(bubble);
    });
});