// Data structure
let appData = {
    user: null,
    timer: {
        isRunning: false,
        startTime: null,
        elapsed: 0,
        interval: null
    },
    logs: [],
    badges: [
        { id: 'first-read', name: 'First Reader', description: 'Complete your first reading session', icon: '📚', unlocked: false, requirement: 1 },
        { id: 'five-star', name: '5-Star Reader', description: 'Earn 5 stars', icon: '⭐', unlocked: false, requirement: 5 },
        { id: 'streak-3', name: 'Rainy Day Reader', description: 'Read 3 days in a row', icon: '🌧️', unlocked: false, requirement: 3 },
        { id: 'streak-7', name: 'Lights-Out Legend', description: 'Read 7 days in a row', icon: '🌙', unlocked: false, requirement: 7 },
        { id: 'hour-master', name: 'Hour Master', description: 'Read for 60 minutes in one session', icon: '⏰', unlocked: false, requirement: 60 },
        { id: 'ten-star', name: '10-Star Champion', description: 'Earn 10 stars', icon: '🌟', unlocked: false, requirement: 10 },
        { id: 'bookworm', name: 'Bookworm', description: 'Complete 20 reading sessions', icon: '🐛', unlocked: false, requirement: 20 },
        { id: 'super-reader', name: 'Super Reader', description: 'Earn 50 stars', icon: '🦸', unlocked: false, requirement: 50 }
    ],
    rewards: [
        { stars: 50, name: 'Movie Night 🎬', earned: false },
        { stars: 100, name: 'Pick Dinner 🍕', earned: false },
        { stars: 200, name: 'Extra Screen Time ⏰', earned: false }
    ],
    teamGoal: 1000,
    teamMembers: []
};

// Animal emojis mapping
const animalEmojis = {
    fox: '🦊',
    bear: '🐻',
    owl: '🦉',
    cat: '🐱',
    dog: '🐶',
    bunny: '🐰',
    dragon: '🐲',
    unicorn: '🦄'
};

// Color gradients mapping
const colorGradients = {
    rainbow: 'linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4d96ff, #9d84ff)',
    sunset: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
    ocean: 'linear-gradient(45deg, #4d96ff, #6bcf7f)',
    galaxy: 'linear-gradient(45deg, #9d84ff, #ff6b6b)',
    forest: 'linear-gradient(45deg, #6bcf7f, #2d8659)',
    golden: 'linear-gradient(45deg, #ffd93d, #ff9a3d)'
};

// Initialize app
function init() {
    loadData();
    setupEventListeners();
    
    if (appData.user) {
        showScreen('kid-screen');
        updateUI();
    } else {
        showScreen('onboarding-screen');
    }
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('readingStarsData');
    if (saved) {
        const savedData = JSON.parse(saved);
        appData = { ...appData, ...savedData };
    }
}

// Save data to localStorage
function saveData() {
    // Don't save timer state
    const dataToSave = {
        user: appData.user,
        logs: appData.logs,
        badges: appData.badges,
        rewards: appData.rewards,
        teamGoal: appData.teamGoal,
        teamMembers: appData.teamMembers
    };
    localStorage.setItem('readingStarsData', JSON.stringify(dataToSave));
}

// Show specific screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Setup all event listeners
function setupEventListeners() {
    // Onboarding
    document.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.addEventListener('click', () => selectAnimal(btn.dataset.animal));
    });
    
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => selectColor(btn.dataset.color));
    });
    
    document.getElementById('start-reading-btn').addEventListener('click', completeOnboarding);
    
    // Timer
    document.getElementById('start-timer').addEventListener('click', startTimer);
    document.getElementById('stop-timer').addEventListener('click', stopTimer);
    document.getElementById('quick-add-btn').addEventListener('click', quickAddTime);
    
    // View switching
    document.getElementById('switch-to-parent').addEventListener('click', () => {
        showScreen('parent-screen');
        updateParentView();
    });
    document.getElementById('switch-to-kid').addEventListener('click', () => {
        showScreen('kid-screen');
        updateUI();
    });
    
    // Parent controls
    document.querySelectorAll('.save-reward').forEach(btn => {
        btn.addEventListener('click', () => saveReward(btn.dataset.reward));
    });
    
    document.getElementById('save-team-goal').addEventListener('click', saveTeamGoal);
    
    // Modal
    document.getElementById('close-celebration').addEventListener('click', () => {
        document.getElementById('celebration-modal').classList.add('hidden');
    });
}

