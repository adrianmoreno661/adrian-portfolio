
import { db } from "./admin/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =========================
// HOMEPAGE PROJECT CARDS
// =========================

const projectCards = {
    "Ideas": document.querySelector(".pipeline-column:nth-child(1) .pipeline-card"),
    "In Progress": document.querySelector(".pipeline-column:nth-child(2) .pipeline-card"),
    "Complete": document.querySelector(".pipeline-column:nth-child(3) .pipeline-card")
};

// =========================
// FIREBASE PROJECT UPDATES
// =========================

onSnapshot(
    collection(db, "projects"),

    (snapshot) => {

        const projects = [];

        snapshot.forEach((doc) => {
            projects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Find the newest project in each category
        Object.entries(projectCards).forEach(([status, card]) => {

            if (!card) return;

            const title = card.querySelector(".pipeline-card-back h3");
            const description = card.querySelector(".pipeline-card-back p");
            const image = card.querySelector(".pipeline-card-front img");

            if (!title || !description || !image) return;

            // Normalize project status
            const matchingProjects = projects.filter((project) => {

                const projectStatus = (project.status || "")
                    .toLowerCase()
                    .replace(/[-_]/g, " ")
                    .trim();

                return projectStatus === status.toLowerCase();
            });

            // Sort newest first
            matchingProjects.sort((a, b) => {

                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;

                return dateB - dateA;
            });

            const newestProject = matchingProjects[0];

            // No project found
            if (!newestProject) {
                title.textContent = "No Projects Yet";
                description.textContent = "Check back later for updates.";
                card.removeAttribute("href");
                return;
            }

            // Update project information
            title.textContent =
                newestProject.name ||
                newestProject.title ||
                "Untitled Project";

            description.textContent =
                newestProject.description ||
                newestProject.summary ||
                "No description available.";

            // Update project image
            const projectImage =
                newestProject.imageUrl ||
                newestProject.image ||
                "";

            if (projectImage) {
                image.src = projectImage;
            }

            // Open Projects page
            card.href = "projects.html";

        });

    },

    (error) => {
        console.error("Error loading homepage projects:", error);
    }
);

// =========================
// AM RADIO TOGGLE
// =========================

const radioToggle = document.querySelector(".team-radio-toggle");
const radioContent = document.querySelector(".team-radio-content");

if (radioToggle && radioContent) {

    radioToggle.addEventListener("click", () => {

        const isExpanded =
            radioToggle.getAttribute("aria-expanded") === "true";

        // Update expanded state
        radioToggle.setAttribute(
            "aria-expanded",
            String(!isExpanded)
        );

        // Open or close Spotify player
        radioContent.classList.toggle("is-open", !isExpanded);

    });

}
