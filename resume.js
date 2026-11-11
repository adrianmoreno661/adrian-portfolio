
import { db } from "./admin/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =========================
// SKILLS
// =========================

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

// =========================
// TIMELINE
// =========================

const timelineTrack = document.getElementById("timeline-track");

onSnapshot(collection(db, "timeline"), (snapshot) => {
    timelineTrack.innerHTML = "";

    const entries = [];

    snapshot.forEach((doc) => {
        entries.push(doc.data());
    });

    // Create two copies for the infinite scrolling effect
    for (let copy = 0; copy < 2; copy++) {
        entries.forEach((entry) => {
            const card = document.createElement("div");
            card.className = "timeline-card";

            const tag = document.createElement("span");
            tag.className = "card-tag";
            tag.textContent = entry.category || "Experience";

            const title = document.createElement("h3");
            title.textContent = entry.name || "Untitled";

            const role = document.createElement("p");
            role.className = "card-role";
            role.textContent = entry.role || "";

            const location = document.createElement("div");
            location.className = "card-location";
            location.textContent = entry.location || "";

            card.append(tag, title, role, location);
            timelineTrack.appendChild(card);
        });
    }
});