// Onboarding functions
let selectedAnimal = null;
let selectedColor = null;

function selectAnimal(animal) {
    selectedAnimal = animal;
    document.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-animal="${animal}"]`).classList.add('selected');
    updateAvatarPreview();
    checkOnboardingComplete();
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-color="${color}"]`).classList.add('selected');
    updateAvatarPreview();
    checkOnboardingComplete();
}

function updateAvatarPreview() {
    const preview = document.getElementById('avatar-preview');
    if (selectedAnimal && selectedColor) {
        preview.innerHTML = `
            <div style="background: ${colorGradients[selectedColor]}; 
                        border-radius: 50%; 
                        width: 150px; 
                        height: 150px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-size: 5rem;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                ${animalEmojis[selectedAnimal]}
            </div>
        `;
    }
}

function checkOnboardingComplete() {
    const startBtn = document.getElementById('start-reading-btn');
    if (selectedAnimal && selectedColor) {
        startBtn.disabled = false;
    }
}

function completeOnboarding() {
    appData.user = {
        animal: selectedAnimal,
        color: selectedColor,
        totalStars: 0,
        streak: 0,
        lastReadDate: null
    };
    
    // Add to team members
    appData.teamMembers.push({
        animal: selectedAnimal,
        color: selectedColor,
        minutes: 0
    });
    
    saveData();
    showScreen('kid-screen');
    updateUI();
}

// Timer functions
function startTimer() {
    appData.timer.isRunning = true;
    appData.timer.startTime = Date.now() - (appData.timer.elapsed * 1000);
    
    document.getElementById('start-timer').classList.add('hidden');
    document.getElementById('stop-timer').classList.remove('hidden');
    
    appData.timer.interval = setInterval(updateTimerDisplay, 100);
}

function stopTimer() {
    appData.timer.isRunning = false;
    clearInterval(appData.timer.interval);
    
    const minutes = Math.floor(appData.timer.elapsed / 60);
    
    if (minutes > 0) {
        addReadingLog(minutes, 0);
    }
    
    // Reset timer
    appData.timer.elapsed = 0;
    document.getElementById('timer-display').textContent = '00:00';
    document.getElementById('start-timer').classList.remove('hidden');
    document.getElementById('stop-timer').classList.add('hidden');
}

