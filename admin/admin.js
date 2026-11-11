
import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


/* =========================
   LOGIN
========================= */

const loginScreen = document.getElementById("login-screen");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";

    try {
        await signInWithEmailAndPassword(
            auth,
            loginEmail.value.trim(),
            loginPassword.value
        );
    } catch (error) {
        loginError.textContent = "Login failed. Check your email and password.";
        console.error(error);
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign-out error:", error);
        alert("Could not sign out. Please try again.");
    }
});


/* =========================
   FIRESTORE DATA
========================= */

let projects = [];
let skills = [];
let timeline = [];

let editingProjectId = null;
let editingSkillId = null;
let editingTimelineId = null;

const projectName = document.getElementById("project-name");
const projectStatus = document.getElementById("project-status");
const projectDescription = document.getElementById("project-description");
const addProjectButton = document.getElementById("add-project");
const projectList = document.getElementById("project-list");

const skillName = document.getElementById("skill-name");
const addSkillButton = document.getElementById("add-skill");
const skillList = document.getElementById("skill-list");

const timelineCategory = document.getElementById("timeline-category");
const timelineName = document.getElementById("timeline-name");
const timelineRole = document.getElementById("timeline-role");
const timelineLocation = document.getElementById("timeline-location");
const addTimelineButton = document.getElementById("add-timeline");
const timelineList = document.getElementById("timeline-list");


/* =========================
   LOAD DATA
========================= */

async function loadCollection(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName));

    return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
    }));
}

async function loadAllData() {
    projects = await loadCollection("projects");
    skills = await loadCollection("skills");
    timeline = await loadCollection("timeline");

    displayProjects();
    displaySkills();
    displayTimeline();
}


/* =========================
   OLD DATA MIGRATION
========================= */

async function migrateOldData() {
    const migrations = [
        {
            collectionName: "projects",
            storageKey: "portfolioProjects"
        },
        {
            collectionName: "skills",
            storageKey: "portfolioSkills"
        },
        {
            collectionName: "timeline",
            storageKey: "portfolioTimeline"
        }
    ];

    for (const migration of migrations) {
        const oldData = localStorage.getItem(migration.storageKey);

        if (!oldData) continue;

        const existing = await getDocs(
            collection(db, migration.collectionName)
        );

        if (!existing.empty) continue;

        const entries = JSON.parse(oldData);

        if (!Array.isArray(entries) || entries.length === 0) {
            continue;
        }

        for (const entry of entries) {
            await addDoc(
                collection(db, migration.collectionName),
                migration.collectionName === "skills"
                    ? { name: entry }
                    : entry
            );
        }

        console.log(`Migrated ${migration.collectionName}.`);
    }
}


/* =========================
   PROJECT MANAGEMENT
========================= */

function displayProjects() {
    projectList.innerHTML = "";

    if (projects.length === 0) {
        projectList.innerHTML =
            '<p class="empty-message">No projects added yet.</p>';
        return;
    }

    projects.forEach((project) => {
        const card = document.createElement("div");
        card.className = "project-entry";

        const name = document.createElement("h4");
        name.textContent = project.name;

        const status = document.createElement("p");
        status.textContent = "Status: " + project.status;

        const description = document.createElement("p");
        description.textContent = project.description;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            projectName.value = project.name;
            projectStatus.value = project.status;
            projectDescription.value = project.description;

            editingProjectId = project.id;
            addProjectButton.textContent = "Save Changes";
            projectName.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Delete this project?")) return;

            try {
                await deleteDoc(doc(db, "projects", project.id));

                if (editingProjectId === project.id) {
                    cancelProjectEditing();
                }

                await loadAllData();
            } catch (error) {
                console.error(error);
                alert("Could not delete the project.");
            }
        });

        card.append(
            name,
            status,
            description,
            editButton,
            deleteButton
        );

        projectList.appendChild(card);
    });
}

function cancelProjectEditing() {
    editingProjectId = null;
    projectName.value = "";
    projectDescription.value = "";
    projectStatus.value = "Ideas";
    addProjectButton.textContent = "Add Project";
}

addProjectButton.addEventListener("click", async () => {
    const name = projectName.value.trim();
    const status = projectStatus.value;
    const description = projectDescription.value.trim();

    if (!name || !description) {
        alert("Please enter a project name and description.");
        return;
    }

    const project = { name, status, description };

    try {
        if (editingProjectId) {
            // Editing preserves the original creation timestamp.
            await updateDoc(
                doc(db, "projects", editingProjectId),
                project
            );
        } else {
            // New projects receive a Firebase creation timestamp.
            await addDoc(collection(db, "projects"), {
                ...project,
                createdAt: serverTimestamp()
            });
        }

        cancelProjectEditing();
        await loadAllData();
    } catch (error) {
        console.error(error);
        alert("Could not save the project.");
    }
});


