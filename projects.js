// =========================================================================
// ADMIN WEBSITE CONNECTION CONFIG
// When we build your Admin Website in the next step, we will paste your
// shared cloud JSON URL here so both websites stay synced automatically.
// =========================================================================
const PORTFOLIO_API_URL = ""; 

// Default starter data (matches the exact schema your Admin Website will output)
const DEFAULT_PROJECTS = [
    {
        id: "proj-1",
        title: "Autonomous Quadcopter Frame",
        status: "Complete",
        date: "2026-09",
        summary: "Lightweight carbon-fiber drone chassis designed in SolidWorks and validated with FEA load simulations.",
        details: "Designed a 250mm wheelbase quadcopter frame optimized for high thrust-to-weight ratio. Conducted Finite Element Analysis (FEA) in SolidWorks to eliminate vibrational resonance at motor mounts and integrated a custom flight controller stack.",
        image: "https://unsplash.com",
        link: "https://github.com",
        tags: ["SolidWorks", "FEA", "Drones", "C++"]
    },
    {
        id: "proj-2",
        title: "6-DOF Robotic Manipulator",
        status: "In-Progress",
        date: "2026-11",
        summary: "3D-printed articulated robotic arm driven by inverse kinematics on an ESP32 microcontroller.",
        details: "Currently assembling planetary gearboxes for shoulder and elbow joints using PETG and carbon-nylon filaments. Writing real-time inverse kinematics solver in C++ to control end-effector trajectory via serial interface.",
        image: "https://unsplash.com",
        link: "https://github.com",
        tags: ["CAD", "ESP32", "Robotics", "3D Printing"]
    },
    {
        id: "proj-3",
        title: "Desktop Subsonic Wind Tunnel",
        status: "Ideas",
        date: "2026-12",
        summary: "Benchtop airflow test chamber with dual load cells to measure airfoil lift and drag coefficients.",
        details: "Conceptualizing a closed-return acrylic test section paired with a honeycomb flow straightener and Arduino-based pitot tube differential pressure sensors.",
        image: "https://unsplash.com",
        link: "https://github.com",
        tags: ["Aerodynamics", "MATLAB", "Sensors"]
    }
];

let allProjects = [];
let activeFilter = "all";
let searchQuery = "";

const grid = document.getElementById("projects-grid");
const statusMsg = document.getElementById("status-message");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("project-search");

// Modal elements
const modal = document.getElementById("project-modal");
const modalClose = document.getElementById("modal-close");

async function initProjects() {
    // 1. If connected to your Admin Website's cloud JSON API, fetch live data
    if (PORTFOLIO_API_URL) {
        showStatus("Syncing projects...");
        try {
            const response = await fetch(PORTFOLIO_API_URL);
            if (!response.ok) throw new Error("Network response failed");
            const data = await response.json();
            
            // Supports either an array of projects or { projects: [...] }
            allProjects = Array.isArray(data) ? data : (data.projects || []);
            hideStatus();
            applyFilters();
            return;
        } catch (err) {
            console.error("Failed to fetch remote projects:", err);
            showStatus("Offline mode: showing cached projects.");
        }
    }

    // 2. Local fallback (also checks localStorage if you test locally)
    const localSaved = localStorage.getItem("am_portfolio_projects");
    allProjects = localSaved ? JSON.parse(localSaved) : DEFAULT_PROJECTS;
    applyFilters();
}

function applyFilters() {
    const filtered = allProjects.filter(project => {
        const statusSlug = project.status.toLowerCase().replace(/\s+/g, "-");
        const matchesFilter = activeFilter === "all" || statusSlug === activeFilter;

        const searchableText = [
            project.title,
            project.summary,
            ...(project.tags || [])
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    renderGrid(filtered);
}

function renderGrid(projects) {
    grid.innerHTML = "";

    if (projects.length === 0) {
        showStatus("No projects match your current filter.");
        return;
    }

    hideStatus();

    projects.forEach(project => {
        const statusSlug = project.status.toLowerCase().replace(/\s+/g, "-");
        const tagsHTML = (project.tags || [])
            .map(tag => `<span class="tag">${tag}</span>`)
            .join("");

        const card = document.createElement("article");
        card.className = "project-card";
        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <span class="status-badge ${statusSlug}">${project.status}</span>
            </div>
            <div class="card-body">
                ${project.date ? `<span class="card-date">${project.date}</span>` : ""}
                <h2 class="card-title">${project.title}</h2>
                <p class="card-desc">${project.summary}</p>
                <div class="card-tags">${tagsHTML}</div>
                <div class="card-actions">
                    <button class="card-btn details-btn" data-id="${project.id}">View Details</button>
                    ${project.link && project.link !== "#" 
                        ? `<a href="${project.link}" target="_blank" rel="noopener noreferrer" class="card-btn">Source ↗</a>` 
                        : ""}
                </div>
            </div>
        `;

        card.querySelector(".details-btn").addEventListener("click", () => openModal(project));
        grid.appendChild(card);
    });
}

function openModal(project) {
    const statusSlug = project.status.toLowerCase().replace(/\s+/g, "-");
    document.getElementById("modal-img").src = project.image;
    document.getElementById("modal-img").alt = project.title;

    const badge = document.getElementById("modal-status");
    badge.textContent = project.status;
    badge.className = `status-badge ${statusSlug}`;

    document.getElementById("modal-title").textContent = project.title;
    document.getElementById("modal-date").textContent = project.date ? `Timeline: ${project.date}` : "";
    document.getElementById("modal-desc").textContent = project.details || project.summary;

    document.getElementById("modal-tags").innerHTML = (project.tags || [])
        .map(tag => `<span class="tag">${tag}</span>`)
        .join("");

    const modalLink = document.getElementById("modal-link");
    if (project.link && project.link !== "#") {
        modalLink.href = project.link;
        modalLink.style.display = "inline-flex";
    } else {
        modalLink.style.display = "none";
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

function showStatus(text) {
    statusMsg.textContent = text;
    statusMsg.style.display = "block";
}

function hideStatus() {
    statusMsg.style.display = "none";
}

// Event Listeners
filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        applyFilters();
    });
});

searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    applyFilters();
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

initProjects();
