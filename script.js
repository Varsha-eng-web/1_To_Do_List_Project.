let isDarkMode = false;
let currentFilter = "all";
let activeEditIndex = null;

document.addEventListener("DOMContentLoaded", () => {
    // Load theme configuration
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
        isDarkMode = true;
        document.body.classList.add("dark-mode");
    }

    loadTasks();

    // Handle Enter Key Press
    document.getElementById("taskInput").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            addTask();
        }
    });
});

// Toast Messages helper
function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 50);

    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Add a Task
function addTask() {
    let taskInput = document.getElementById("taskInput");
    let prioritySelect = document.getElementById("prioritySelect");
    let taskText = taskInput.value.trim();
    if (taskText === "") return;

    let priority = prioritySelect.value;
    let timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let task = { 
        text: taskText, 
        completed: false,
        priority: priority,
        time: timestamp
    };
    
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    taskInput.value = "";
    prioritySelect.value = "normal";
    showToast("✨ Task added successfully!");
    loadTasks();
}

// Load tasks and populate UI
function loadTasks(filter = currentFilter) {
    currentFilter = filter;
    let taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    let pendingCount = 0;
    let completedCount = 0;

    // Update Filter active states
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    const activeFilterBtn = document.getElementById(`filter-${filter}`);
    if (activeFilterBtn) activeFilterBtn.classList.add("active");

    tasks.forEach((task, index) => {
        // Ensure correct backward compatibility for priority and time
        const taskPriority = task.priority || "normal";
        const taskTime = task.time || "Today";
        
        if (task.completed) {
            completedCount++;
        } else {
            pendingCount++;
        }

        if (filter === "pending" && task.completed) return;
        if (filter === "completed" && !task.completed) return;

        let taskDiv = document.createElement("div");
        taskDiv.classList.add("task");
        if (task.completed) taskDiv.classList.add("completed");
        taskDiv.setAttribute("data-index", index);

        // If this is the active editing index, render an inline form instead of task text
        if (activeEditIndex === index) {
            taskDiv.innerHTML = `
                <div class="edit-form" onclick="event.stopPropagation()">
                    <input type="text" class="edit-input" id="editInput-${index}" value="${task.text.replace(/"/g, '&quot;')}">
                    <button class="edit-save-btn" onclick="saveEdit(${index})">Save</button>
                    <button class="edit-cancel-btn" onclick="cancelEdit(event)">Cancel</button>
                </div>
            `;
            taskList.appendChild(taskDiv);
            
            // Auto-focus input
            setTimeout(() => {
                const el = document.getElementById(`editInput-${index}`);
                if (el) {
                    el.focus();
                    el.select();
                }
            }, 50);
            return;
        }

        // Render normal task card
        taskDiv.innerHTML = `
            <div class="checkbox-container ${task.completed ? 'checkbox-checked' : ''}" onclick="event.stopPropagation(); toggleComplete(${index})">
                <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="task-content" ondblclick="event.stopPropagation(); startEdit(${index})">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span class="priority-badge badge-${taskPriority}">${taskPriority}</span>
                    <span>•</span>
                    <span>${taskTime}</span>
                </div>
            </div>
            <div class="task-actions" onclick="event.stopPropagation()">
                <button class="action-icon-btn edit-btn" onclick="startEdit(${index})" title="Edit Task">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-icon-btn delete-btn" onclick="deleteTask(${index})" title="Delete Task">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;

        // Handle card click to complete
        taskDiv.addEventListener("click", () => toggleComplete(index));
        taskList.appendChild(taskDiv);
    });

    // Counters Update
    document.getElementById("pendingCount").textContent = pendingCount;
    document.getElementById("completedCount").textContent = completedCount;

    // Visual Progress bar Update
    const total = pendingCount + completedCount;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    document.getElementById("progressBarFill").style.width = `${pct}%`;
}

// Delete Task
function deleteTask(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    showToast("🗑️ Task deleted.");
    loadTasks();
}

// Toggle task completeness
function toggleComplete(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem("tasks", JSON.stringify(tasks));
    
    if (tasks[index].completed) {
        const allCompleted = tasks.length > 0 && tasks.every(t => t.completed);
        if (allCompleted) {
            showToast("🎉 Great! You completed all your tasks!");
        } else {
            showToast("🎉 Task completed! Keep it up!");
        }
    } else {
        showToast("🔄 Task set to pending.");
    }
    loadTasks();
}

// Dialog Handlers
function openConfirmDialog() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    if (tasks.length === 0) {
        showToast("💡 No tasks to clear.");
        return;
    }
    document.getElementById("confirmDialogOverlay").classList.add("active");
}

// Close confirmation dialog
function closeConfirmDialog() {
    document.getElementById("confirmDialogOverlay").classList.remove("active");
}

// Confirm clear all tasks
function confirmClearTasks() {
    localStorage.removeItem("tasks");
    closeConfirmDialog();
    showToast("🧹 All tasks cleared!");
    loadTasks();
}

// Filter tasks handler
function filterTasks(filter) {
    loadTasks(filter);
}

// Inline Edit handlers
function startEdit(index) {
    activeEditIndex = index;
    loadTasks();
}

// Cancel edit handler
function cancelEdit(event) {
    event.stopPropagation();
    activeEditIndex = null;
    loadTasks();
}

// Save edited task
function saveEdit(index) {
    let editInput = document.getElementById(`editInput-${index}`);
    let newText = editInput.value.trim();
    if (newText !== "") {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks[index].text = newText;
        // update modification time
        tasks[index].time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (edited)";
        localStorage.setItem("tasks", JSON.stringify(tasks));
        activeEditIndex = null;
        showToast("💾 Changes saved successfully!");
        loadTasks();
    }
}

// Toggle dark theme mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
        showToast("🌙 Dark mode enabled.");
    } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
        showToast("☀️ Light mode enabled.");
    }
}