/* =========================
   SKILL MANAGEMENT
========================= */

function displaySkills() {
    skillList.innerHTML = "";

    if (skills.length === 0) {
        skillList.innerHTML =
            '<p class="empty-message">No skills added yet.</p>';
        return;
    }

    skills.forEach((skill) => {
        const entry = document.createElement("div");
        entry.className = "project-entry";

        const name = document.createElement("h4");
        name.textContent = skill.name;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            skillName.value = skill.name;
            editingSkillId = skill.id;
            addSkillButton.textContent = "Save Changes";
            skillName.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Delete this skill?")) return;

            try {
                await deleteDoc(doc(db, "skills", skill.id));

                if (editingSkillId === skill.id) {
                    cancelSkillEditing();
                }

                await loadAllData();
            } catch (error) {
                console.error(error);
                alert("Could not delete the skill.");
            }
        });

        entry.append(name, editButton, deleteButton);
        skillList.appendChild(entry);
    });
}

function cancelSkillEditing() {
    editingSkillId = null;
    skillName.value = "";
    addSkillButton.textContent = "Add Skill";
}

addSkillButton.addEventListener("click", async () => {
    const name = skillName.value.trim();

    if (!name) {
        alert("Please enter a skill name.");
        return;
    }

    try {
        if (editingSkillId) {
            await updateDoc(
                doc(db, "skills", editingSkillId),
                { name }
            );
        } else {
            await addDoc(collection(db, "skills"), { name });
        }

        cancelSkillEditing();
        await loadAllData();
    } catch (error) {
        console.error(error);
        alert("Could not save the skill.");
    }
});


/* =========================
   TIMELINE MANAGEMENT
========================= */

function displayTimeline() {
    timelineList.innerHTML = "";

    if (timeline.length === 0) {
        timelineList.innerHTML =
            '<p class="empty-message">No timeline entries added yet.</p>';
        return;
    }

    timeline.forEach((entry) => {
        const card = document.createElement("div");
        card.className = "project-entry";

        const category = document.createElement("p");
        category.textContent = "Category: " + entry.category;

        const name = document.createElement("h4");
        name.textContent = entry.name;

        const role = document.createElement("p");
        role.textContent = entry.role;

        const location = document.createElement("p");
        location.textContent = "Location: " + entry.location;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            timelineCategory.value = entry.category;
            timelineName.value = entry.name;
            timelineRole.value = entry.role;
            timelineLocation.value = entry.location;

            editingTimelineId = entry.id;
            addTimelineButton.textContent = "Save Changes";
            timelineName.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Delete this timeline entry?")) return;

            try {
                await deleteDoc(doc(db, "timeline", entry.id));

                if (editingTimelineId === entry.id) {
                    cancelTimelineEditing();
                }

                await loadAllData();
            } catch (error) {
                console.error(error);
                alert("Could not delete the timeline entry.");
            }
        });

        card.append(
            category,
            name,
            role,
            location,
            editButton,
            deleteButton
        );

        timelineList.appendChild(card);
    });
}

function cancelTimelineEditing() {
    editingTimelineId = null;

    timelineCategory.value = "School";
    timelineName.value = "";
    timelineRole.value = "";
    timelineLocation.value = "";

    addTimelineButton.textContent = "Add Timeline Entry";
}

addTimelineButton.addEventListener("click", async () => {
    const category = timelineCategory.value;
    const name = timelineName.value.trim();
    const role = timelineRole.value.trim();
    const location = timelineLocation.value.trim();

    if (!name || !role || !location) {
        alert("Please complete all timeline fields.");
        return;
    }

    const entry = { category, name, role, location };

    try {
        if (editingTimelineId) {
            await updateDoc(
                doc(db, "timeline", editingTimelineId),
                entry
            );
        } else {
            await addDoc(collection(db, "timeline"), entry);
        }

        cancelTimelineEditing();
        await loadAllData();
    } catch (error) {
        console.error(error);
        alert("Could not save the timeline entry.");
    }
});


/* =========================
   AUTHENTICATION STATE
========================= */

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginScreen.hidden = true;
        adminApp.hidden = false;

        try {
            await migrateOldData();
            await loadAllData();
        } catch (error) {
            console.error("Firebase loading error:", error);
            alert("Could not load your portfolio data. Check your Firebase rules and connection.");
        }
    } else {
        adminApp.hidden = true;
        loginScreen.hidden = false;
        loginForm.reset();
        loginError.textContent = "";
    }
});
