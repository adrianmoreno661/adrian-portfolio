
import { db } from "./admin/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Get the homepage project cards
const projectCards = {
    "Ideas": document.querySelector(".pipeline-column:nth-child(1) .pipeline-card"),
    "In Progress": document.querySelector(".pipeline-column:nth-child(2) .pipeline-card"),
    "Complete": document.querySelector(".pipeline-column:nth-child(3) .pipeline-card")
};

// Listen for project updates from Firebase
onSnapshot(collection(db, "projects"), (snapshot) => {

    const projects = [];

    snapshot.forEach((doc) => {
        projects.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // Find the newest project in each category
    Object.entries(projectCards).forEach(([status, card]) => {

        const matchingProjects = projects.filter((project) =>
            (project.status || "").toLowerCase().replace("-", " ") === status.toLowerCase()
        );

        // Sort newest first
        matchingProjects.sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;

            return dateB - dateA;
        });

        const newestProject = matchingProjects[0];

        if (!newestProject) {
            return;
        }

        // Update card title and description
        const title = card.querySelector(".pipeline-card-back h3");
        const description = card.querySelector(".pipeline-card-back p");
        const image = card.querySelector(".pipeline-card-front img");

        title.textContent = newestProject.name || newestProject.title || "Untitled Project";
        description.textContent = newestProject.description || newestProject.summary || "No description available.";

        if (newestProject.image) {
            image.src = newestProject.image;
        }

        // Open the Projects page when clicked
        card.href = `projects.html`;
    });

});
