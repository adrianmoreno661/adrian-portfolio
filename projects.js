
import { db } from "./admin/firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


/* =========================
   PROJECT DATA
========================= */

let allProjects = [];
let activeFilter = "all";
let searchQuery = "";

const grid = document.getElementById("projects-grid");
const statusMsg = document.getElementById("status-message");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("project-search");

const modal = document.getElementById("project-modal");
const modalClose = document.getElementById("modal-close");


/* =========================
   SECURITY HELPERS
========================= */

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function safeURL(value) {
    try {
        const url = new URL(value);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return escapeHTML(url.href);
        }
    } catch (error) {
        return "";
    }

    return "";
}


/* =========================
   LOAD PROJECTS FROM FIREBASE
========================= */

function initProjects() {
    showStatus("Loading projects...");

    onSnapshot(
        collection(db, "projects"),

        (snapshot) => {

            allProjects = snapshot.docs.map(document => {
                const data = document.data();

                return {
                    id: document.id,

                    title: data.title || data.name || "Untitled Project",

                    status: data.status || "Ideas",

                    summary: data.summary || data.description || "",

                    details: data.details || data.description || data.summary || "",

                    image: data.image || "",

                    link: data.link || "",

                    date: data.date || "",

                    tags: Array.isArray(data.tags) ? data.tags : []
                };
            });

            applyFilters();
        },

        (error) => {
            console.error("Firebase project loading error:", error);

            showStatus(
                "Could not load projects. Please check your Firebase connection and Firestore read permissions."
            );
        }
    );
}


/* =========================
   SEARCH AND FILTERS
========================= */

function applyFilters() {

    const filtered = allProjects.filter(project => {

        const statusSlug = project.status
            .toLowerCase()
            .replace(/\s+/g, "-");

        const matchesFilter =
            activeFilter === "all" ||
            statusSlug === activeFilter;

        const searchableText = [
            project.title,
            project.summary,
            project.details,
            ...project.tags
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    renderGrid(filtered);
}


/* =========================
   DISPLAY PROJECT CARDS
========================= */

function renderGrid(projects) {

    grid.innerHTML = "";

    if (projects.length === 0) {

        showStatus(
            allProjects.length === 0
                ? "No projects have been added yet."
                : "No projects match your current filter."
        );

        return;
    }

    hideStatus();

    projects.forEach(project => {

        const statusSlug = project.status
            .toLowerCase()
            .replace(/\s+/g, "-");

        const tagsHTML = project.tags
            .map(tag => `<span class="tag">${escapeHTML(tag)}</span>`)
            .join("");

        const imageURL = safeURL(project.image);
        const projectLink = safeURL(project.link);

        const card = document.createElement("article");

        card.className = "project-card";

        card.innerHTML = `
            <div class="card-image-wrapper">

                ${imageURL
                    ? `<img src="${imageURL}" alt="${escapeHTML(project.title)}" loading="lazy">`
                    : `<div class="card-image-placeholder"></div>`
                }

                <span class="status-badge ${escapeHTML(statusSlug)}">
                    ${escapeHTML(project.status)}
                </span>

            </div>

            <div class="card-body">

                ${project.date
                    ? `<span class="card-date">${escapeHTML(project.date)}</span>`
                    : ""
                }

                <h2 class="card-title">
                    ${escapeHTML(project.title)}
                </h2>

                <p class="card-desc">
                    ${escapeHTML(project.summary)}
                </p>

                <div class="card-tags">
                    ${tagsHTML}
                </div>

                <div class="card-actions">

                    <button class="card-btn details-btn" type="button">
                        View Details
                    </button>

                    ${projectLink
                        ? `<a href="${projectLink}" target="_blank" rel="noopener noreferrer" class="card-btn">Source ↗</a>`
                        : ""
                    }

                </div>

            </div>
        `;

        card.querySelector(".details-btn").addEventListener(
            "click",
            () => openModal(project)
        );

        grid.appendChild(card);
    });
}


/* =========================
   PROJECT DETAILS MODAL
========================= */

function openModal(project) {

    const statusSlug = project.status
        .toLowerCase()
        .replace(/\s+/g, "-");

    const modalImage = document.getElementById("modal-img");
    const imageURL = safeURL(project.image);

    modalImage.src = imageURL || "";
    modalImage.alt = project.title;
    modalImage.style.display = imageURL ? "block" : "none";

    const badge = document.getElementById("modal-status");

    badge.textContent = project.status;
    badge.className = `status-badge ${statusSlug}`;

    document.getElementById("modal-title").textContent =
        project.title;

    document.getElementById("modal-date").textContent =
        project.date ? `Timeline: ${project.date}` : "";

    document.getElementById("modal-desc").textContent =
        project.details || project.summary;

    document.getElementById("modal-tags").innerHTML =
        project.tags
            .map(tag => `<span class="tag">${escapeHTML(tag)}</span>`)
            .join("");

    const modalLink = document.getElementById("modal-link");
    const projectLink = safeURL(project.link);

    if (projectLink) {
        modalLink.href = projectLink;
        modalLink.style.display = "inline-flex";
    } else {
        modalLink.style.display = "none";
        modalLink.removeAttribute("href");
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}


function closeModal() {

    modal.classList.remove("open");

    modal.setAttribute("aria-hidden", "true");
}


/* =========================
   STATUS MESSAGE
========================= */

function showStatus(message) {

    statusMsg.textContent = message;
    statusMsg.style.display = "block";
}


function hideStatus() {

    statusMsg.style.display = "none";
}


/* =========================
   EVENT LISTENERS
========================= */

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");

        activeFilter = button.dataset.filter;

        applyFilters();
    });
});


searchInput.addEventListener("input", event => {

    searchQuery = event.target.value.trim();

    applyFilters();
});


modalClose.addEventListener("click", closeModal);


modal.addEventListener("click", event => {

    if (event.target === modal) {
        closeModal();
    }
});


document.addEventListener("keydown", event => {

    if (
        event.key === "Escape" &&
        modal.classList.contains("open")
    ) {
        closeModal();
    }
});


/* =========================
   START
========================= */

initProjects();