function updateTimerDisplay() {
    appData.timer.elapsed = Math.floor((Date.now() - appData.timer.startTime) / 1000);
    
    const minutes = Math.floor(appData.timer.elapsed / 60);
    const seconds = appData.timer.elapsed % 60;
    
    document.getElementById('timer-display').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function quickAddTime() {
    const minutes = parseInt(document.getElementById('manual-minutes').value) || 0;
    const pages = parseInt(document.getElementById('manual-pages').value) || 0;
    
    if (minutes > 0 || pages > 0) {
        const estimatedMinutes = minutes + Math.floor(pages * 1.5); // Estimate 1.5 min per page
        addReadingLog(estimatedMinutes, pages);
        
        document.getElementById('manual-minutes').value = '';
        document.getElementById('manual-pages').value = '';
    }
}

// Reading log functions
function addReadingLog(minutes, pages) {
    const stars = Math.ceil(minutes / 10); // 1 star per 10 minutes
    
    const log = {
        id: Date.now(),
        minutes: minutes,
        pages: pages,
        stars: stars,
        date: new Date().toISOString(),
        approved: false,
        pending: true
    };
    
    appData.logs.unshift(log);
    appData.user.totalStars += stars;
    
    // Update team member minutes
    const memberIndex = appData.teamMembers.findIndex(m => 
        m.animal === appData.user.animal && m.color === appData.user.color
    );
    if (memberIndex !== -1) {
        appData.teamMembers[memberIndex].minutes += minutes;
    }
    
    updateStreak();
    checkBadges(minutes);
    saveData();
    updateUI();
    
    showCelebration(`🎉 Amazing! You earned ${stars} star${stars > 1 ? 's' : ''}!`);
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastRead = appData.user.lastReadDate ? new Date(appData.user.lastReadDate).toDateString() : null;
    
    if (lastRead === today) {
        // Already read today
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastRead === yesterdayStr) {
        // Continue streak
        appData.user.streak += 1;
    } else if (lastRead !== today) {
        // Start new streak
        appData.user.streak = 1;
    }
    
    appData.user.lastReadDate = new Date().toISOString();
}

// Badge system
function checkBadges(sessionMinutes) {
    const totalStars = appData.user.totalStars;
    const streak = appData.user.streak;
    const sessionsCount = appData.logs.length;
    
    appData.badges.forEach(badge => {
        if (!badge.unlocked) {
            let unlock = false;
            
            switch(badge.id) {
                case 'first-read':
                    unlock = sessionsCount >= 1;
                    break;
                case 'five-star':
                    unlock = totalStars >= 5;
                    break;
                case 'ten-star':
                    unlock = totalStars >= 10;
                    break;
                case 'super-reader':
                    unlock = totalStars >= 50;
                    break;
                case 'streak-3':
                    unlock = streak >= 3;
                    break;
                case 'streak-7':
                    unlock = streak >= 7;
                    break;
                case 'hour-master':
                    unlock = sessionMinutes >= 60;
                    break;
                case 'bookworm':
                    unlock = sessionsCount >= 20;
                    break;
            }
            
            if (unlock) {
                badge.unlocked = true;
                showCelebration(`🏆 New Badge Unlocked: ${badge.name}!`, badge.description);
            }
        }
    });
}

// Update UI
function updateUI() {
    if (!appData.user) return;
    
    // Update avatar
    const kidAvatar = document.getElementById('kid-avatar');
    kidAvatar.innerHTML = animalEmojis[appData.user.animal];
    kidAvatar.style.background = colorGradients[appData.user.color];
    
    // Update stats
    document.getElementById('total-stars').textContent = appData.user.totalStars;
    document.getElementById('streak-count').textContent = appData.user.streak;
    
    // Update badges
    updateBadgesDisplay();
    
    // Update team goal
    updateTeamGoal();
    
    // Update reading log
    updateReadingLog();
}

function updateBadgesDisplay() {
    const badgesGrid = document.getElementById('badges-grid');
    badgesGrid.innerHTML = appData.badges.map(badge => `
        <div class="badge ${badge.unlocked ? '' : 'locked'}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        </div>
    `).join('');
}

function updateTeamGoal() {
    const totalMinutes = appData.teamMembers.reduce((sum, member) => sum + member.minutes, 0);
    const percentage = Math.min((totalMinutes / appData.teamGoal) * 100, 100);
    
    document.getElementById('goal-progress').style.width = percentage + '%';
    document.getElementById('goal-text').textContent = `${totalMinutes} / ${appData.teamGoal} min`;
    
    // Update team avatars
    const teamAvatars = document.getElementById('team-avatars');
    teamAvatars.innerHTML = appData.teamMembers.map(member => `
        <div class="team-avatar" style="background: ${colorGradients[member.color]};">
            ${animalEmojis[member.animal]}
        </div>
    `).join('');
}

function updateReadingLog() {
    const logList = document.getElementById('reading-log');
    
    if (appData.logs.length === 0) {
        logList.innerHTML = '<p class="empty-state">Start reading to see your log!</p>';
        return;
    }
    
    logList.innerHTML = appData.logs.slice(0, 10).map(log => `
        <div class="log-entry ${log.approved ? 'approved' : 'pending'}">
            <div class="log-info">
                <div class="log-time">${log.minutes} minutes${log.pages ? ` • ${log.pages} pages` : ''}</div>
                <div class="log-date">${new Date(log.date).toLocaleDateString()} at ${new Date(log.date).toLocaleTimeString()}</div>
            </div>
            <div class="log-stars">⭐ ${log.stars}</div>
        </div>
    `).join('');
}

// Parent view
function updateParentView() {
    updatePendingLogs();
    updateRewardsList();
    updateTeamSettings();
    updateAllLogs();
}

function updatePendingLogs() {
    const pendingLogs = document.getElementById('pending-logs');
    const pending = appData.logs.filter(log => log.pending && !log.approved);
    
    if (pending.length === 0) {
        pendingLogs.innerHTML = '<p class="empty-state">No logs pending approval!</p>';
        return;
    }
    
    pendingLogs.innerHTML = pending.map(log => `
        <div class="log-entry pending">
            <div class="log-info">
                <div class="log-time">${log.minutes} minutes${log.pages ? ` • ${log.pages} pages` : ''}</div>
                <div class="log-date">${new Date(log.date).toLocaleDateString()} at ${new Date(log.date).toLocaleTimeString()}</div>
            </div>
            <div class="log-stars">⭐ ${log.stars}</div>
            <div class="log-actions">
                <button class="btn-small btn-approve" onclick="approveLog(${log.id})">Approve ✓</button>
                <button class="btn-small" onclick="editLog(${log.id})">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteLog(${log.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function approveLog(logId) {
    const log = appData.logs.find(l => l.id === logId);
    if (log) {
        log.approved = true;
        log.pending = false;
        saveData();
        updateParentView();
    }
}

function editLog(logId) {
    const log = appData.logs.find(l => l.id === logId);
    if (log) {
        const newMinutes = prompt('Edit minutes:', log.minutes);
        if (newMinutes !== null) {
            const oldStars = log.stars;
            log.minutes = parseInt(newMinutes);
            log.stars = Math.ceil(log.minutes / 10);
            
            // Adjust total stars
            appData.user.totalStars += (log.stars - oldStars);
            
            saveData();
            updateParentView();
        }
    }
}

function deleteLog(logId) {
    if (confirm('Are you sure you want to delete this log?')) {
        const logIndex = appData.logs.findIndex(l => l.id === logId);
        if (logIndex !== -1) {
            const log = appData.logs[logIndex];
            appData.user.totalStars -= log.stars;
            appData.logs.splice(logIndex, 1);
            saveData();
            updateParentView();
        }
    }
}

function updateRewardsList() {
    const rewardsList = document.getElementById('rewards-list');
    rewardsList.innerHTML = appData.rewards.map((reward, index) => {
        const progress = Math.min((appData.user.totalStars / reward.stars) * 100, 100);
        return `
            <div class="reward-progress">
                <strong>${reward.name}</strong> - ${reward.stars} stars
                <div class="reward-progress-bar">
                    <div class="reward-progress-fill" style="width: ${progress}%"></div>
                </div>
                <small>${appData.user.totalStars} / ${reward.stars} stars</small>
            </div>
        `;
    }).join('');
}

function saveReward(rewardNum) {
    const index = parseInt(rewardNum) - 1;
    const stars = parseInt(document.getElementById(`reward-stars-${rewardNum}`).value);
    const name = document.getElementById(`reward-name-${rewardNum}`).value;
    
    if (stars && name) {
        appData.rewards[index] = { stars, name, earned: false };
        saveData();
        updateRewardsList();
        alert('Reward saved!');
    }
}

function saveTeamGoal() {
    const newGoal = parseInt(document.getElementById('team-goal-input').value);
    if (newGoal && newGoal > 0) {
        appData.teamGoal = newGoal;
        saveData();
        updateTeamGoal();
        alert('Team goal updated!');
    }
}

function updateTeamSettings() {
    document.getElementById('team-goal-input').value = appData.teamGoal;
    
    const membersDisplay = document.getElementById('team-members-display');
    membersDisplay.innerHTML = appData.teamMembers.map((member, index) => `
        <div class="team-member-card">
            <div class="avatar-display" style="background: ${colorGradients[member.color]};">
                ${animalEmojis[member.animal]}
            </div>
            <div>${member.minutes} minutes</div>
        </div>
    `).join('');
}

function updateAllLogs() {
    const allLogs = document.getElementById('all-logs');
    
    if (appData.logs.length === 0) {
        allLogs.innerHTML = '<p class="empty-state">No reading logs yet!</p>';
        return;
    }
    
    allLogs.innerHTML = appData.logs.map(log => `
        <div class="log-entry ${log.approved ? 'approved' : 'pending'}">
            <div class="log-info">
                <div class="log-time">${log.minutes} minutes${log.pages ? ` • ${log.pages} pages` : ''}</div>
                <div class="log-date">${new Date(log.date).toLocaleDateString()} at ${new Date(log.date).toLocaleTimeString()}</div>
            </div>
            <div class="log-stars">⭐ ${log.stars}</div>
            <div class="log-actions">
                ${!log.approved ? `<button class="btn-small btn-approve" onclick="approveLog(${log.id})">Approve ✓</button>` : ''}
                <button class="btn-small" onclick="editLog(${log.id})">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteLog(${log.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Celebration modal
function showCelebration(title, message = '') {
    document.getElementById('celebration-title').textContent = title;
    document.getElementById('celebration-message').textContent = message;
    document.getElementById('celebration-modal').classList.remove('hidden');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);