let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentEditId = null;
let pomodoroInterval;
let pomodoroTime = 25 * 60;
let isWork = true;

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTasks();
    updateTimerDisplay();
    document.getElementById('themeToggle').onclick = toggleTheme;
    document.getElementById('accentColor').onchange = (e) => {
        document.documentElement.style.setProperty('--accent', e.target.value);
        localStorage.setItem('accent', e.target.value);
    };
    document.getElementById('searchInput').oninput = filterTasks;

    // Load saved accent
    const savedAccent = localStorage.getItem('accent') || '#6c5ce7';
    document.documentElement.style.setProperty('--accent', savedAccent);
    document.getElementById('accentColor').value = savedAccent;

    // Pomodoro controls
    document.getElementById('pomodoroStart').onclick = togglePomodoro;
    document.getElementById('pomodoroReset').onclick = resetPomodoro;
});

function loadTasks() {
    tasks.forEach(task => renderTask(task));
}

function renderTask(task) {
    const list = document.querySelector(`#${task.status} .task-list`);
    const card = document.createElement('div');
    card.className = 'task-card ' + task.priority;
    card.draggable = true;
    card.dataset.id = task.id;
    card.ondragstart = drag;

    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done') {
        card.classList.add('overdue');
    }

    card.innerHTML = `
        <div class="task-title">${task.title}</div>
        ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
        <div class="task-meta">
            ${task.dueDate ? 'Due: ' + new Date(task.dueDate).toLocaleDateString() : ''}
            Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </div>
        ${task.tags.length ? '<div class="task-tags">' + task.tags.map(t => `<span class="tag">${t}</span>`).join('') + '</div>' : ''}
        <button onclick="editTask('${task.id}')" style="position:absolute;top:8px;right:40px;">Edit</button>
        <button onclick="deleteTask('${task.id}')" style="position:absolute;top:8px;right:8px;background:#e74c3c;">×</button>
    `;
    list.appendChild(card);
}

function openTaskModal(status) {
    currentEditId = null;
    document.getElementById('taskModal').style.display = 'flex';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskTags').value = '';
    window.currentStatus = status;
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return;

    const task = {
        id: currentEditId || Date.now().toString(),
        title,
        desc: document.getElementById('taskDesc').value,
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t),
        status: currentEditId ? tasks.find(t => t.id === currentEditId).status : window.currentStatus
    };

    if (currentEditId) {
        tasks = tasks.map(t => t.id === currentEditId ? task : t);
        document.querySelector(`.task-card[data-id="${currentEditId}"]`).remove();
    } else {
        tasks.push(task);
    }

    renderTask(task);
    saveToStorage();
    closeTaskModal();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    currentEditId = id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDesc').value = task.desc || '';
    document.getElementById('taskDueDate').value = task.dueDate || '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskTags').value = task.tags.join(', ');
    window.currentStatus = task.status;

    document.getElementById('taskModal').style.display = 'flex';
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    document.querySelector(`.task-card[data-id="${id}"]`).remove();
    saveToStorage();
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.dataset.id); }

function drop(ev) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text");
    const card = document.querySelector(`.task-card[data-id="${id}"]`);
    const newStatus = ev.target.closest('.column').dataset.status;

    if (card && newStatus) {
        ev.target.closest('.task-list').appendChild(card);
        tasks.find(t => t.id === id).status = newStatus;
        saveToStorage();
    }
}

function filterTasks() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.task-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
}

function saveToStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeToggle').textContent = '☀️';
    }
}

// Pomodoro Timer
function updateTimerDisplay() {
    const mins = Math.floor(pomodoroTime / 60).toString().padStart(2, '0');
    const secs = (pomodoroTime % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${mins}:${secs}`;
}

function togglePomodoro() {
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        document.getElementById('pomodoroStart').textContent = 'Start Pomodoro';
    } else {
        pomodoroInterval = setInterval(() => {
            pomodoroTime--;
            updateTimerDisplay();
            if (pomodoroTime <= 0) {
                clearInterval(pomodoroInterval);
                pomodoroInterval = null;
                alert(isWork ? "Time for a break!" : "Back to work!");
                pomodoroTime = isWork ? 5 * 60 : 25 * 60;
                isWork = !isWork;
                document.getElementById('pomodoroStatus').textContent = isWork ? "Work time" : "Break time";
                updateTimerDisplay();
                document.getElementById('pomodoroStart').textContent = 'Start Pomodoro';
            }
        }, 1000);
        document.getElementById('pomodoroStart').textContent = 'Pause';
    }
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    isWork = true;
    pomodoroTime = 25 * 60;
    updateTimerDisplay();
    document.getElementById('pomodoroStart').textContent = 'Start Pomodoro';
    document.getElementById('pomodoroStatus').textContent = 'Work time';
}
