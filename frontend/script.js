const API_URL = "https://placementmate.onrender.com/api";
let companies = [];
let tasks = [];

let selectedStatus = "Upcoming";
let selectedCategory = "DSA";
let selectedPriority = "Medium";

let currentFilter = "All";
let searchText = "";

let calendarDate = new Date();
let statusCompanyId = null;


// ==========================================
// API
// ==========================================

async function apiRequest(url, options = {}) {

    const response = await fetch(API_URL + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.error || "Request failed"
        );
    }

    return data;
}


// ==========================================
// DATE
// ==========================================

function normalizeDate(value) {

    if (!value) return "";

    if (value instanceof Date) {

        return (
            value.getFullYear() +
            "-" +
            String(value.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(value.getDate()).padStart(2, "0")
        );

    }

    const text = String(value);

    if (text.includes("T")) {
        return text.substring(0, 10);
    }

    return text.substring(0, 10);
}


function formatDate(value) {

    const date = normalizeDate(value);

    if (!date) return "No date";

    const parts = date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function getDaysLeft(value) {

    const date = normalizeDate(value);

    if (!date) return null;

    const parts = date.split("-");

    const target = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    target.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return Math.round(
        (target - today) /
        (1000 * 60 * 60 * 24)
    );
}


function countdown(value) {

    const days = getDaysLeft(value);

    if (days === null) return "📅 No date";

    if (days === 0) return "🔥 Today";

    if (days === 1) return "⏳ Tomorrow";

    if (days > 1) {
        return `⏳ ${days} days left`;
    }

    return "Date passed";
}


function createDateString(year, month, day) {

    return (
        year +
        "-" +
        String(month + 1).padStart(2, "0") +
        "-" +
        String(day).padStart(2, "0")
    );
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
}


// ==========================================
// NORMALIZE COMPANY
// ==========================================

function normalizeCompany(company) {

    return {
        id: String(company.id),
        name: company.name || "",
        date: normalizeDate(
            company.drive_date || company.date
        ),
        role: company.role || "",
        package: company.package || "",
        location: company.location || "",
        requirements: company.requirements || "",
        notes: company.notes || "",
        status: company.status || "Upcoming"
    };
}


// ==========================================
// NORMALIZE TASK
// ==========================================

function normalizeTask(task) {

    return {
        id: String(task.id),
        name: task.name || "",
        category: task.category || "Other",
        date: normalizeDate(
            task.due_date || task.date
        ),
        priority: task.priority || "Medium",
        notes: task.notes || "",
        completed: Boolean(task.completed)
    };
}


// ==========================================
// LOAD COMPANIES
// ==========================================

async function loadCompanies() {

    try {

        const data =
            await apiRequest("/companies");

        companies =
            Array.isArray(data)
                ? data.map(normalizeCompany)
                : [];

        console.log(
            "Companies:",
            companies
        );

    } catch (error) {

        console.error(
            "Companies loading error:",
            error
        );

        companies = [];

    }
}


// ==========================================
// LOAD TASKS
// ==========================================

async function loadTasks() {

    try {

        const data =
            await apiRequest("/tasks");

        tasks =
            Array.isArray(data)
                ? data.map(normalizeTask)
                : [];

    } catch (error) {

        console.error(
            "Tasks loading error:",
            error
        );

        tasks = [];

    }
}


// ==========================================
// LOAD NOTES
// ==========================================

async function loadNotes() {

    const notes =
        document.getElementById(
            "generalNotes"
        );

    if (!notes) return;

    try {

        const data =
            await apiRequest("/notes");

        notes.value =
            data?.content || "";

    } catch (error) {

        console.error(
            "Notes loading error:",
            error
        );

    }
}


// ==========================================
// DASHBOARD STATS
// ==========================================

function updateStats() {

    const total =
        companies.length;

    const upcoming =
        companies.filter(
            company =>
                company.status === "Upcoming"
        ).length;

    const attended =
        companies.filter(
            company =>
                company.status === "Attended"
        ).length;

    const selected =
        companies.filter(
            company =>
                company.status === "Selected"
        ).length;

    const rejected =
        companies.filter(
            company =>
                company.status === "Rejected"
        ).length;

    const notGoing =
        companies.filter(
            company =>
                company.status === "Not Going"
        ).length;


    document.getElementById(
        "totalCompanies"
    ).textContent = total;


    document.getElementById(
        "homeUpcoming"
    ).textContent = upcoming;


    document.getElementById(
        "homeAttended"
    ).textContent = attended;


    document.getElementById(
        "homeSelected"
    ).textContent = selected;


    document.getElementById(
        "homeRejected"
    ).textContent = rejected;


    document.getElementById(
        "homeNotGoing"
    ).textContent = notGoing;


   let successRate = 0;

if (total > 0) {
    successRate =
        Math.round(
            (selected / total) * 100
        );
}


    document.getElementById(
        "successRate"
    ).textContent =
        successRate + "%";
}


// ==========================================
// UPCOMING DRIVES
// ==========================================

function renderUpcoming() {

    const container =
        document.getElementById(
            "upcomingList"
        );

    if (!container) return;


    let list =
        companies.filter(
            company => {

                const days =
                    getDaysLeft(
                        company.date
                    );

                return (
                    company.status === "Upcoming" &&
                    days !== null &&
                    days >= 0
                );

            }
        );


    list.sort(
        (a, b) =>
            getDaysLeft(a.date) -
            getDaysLeft(b.date)
    );


    if (list.length === 0) {

        container.innerHTML = `
            <div class="empty">
                <div style="font-size:30px;">🎉</div>
                <p>No upcoming drives.</p>
                <small>Add a company to start tracking.</small>
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    list.forEach(company => {

        const card =
            document.createElement("div");

        card.className =
            "upcoming-card";


        card.innerHTML = `

            <h3>
                ${escapeHTML(company.name)}
            </h3>

            <p>
                💼 ${escapeHTML(company.role)}
            </p>

            <p>
                📅 ${formatDate(company.date)}
            </p>

            ${
                company.package
                    ? `<p>💰 ${escapeHTML(company.package)}</p>`
                    : ""
            }

            ${
                company.location
                    ? `<p>📍 ${escapeHTML(company.location)}</p>`
                    : ""
            }

            <span class="countdown">
                ${countdown(company.date)}
            </span>
        `;


        container.appendChild(card);

    });
}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageId, button) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );

        });


    const page =
        document.getElementById(pageId);


    if (page) {

        page.classList.add(
            "active-page"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(btn => {

            btn.classList.remove(
                "active-nav"
            );

        });


    if (button) {

        button.classList.add(
            "active-nav"
        );

    }


    if (
        pageId === "calendarPage"
    ) {

        renderCalendar();

    }

}


// ==========================================
// COMPANY MODAL
// ==========================================

function openCompanyModal(id = null) {

    const modal =
        document.getElementById(
            "companyModal"
        );

    if (!modal) return;


    modal.classList.add("show");


    const form =
        document.getElementById(
            "companyForm"
        );


    if (id === null) {

        document.getElementById(
            "companyModalTitle"
        ).textContent =
            "Add Company";


        form.reset();


        document.getElementById(
            "editingCompanyId"
        ).value = "";


        selectStatus("Upcoming");

        return;
    }


    const company =
        companies.find(
            c =>
                String(c.id) ===
                String(id)
        );


    if (!company) return;


    document.getElementById(
        "companyModalTitle"
    ).textContent =
        "Edit Company";


    document.getElementById(
        "editingCompanyId"
    ).value =
        company.id;


    document.getElementById(
        "companyName"
    ).value =
        company.name;


    document.getElementById(
        "companyDate"
    ).value =
        normalizeDate(
            company.date
        );


    document.getElementById(
        "companyRole"
    ).value =
        company.role;


    document.getElementById(
        "companyPackage"
    ).value =
        company.package;


    document.getElementById(
        "companyLocation"
    ).value =
        company.location;


    document.getElementById(
        "companyRequirements"
    ).value =
        company.requirements;


    document.getElementById(
        "companyNotes"
    ).value =
        company.notes;


    selectStatus(
        company.status
    );
}


function closeCompanyModal() {

    const modal =
        document.getElementById(
            "companyModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }
}


// ==========================================
// COMPANY STATUS
// ==========================================

function selectStatus(status) {

    selectedStatus =
        status;


    document.getElementById(
        "companyStatus"
    ).value =
        status;


    document
        .querySelectorAll(
            ".status-options button"
        )
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.status ===
                status
            );

        });
}


// ==========================================
// ADD / UPDATE COMPANY
// ==========================================

document
    .getElementById("companyForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const id =
                document.getElementById(
                    "editingCompanyId"
                ).value;


            const companyData = {

                name:
                    document.getElementById(
                        "companyName"
                    ).value.trim(),

                drive_date:
                    normalizeDate(
                        document.getElementById(
                            "companyDate"
                        ).value
                    ),

                role:
                    document.getElementById(
                        "companyRole"
                    ).value.trim(),

                package:
                    document.getElementById(
                        "companyPackage"
                    ).value.trim(),

                location:
                    document.getElementById(
                        "companyLocation"
                    ).value.trim(),

                requirements:
                    document.getElementById(
                        "companyRequirements"
                    ).value.trim(),

                notes:
                    document.getElementById(
                        "companyNotes"
                    ).value.trim(),

                status:
                    selectedStatus

            };


            try {

                let result;


                // UPDATE

                if (id) {

                    result =
                        await apiRequest(
                            `/companies/${id}`,
                            {
                                method: "PUT",
                                body:
                                    JSON.stringify(
                                        companyData
                                    )
                            }
                        );


                    const updated =
                        normalizeCompany(
                            result
                        );


                    const index =
                        companies.findIndex(
                            company =>
                                String(
                                    company.id
                                ) ===
                                String(id)
                        );


                    if (index !== -1) {

                        companies[index] =
                            updated;

                    }


                    alert(
                        "Company updated successfully!"
                    );

                }

                // ADD

                else {

                    result =
                        await apiRequest(
                            "/companies",
                            {
                                method: "POST",
                                body:
                                    JSON.stringify(
                                        companyData
                                    )
                            }
                        );


                    companies.push(
                        normalizeCompany(
                            result
                        )
                    );


                    alert(
                        "Company added successfully!"
                    );

                }


                closeCompanyModal();

                renderAll();

            } catch (error) {

                console.error(error);

                alert(
                    "Failed to save company:\n" +
                    error.message
                );

            }

        }
    );


// ==========================================
// SEARCH
// ==========================================

function searchCompanies() {

    const input =
        document.getElementById(
            "companySearch"
        );


    searchText =
        input
            ? input.value
            : "";


    renderCompanies();
}


function clearSearch() {

    const input =
        document.getElementById(
            "companySearch"
        );


    if (input) {
        input.value = "";
    }


    searchText = "";

    renderCompanies();
}


// ==========================================
// COMPANY LIST
// ==========================================

function renderCompanies() {

    const container =
        document.getElementById(
            "companyList"
        );

    if (!container) return;


    let list =
        [...companies];


    // FILTER

    if (
        currentFilter !== "All"
    ) {

        list =
            list.filter(
                company =>
                    company.status ===
                    currentFilter
            );

    }


    // SEARCH

    if (
        searchText.trim() !== ""
    ) {

        const search =
            searchText
                .trim()
                .toLowerCase();


        list =
            list.filter(
                company => {

                    return (

                        company.name
                            .toLowerCase()
                            .includes(search)

                        ||

                        company.role
                            .toLowerCase()
                            .includes(search)

                        ||

                        company.location
                            .toLowerCase()
                            .includes(search)

                    );

                }
            );

    }


    if (list.length === 0) {

        container.innerHTML = `
            <div class="empty">
                🔍 No companies found.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    list.forEach(company => {

        const card =
            document.createElement("div");


        card.className =
            "company-card";


        card.innerHTML = `

            <h3>
                ${escapeHTML(company.name)}
            </h3>

            <p>
                📅 ${formatDate(company.date)}
            </p>

            <p>
                💼 ${escapeHTML(company.role)}
            </p>

            ${
                company.package
                    ? `<p>💰 ${escapeHTML(company.package)}</p>`
                    : ""
            }

            ${
                company.location
                    ? `<p>📍 ${escapeHTML(company.location)}</p>`
                    : ""
            }

            ${
                company.requirements
                    ? `<p>🎯 ${escapeHTML(company.requirements)}</p>`
                    : ""
            }

            ${
                company.notes
                    ? `<p>📝 ${escapeHTML(company.notes)}</p>`
                    : ""
            }

            <span class="status-badge">
                ${escapeHTML(company.status)}
            </span>


            <div class="company-actions">

                <button
                    class="status-action"
                    onclick="changeCompanyStatus('${company.id}')"
                >
                    🔄 Status
                </button>

                <button
                    class="edit-action"
                    onclick="openCompanyModal('${company.id}')"
                >
                    ✏️ Edit
                </button>

                <button
                    class="delete-action"
                    onclick="deleteCompany('${company.id}')"
                >
                    🗑️ Delete
                </button>

            </div>

        `;


        container.appendChild(card);

    });
}


// ==========================================
// FILTER
// ==========================================

function filterCompanies(
    filter,
    button
) {

    currentFilter =
        filter;


    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(btn => {

            btn.classList.remove(
                "active-filter"
            );

        });


    if (button) {

        button.classList.add(
            "active-filter"
        );

    }


    renderCompanies();
}


// ==========================================
// STATUS MODAL
// ==========================================

function changeCompanyStatus(id) {

    const company =
        companies.find(
            c =>
                String(c.id) ===
                String(id)
        );


    if (!company) return;


    statusCompanyId =
        String(id);


    document.getElementById(
        "statusCompanyName"
    ).textContent =
        company.name;


    document.getElementById(
        "statusModal"
    ).classList.add(
        "show"
    );
}


function closeStatusModal() {

    document.getElementById(
        "statusModal"
    ).classList.remove(
        "show"
    );


    statusCompanyId = null;
}


async function setCompanyStatus(
    status
) {

    if (!statusCompanyId) return;


    const company =
        companies.find(
            c =>
                String(c.id) ===
                String(statusCompanyId)
        );


    if (!company) return;


    try {

        const result =
            await apiRequest(
                `/companies/${company.id}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify({

                            name:
                                company.name,

                            drive_date:
                                normalizeDate(
                                    company.date
                                ),

                            role:
                                company.role,

                            package:
                                company.package,

                            location:
                                company.location,

                            requirements:
                                company.requirements,

                            notes:
                                company.notes,

                            status:
                                status

                        })
                }
            );


        const updated =
            normalizeCompany(
                result
            );


        const index =
            companies.findIndex(
                c =>
                    String(c.id) ===
                    String(company.id)
            );


        if (index !== -1) {

            companies[index] =
                updated;

        }


        closeStatusModal();

        renderAll();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to update status:\n" +
            error.message
        );

    }
}


// ==========================================
// DELETE COMPANY
// ==========================================

async function deleteCompany(id) {

    const company =
        companies.find(
            c =>
                String(c.id) ===
                String(id)
        );


    if (!company) return;


    if (
        !confirm(
            `Delete ${company.name}?`
        )
    ) {
        return;
    }


    try {

        await apiRequest(
            `/companies/${id}`,
            {
                method: "DELETE"
            }
        );


        companies =
            companies.filter(
                company =>
                    String(company.id) !==
                    String(id)
            );


        renderAll();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to delete company:\n" +
            error.message
        );

    }
}


// ==========================================
// TASK MODAL
// ==========================================

function openTaskModal() {

    const modal =
        document.getElementById(
            "taskModal"
        );


    modal.classList.add("show");


    document
        .getElementById(
            "taskForm"
        )
        .reset();


    selectCategory("DSA");

    selectPriority("Medium");
}


function closeTaskModal() {

    document
        .getElementById(
            "taskModal"
        )
        .classList.remove(
            "show"
        );
}


// ==========================================
// CATEGORY
// ==========================================
function selectCategory(category) {
    selectedCategory = category;

    const input = document.getElementById("taskCategory");

    if (input) {
        input.value = category;
    }

    document.querySelectorAll("#taskModal .task-options button")
        .forEach(function(button) {
            button.classList.remove("selected");
        });

    document.querySelectorAll("#taskModal .task-options button")
        .forEach(function(button) {
            if (button.textContent
                .toLowerCase()
                .includes(category.toLowerCase())) {

                button.classList.add("selected");
            }
        });
}


function selectPriority(priority) {
    selectedPriority = priority;

    const input = document.getElementById("taskPriority");

    if (input) {
        input.value = priority;
    }

    document.querySelectorAll("#taskModal .task-options button")
        .forEach(function(button) {
            button.classList.remove("selected");
        });

    document.querySelectorAll("#taskModal .task-options button")
        .forEach(function(button) {
            if (button.textContent
                .toLowerCase()
                .includes(priority.toLowerCase())) {

                button.classList.add("selected");
            }
        });
}


// ==========================================
// ADD TASK
// ==========================================

document
    .getElementById("taskForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const taskData = {

                name:
                    document.getElementById(
                        "taskName"
                    ).value.trim(),

                category:
                    selectedCategory,

                due_date:
                    normalizeDate(
                        document.getElementById(
                            "taskDate"
                        ).value
                    ),

                priority:
                    selectedPriority,

                notes:
                    document.getElementById(
                        "taskNotes"
                    ).value.trim(),

                completed:
                    false

            };


            try {

                const result =
                    await apiRequest(
                        "/tasks",
                        {
                            method: "POST",

                            body:
                                JSON.stringify(
                                    taskData
                                )
                        }
                    );


                tasks.push(
                    normalizeTask(
                        result
                    )
                );


                closeTaskModal();

                renderAll();

            } catch (error) {

                console.error(error);

                alert(
                    "Failed to add task:\n" +
                    error.message
                );

            }

        }
    );


// ==========================================
// TASK LIST
// ==========================================

function renderTasks() {

    const container =
        document.getElementById(
            "taskList"
        );


    if (!container) return;


    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty">
                📚 No tasks yet.
            </div>
        `;

        updateProgress();

        return;
    }


    container.innerHTML = "";


    tasks.forEach(task => {

        container.innerHTML += `

            <div class="task-card">

                <div class="task-row">

                    <input
                        type="checkbox"
                        ${
                            task.completed
                                ? "checked"
                                : ""
                        }
                        onchange="
                            toggleTask('${task.id}')
                        "
                    >

                    <span
                        class="
                            task-name
                            ${
                                task.completed
                                    ? "completed"
                                    : ""
                            }
                        "
                    >
                        ${escapeHTML(task.name)}
                    </span>


                    <button
                        class="task-delete"
                        onclick="
                            deleteTask('${task.id}')
                        "
                    >
                        🗑️
                    </button>

                </div>


                <div class="task-info">

                    📂
                    ${escapeHTML(task.category)}

                    &nbsp; • &nbsp;

                    ⭐
                    ${escapeHTML(task.priority)}

                    ${
                        task.date
                            ? `
                                &nbsp; • &nbsp;
                                📅
                                ${formatDate(task.date)}
                            `
                            : ""
                    }

                </div>

            </div>

        `;

    });


    updateProgress();
}


// ==========================================
// HOME TASKS
// ==========================================

function renderHomeTasks() {

    const container =
        document.getElementById(
            "homeTasks"
        );


    if (!container) return;


    const pending =
        tasks
            .filter(
                task =>
                    !task.completed
            )
            .slice(0, 4);


    if (pending.length === 0) {

        container.innerHTML = `
            <div class="empty">
                🎉 No pending tasks.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    pending.forEach(task => {

        container.innerHTML += `

            <div class="task-card">

                <div class="task-row">

                    <input
                        type="checkbox"
                        onchange="
                            toggleTask('${task.id}')
                        "
                    >

                    <span class="task-name">
                        ${escapeHTML(task.name)}
                    </span>

                </div>

            </div>

        `;

    });
}


// ==========================================
// TOGGLE TASK
// ==========================================

async function toggleTask(id) {

    const task =
        tasks.find(
            task =>
                String(task.id) ===
                String(id)
        );


    if (!task) return;


    try {

        const result =
            await apiRequest(
                `/tasks/${id}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify({

                            name:
                                task.name,

                            category:
                                task.category,

                            due_date:
                                normalizeDate(
                                    task.date
                                ),

                            priority:
                                task.priority,

                            notes:
                                task.notes,

                            completed:
                                !task.completed

                        })
                }
            );


        const updated =
            normalizeTask(
                result
            );


        const index =
            tasks.findIndex(
                task =>
                    String(task.id) ===
                    String(id)
            );


        if (index !== -1) {

            tasks[index] =
                updated;

        }


        renderAll();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to update task:\n" +
            error.message
        );

    }
}


// ==========================================
// DELETE TASK
// ==========================================

async function deleteTask(id) {

    if (
        !confirm(
            "Delete this task?"
        )
    ) {
        return;
    }


    try {

        await apiRequest(
            `/tasks/${id}`,
            {
                method: "DELETE"
            }
        );


        tasks =
            tasks.filter(
                task =>
                    String(task.id) !==
                    String(id)
            );


        renderAll();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to delete task:\n" +
            error.message
        );

    }
}


