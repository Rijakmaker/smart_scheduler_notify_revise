document.addEventListener('DOMContentLoaded', () => {
    const topicInput = document.getElementById('topicInput');
    const dateInput = document.getElementById('dateInput');
    const addBtn = document.getElementById('addBtn');
    const studyGrid = document.getElementById('studyGrid');
    const historyGrid = document.getElementById('historyGrid');
    const voiceBtn = document.getElementById('enableVoice');
    const clearHistoryBtn = document.getElementById('clearHistory');

    let activeTasks = JSON.parse(localStorage.getItem('activeTasks')) || [];
    let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

    dateInput.valueAsDate = new Date();

    // 1. Voice Initialization
    voiceBtn.addEventListener('click', () => {
        const utter = new SpeechSynthesisUtterance("Voice and alarms are now active.");
        window.speechSynthesis.speak(utter);
        Notification.requestPermission();
        voiceBtn.style.display = 'none';
    });

    // 2. Generate Plan
    addBtn.addEventListener('click', () => {
        const topic = topicInput.value.trim();
        const start = dateInput.value;
        if(!topic || !start) return alert("Please fill in both fields.");

        [2, 3, 5, 7].forEach(day => {
            const d = new Date(start);
            d.setDate(d.getDate() + (day - 1));
            activeTasks.push({
                id: Date.now() + Math.random(),
                topic: topic,
                day: day,
                date: d.toDateString(),
                notified: false
            });
        });
        saveAndRender();
        topicInput.value = '';
    });

    // 3. Mark Done
    window.markDone = (id) => {
        const index = activeTasks.findIndex(t => t.id === id);
        if (index > -1) {
            const task = activeTasks[index];
            task.finishedOn = new Date().toLocaleString();
            completedTasks.push(task);
            activeTasks.splice(index, 1);
            window.speechSynthesis.cancel(); 
            saveAndRender();
        }
    };

    // 4. Alarm Engine
    function runAlarmEngine() {
        const today = new Date().toDateString();
        activeTasks.forEach(task => {
            if(task.date === today && !task.notified) {
                task.notified = true;
                const msg = new SpeechSynthesisUtterance(`Reminder: Your revision for ${task.topic} is pending.`);
                window.speechSynthesis.speak(msg);
                if(Notification.permission === 'granted') {
                    new Notification("Revision Due!", { body: `Topic: ${task.topic}` });
                }
                saveAndRender();
            }
        });
    }

    function saveAndRender() {
        localStorage.setItem('activeTasks', JSON.stringify(activeTasks));
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        render();
    }

    function render() {
        const today = new Date().toDateString();
        studyGrid.innerHTML = '';
        historyGrid.innerHTML = '';

        activeTasks.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(task => {
            const isDue = task.date === today;
            const doneCount = completedTasks.filter(h => h.topic === task.topic).length;
            const progress = (doneCount / 4) * 100;

            const card = document.createElement('div');
            card.className = `task-card day-${task.day} ${isDue ? 'due-today' : ''}`;
            card.innerHTML = `
                <div class="badge ${isDue ? 'badge-due' : ''}">${isDue ? '⚠️ PENDING' : 'Day ' + task.day}</div>
                <h3>${task.topic}</h3>
                <div class="progress-box">
                    <div class="progress-label"><span>Mastery</span><span>${progress}%</span></div>
                    <div class="progress-bg"><div class="progress-fill" style="width:${progress}%"></div></div>
                </div>
                <p>📅 Scheduled: ${task.date}</p>
                <button class="btn btn-done" onclick="markDone(${task.id})">Mark Done</button>
            `;
            studyGrid.appendChild(card);
        });

        completedTasks.slice().reverse().forEach(task => {
            const isMastered = completedTasks.filter(h => h.topic === task.topic).length >= 4;
            const card = document.createElement('div');
            card.className = `task-card`;
            card.innerHTML = `
                <div class="badge ${isMastered ? 'mastered-badge' : ''}">${isMastered ? '🏆 MASTERED' : 'Day ' + task.day + ' Done'}</div>
                <h3>${task.topic}</h3>
                <p style="color:var(--success); font-size:0.8rem;">✅ ${task.finishedOn}</p>
            `;
            historyGrid.appendChild(card);
        });
    }

    clearHistoryBtn.addEventListener('click', () => {
        if(confirm("Clear History?")) { completedTasks = []; saveAndRender(); }
    });

    setInterval(runAlarmEngine, 10000);
    render();
});
