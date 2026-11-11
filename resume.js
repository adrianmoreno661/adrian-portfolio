
import { db } from "./admin/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =========================
// SKILLS
// =========================

const skillsContainer = document.getElementById("skills-container");

if (skillsContainer) {

    onSnapshot(
        collection(db, "skills"),

        (snapshot) => {

            skillsContainer.innerHTML = "";

            snapshot.forEach((doc) => {

                const skill = doc.data();

                const bubble = document.createElement("div");

                bubble.className = "skill-bubble";
                bubble.textContent = skill.name || "Unnamed Skill";

                skillsContainer.appendChild(bubble);
            });

        },

        (error) => {
            console.error("Error loading skills:", error);
        }
    );

}


// =========================
// TIMELINE
// =========================

const timelineTrack = document.getElementById("timeline-track");

if (timelineTrack) {

    onSnapshot(
        collection(db, "timeline"),

        (snapshot) => {

            // Reset timeline
            timelineTrack.classList.remove("is-animated");
            timelineTrack.innerHTML = "";

            const entries = [];

            snapshot.forEach((doc) => {
                entries.push(doc.data());
            });


            // =========================
            // CREATE TIMELINE CARD
            // =========================

            function createTimelineCard(entry) {

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

                return card;
            }


            // =========================
            // DISPLAY ORIGINAL ENTRIES
            // =========================

            entries.forEach((entry) => {

                timelineTrack.appendChild(
                    createTimelineCard(entry)
                );

            });


            // =========================
            // INFINITE SCROLL
            // =========================

            if (entries.length >= 4) {

                entries.forEach((entry) => {

                    const duplicate = createTimelineCard(entry);

                    duplicate.setAttribute("aria-hidden", "true");

                    timelineTrack.appendChild(duplicate);

                });

                // Start animation only after duplication
                timelineTrack.classList.add("is-animated");

            }

        },

        (error) => {

            console.error("Error loading timeline:", error);

        }
    );

}