// ==========================================
// PROGRESS
// ==========================================

function updateProgress() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    const text =
        document.getElementById(
            "taskProgressText"
        );


    const percent =
        document.getElementById(
            "progressPercent"
        );


    const fill =
        document.getElementById(
            "progressFill"
        );


    if (text) {

        text.textContent =
            `${completed} / ${total} completed`;

    }


    if (percent) {

        percent.textContent =
            percentage + "%";

    }


    if (fill) {

        fill.style.width =
            percentage + "%";

    }
}


// ==========================================
// CALENDAR
// ==========================================

function renderCalendar() {

    const title =
        document.getElementById(
            "calendarTitle"
        );


    const container =
        document.getElementById(
            "calendarDays"
        );


    if (!title || !container) {
        return;
    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];


    title.textContent =
        `${monthNames[month]} ${year}`;


    container.innerHTML = "";


    let firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    firstDay =
        firstDay === 0
            ? 6
            : firstDay - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day empty";

        container.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement("div");


        cell.className =
            "calendar-day";


        const date =
            createDateString(
                year,
                month,
                day
            );


        const number =
            document.createElement("div");


        number.className =
            "day-number";


        number.textContent =
            day;


        cell.appendChild(
            number
        );


        const companyEvents =
            companies.filter(
                company =>
                    normalizeDate(
                        company.date
                    ) === date
            );


        const taskEvents =
            tasks.filter(
                task =>
                    normalizeDate(
                        task.date
                    ) === date
            );


        if (
            companyEvents.length > 0 ||
            taskEvents.length > 0
        ) {

            const dots =
                document.createElement("div");


            dots.className =
                "event-dots";


            if (
                companyEvents.length > 0
            ) {

                const dot =
                    document.createElement("i");

                dot.className =
                    "blue-dot";

                dots.appendChild(
                    dot
                );

            }


            if (
                taskEvents.length > 0
            ) {

                const dot =
                    document.createElement("i");

                dot.className =
                    "green-dot";

                dots.appendChild(
                    dot
                );

            }


            cell.appendChild(
                dots
            );

        }


        const today =
            new Date();


        const todayString =
            createDateString(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            );


        if (
            date === todayString
        ) {

            cell.classList.add(
                "today"
            );

        }


        cell.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(
                        ".calendar-day"
                    )
                    .forEach(
                        dayCell =>
                            dayCell.classList.remove(
                                "selected"
                            )
                    );


                cell.classList.add(
                    "selected"
                );


                showDateEvents(
                    date
                );

            }
        );


        container.appendChild(
            cell
        );

    }
}


