
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

let lastFocusedElement = null;
let previousBodyOverflow = "";

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

        if (
            url.protocol === "https:" ||
            url.protocol === "http:"
        ) {
            return escapeHTML(url.href);
        }

    } catch (error) {
        return "";
    }

    return "";
}

function normalizeStatus(value = "") {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
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

                    title:
                        data.title ||
                        data.name ||
                        "Untitled Project",

                    status: data.status || "Ideas",

                    summary:
                        data.summary ||
                        data.description ||
                        "",

                    details:
                        data.details ||
                        data.description ||
                        data.summary ||
                        "",

                    // Supports both the old image field
                    // and the new Cloudinary imageUrl field.
                    image:
                        data.imageUrl ||
                        data.image ||
                        "",

                    link: data.link || "",

                    date: data.date || "",

                    tags: Array.isArray(data.tags)
                        ? data.tags
                        : []
                };
            });

            applyFilters();
        },

        (error) => {

            console.error(
                "Firebase project loading error:",
                error
            );

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

        const statusSlug = normalizeStatus(project.status);

        const matchesFilter =
            activeFilter === "all" ||
            statusSlug === normalizeStatus(activeFilter);

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

    if (!grid) return;

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

        const statusSlug = normalizeStatus(project.status);

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

                <span class="status-badge ${statusSlug}">
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

        const detailsButton = card.querySelector(".details-btn");

        detailsButton.addEventListener("click", () => {
            openModal(project, detailsButton);
        });

        grid.appendChild(card);
    });
}


/* =========================
   PROJECT DETAILS MODAL
========================= */

function openModal(project, triggerButton) {

    if (!modal) return;

    const modalImage = document.getElementById("modal-img");
    const badge = document.getElementById("modal-status");
    const modalTitle = document.getElementById("modal-title");
    const modalDate = document.getElementById("modal-date");
    const modalDescription = document.getElementById("modal-desc");
    const modalTags = document.getElementById("modal-tags");
    const modalLink = document.getElementById("modal-link");

    if (
        !modalImage ||
        !badge ||
        !modalTitle ||
        !modalDate ||
        !modalDescription ||
        !modalTags ||
        !modalLink
    ) {
        console.error("One or more project modal elements are missing.");
        return;
    }

    lastFocusedElement = triggerButton || document.activeElement;
    previousBodyOverflow = document.body.style.overflow;

    const statusSlug = normalizeStatus(project.status);
    const imageURL = safeURL(project.image);
    const projectLink = safeURL(project.link);

    // Project image
    modalImage.src = imageURL || "";
    modalImage.alt = project.title;
    modalImage.style.display = imageURL ? "block" : "none";

    // Status
    badge.textContent = project.status;
    badge.className = `status-badge ${statusSlug}`;

    // Project information
    modalTitle.textContent = project.title;

    modalDate.textContent =
        project.date ? `Timeline: ${project.date}` : "";

    modalDescription.textContent =
        project.details || project.summary;

    // Project tags
    modalTags.innerHTML = project.tags
        .map(tag => `<span class="tag">${escapeHTML(tag)}</span>`)
        .join("");

    // External project link
    if (projectLink) {

        modalLink.href = projectLink;
        modalLink.style.display = "inline-flex";

    } else {

        modalLink.style.display = "none";
        modalLink.removeAttribute("href");
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    if (modalClose) {
        modalClose.focus();
    }
}


function closeModal() {

    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = previousBodyOverflow;

    if (
        lastFocusedElement &&
        document.contains(lastFocusedElement)
    ) {
        lastFocusedElement.focus();
    }

    lastFocusedElement = null;
}


/* =========================
   STATUS MESSAGE
========================= */

function showStatus(message) {

    if (!statusMsg) return;

    statusMsg.textContent = message;
    statusMsg.style.display = "block";
}


function hideStatus() {

    if (!statusMsg) return;

    statusMsg.style.display = "none";
}


/* =========================
   EVENT LISTENERS
========================= */

// Project filters
filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(item => {
            item.classList.remove("active");
            item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");

        activeFilter = button.dataset.filter || "all";

        applyFilters();
    });
});


// Project search
if (searchInput) {

    searchInput.addEventListener("input", event => {

        searchQuery = event.target.value.trim();

        applyFilters();
    });
}


// Close button
if (modalClose) {
    modalClose.addEventListener("click", closeModal);
}


// Close when clicking outside modal content
if (modal) {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeModal();
        }
    });
}


// Close with Escape key
document.addEventListener("keydown", event => {

    if (
        event.key === "Escape" &&
        modal?.classList.contains("open")
    ) {
        closeModal();
    }
});


/* =========================
   START
========================= */

initProjects();