// ==========================================
// CHANGE CALENDAR MONTH
// ==========================================

function changeMonth(amount) {

    calendarDate.setMonth(
        calendarDate.getMonth() +
        amount
    );


    renderCalendar();
}


// ==========================================
// DATE EVENTS
// ==========================================

function showDateEvents(date) {

    const title =
        document.getElementById(
            "selectedDateTitle"
        );


    const container =
        document.getElementById(
            "dateEvents"
        );


    if (!title || !container) {
        return;
    }


    title.textContent =
        `📅 ${formatDate(date)}`;


    const companyEvents =
        companies.filter(
            company =>
                normalizeDate(
                    company.date
                ) === date
        );


    const taskEvents =
        tasks.filter(
            task =>
                normalizeDate(
                    task.date
                ) === date
        );


    if (
        companyEvents.length === 0 &&
        taskEvents.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">
                🎉 Nothing scheduled for this date.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    companyEvents.forEach(company => {

        container.innerHTML += `

            <div class="event-card company-event">

                <h3>
                    🏢 ${escapeHTML(company.name)}
                </h3>

                <p>
                    💼 ${escapeHTML(company.role)}
                </p>

                <p>
                    📅 ${formatDate(company.date)}
                </p>

                <p>
                    Status:
                    ${escapeHTML(company.status)}
                </p>

                ${
                    company.package
                        ? `<p>💰 ${escapeHTML(company.package)}</p>`
                        : ""
                }

            </div>

        `;

    });


    taskEvents.forEach(task => {

        container.innerHTML += `

            <div class="event-card task-event">

                <h3>
                    📚 ${escapeHTML(task.name)}
                </h3>

                <p>
                    📂 ${escapeHTML(task.category)}
                </p>

                <p>
                    ⭐ ${escapeHTML(task.priority)}
                </p>

                <p>
                    ${
                        task.completed
                            ? "✅ Completed"
                            : "⏳ Pending"
                    }
                </p>

            </div>

        `;

    });
}


// ==========================================
// NOTES
// ==========================================

async function saveNotes() {

    const textarea =
        document.getElementById(
            "generalNotes"
        );


    if (!textarea) return;


    try {

        await apiRequest(
            "/notes",
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        content:
                            textarea.value
                    })
            }
        );


        const message =
            document.getElementById(
                "notesSaved"
            );


        if (message) {

            message.textContent =
                "✓ Notes saved successfully";


            setTimeout(
                function() {

                    message.textContent = "";

                },
                2500
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            "Failed to save notes:\n" +
            error.message
        );

    }
}


// ==========================================
// RENDER EVERYTHING
// ==========================================

function renderAll() {

    updateStats();

    renderUpcoming();

    renderCompanies();

    renderTasks();

    renderHomeTasks();

    renderCalendar();

}


// ==========================================
// INITIALIZE
// ==========================================

async function initializeApp() {

    console.log(
        "Loading PlacementMate..."
    );


    await Promise.all([
        loadCompanies(),
        loadTasks(),
        loadNotes()
    ]);


    selectStatus("Upcoming");

    selectCategory("DSA");

    selectPriority("Medium");


    renderAll();


    console.log(
        "PlacementMate loaded successfully."
    );

}


initializeApp();S