// Reading Stars App - Main JavaScript File

// App State
let appState = {
    user: {
        avatar: '🐻',
        animal: 'Bear',
        color: 'Brown',
        totalStars: 0,
        totalMinutes: 0,
        currentStreak: 0,
        lastReadDate: null,
        badges: [],
        readingSessions: []
    },
    timer: {
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        intervalId: null
    },
    team: {
        goal: 1000,
        totalMinutes: 0,
        members: []
    },
    parent: {
        rewards: {
            10: "Extra 15 minutes screen time",
            25: "Pick tonight's dinner",
            50: "Movie night choice"
        }
    }
};

// Badge definitions
const BADGES = {
    'first-read': {
        name: 'First Steps',
        icon: '👶',
        description: 'Read for the first time!',
        requirement: (user) => user.totalMinutes >= 1
    },
    'early-bird': {
        name: 'Early Bird',
        icon: '🌅',
        description: 'Read before 9 AM',
        requirement: (user) => user.badges.includes('early-bird-earned')
    },
    'night-owl': {
        name: 'Lights-Out Legend',
        icon: '🌙',
        description: 'Read after 8 PM',
        requirement: (user) => user.badges.includes('night-owl-earned')
    },
    'rainy-day': {
        name: 'Rainy Day Reader',
        icon: '🌧️',
        description: 'Read on a rainy day',
        requirement: (user) => user.badges.includes('rainy-day-earned')
    },
    'streak-3': {
        name: 'Three in a Row',
        icon: '🔥',
        description: 'Read 3 days in a row',
        requirement: (user) => user.currentStreak >= 3
    },
    'streak-7': {
        name: 'Week Warrior',
        icon: '⚡',
        description: 'Read 7 days in a row',
        requirement: (user) => user.currentStreak >= 7
    },
    'marathon': {
        name: 'Reading Marathon',
        icon: '🏃',
        description: 'Read for 60 minutes in one day',
        requirement: (user) => user.badges.includes('marathon-earned')
    },
    'century': {
        name: 'Century Club',
        icon: '💯',
        description: 'Read 100 total minutes',
        requirement: (user) => user.totalMinutes >= 100
    },
    'bookworm': {
        name: 'Bookworm',
        icon: '🐛',
        description: 'Read 500 total minutes',
        requirement: (user) => user.totalMinutes >= 500
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadAppState();
    initializeApp();
    updateDisplay();
    generateTeamMembers();
});

// Load app state from localStorage
function loadAppState() {
    const saved = localStorage.getItem('readingStarsApp');
    if (saved) {
        const savedState = JSON.parse(saved);
        appState = { ...appState, ...savedState };
    }
    
    // Initialize team members if empty
    if (appState.team.members.length === 0) {
        generateTeamMembers();
    }
}

// Save app state to localStorage
function saveAppState() {
    localStorage.setItem('readingStarsApp', JSON.stringify(appState));
}

// Initialize app components
function initializeApp() {
    updateUserDisplay();
    updateStats();
    updateBadges();
    updateTeamProgress();
    loadParentSettings();
}

// Update user display
function updateUserDisplay() {
    document.getElementById('userAvatar').textContent = appState.user.avatar;
    document.getElementById('username').textContent = `${appState.user.color} ${appState.user.animal}`;
}

// Timer functions
function toggleTimer() {
    const startBtn = document.getElementById('startBtn');
    const timerStatus = document.getElementById('timerStatus');
    
    if (!appState.timer.isRunning) {
        // Start timer
        appState.timer.isRunning = true;
        appState.timer.startTime = Date.now() - appState.timer.elapsedTime;
        appState.timer.intervalId = setInterval(updateTimer, 1000);
        
        startBtn.innerHTML = '<span class="btn-icon">⏹️</span>Stop Reading';
        startBtn.classList.add('active');
        timerStatus.textContent = 'Reading in progress...';
        
        // Check for early bird badge (before 9 AM)
        const hour = new Date().getHours();
        if (hour < 9) {
            appState.user.badges.push('early-bird-earned');
        }
        
        // Check for night owl badge (after 8 PM)
        if (hour >= 20) {
            appState.user.badges.push('night-owl-earned');
        }
        
    } else {
        // Stop timer
        stopTimer();
    }
    
    saveAppState();
}

function stopTimer() {
    if (!appState.timer.isRunning) return;
    
    const startBtn = document.getElementById('startBtn');
    const timerStatus = document.getElementById('timerStatus');
    
    appState.timer.isRunning = false;
    clearInterval(appState.timer.intervalId);
    
    const sessionMinutes = Math.floor(appState.timer.elapsedTime / 60000);
    
    if (sessionMinutes > 0) {
        addReadingSession(sessionMinutes, 0);
    }
    
    // Reset timer
    appState.timer.elapsedTime = 0;
    appState.timer.startTime = null;
    
    startBtn.innerHTML = '<span class="btn-icon">📚</span>Start Reading!';
    startBtn.classList.remove('active');
    timerStatus.textContent = 'Great job reading!';
    
    updateTimer();
    
    setTimeout(() => {
        timerStatus.textContent = 'Ready to read!';
    }, 3000);
}

function updateTimer() {
    if (appState.timer.isRunning) {
        appState.timer.elapsedTime = Date.now() - appState.timer.startTime;
    }
    
    const minutes = Math.floor(appState.timer.elapsedTime / 60000);
    const seconds = Math.floor((appState.timer.elapsedTime % 60000) / 1000);
    
    document.getElementById('timerDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Quick add function
function quickAdd() {
    const minutesInput = document.getElementById('quickMinutes');
    const pagesInput = document.getElementById('quickPages');
    
    const minutes = parseInt(minutesInput.value) || 0;
    const pages = parseInt(pagesInput.value) || 0;
    
    if (minutes > 0 || pages > 0) {
        addReadingSession(minutes, pages);
        minutesInput.value = '';
        pagesInput.value = '';
        
        // Show success animation
        showStarAnimation();
    }
}

// Add reading session
function addReadingSession(minutes, pages) {
    const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        minutes: minutes,
        pages: pages,
        approved: false
    };
    
    appState.user.readingSessions.push(session);
    appState.user.totalMinutes += minutes;
    appState.user.totalStars += Math.floor(minutes / 5); // 1 star per 5 minutes
    
    // Update team progress
    appState.team.totalMinutes += minutes;
    
    // Update streak
    updateStreak();
    
    // Check for badges
    checkBadges(minutes);
    
    // Update display
    updateStats();
    updateBadges();
    updateTeamProgress();
    
    saveAppState();
}

// Update reading streak
function updateStreak() {
    const today = new Date().toDateString();
    const lastRead = appState.user.lastReadDate;
    
    if (!lastRead) {
        appState.user.currentStreak = 1;
    } else {
        const lastReadDate = new Date(lastRead).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastReadDate === today) {
            // Already read today, keep streak
            return;
        } else if (lastReadDate === yesterday) {
            // Read yesterday, continue streak
            appState.user.currentStreak += 1;
        } else {
            // Streak broken
            appState.user.currentStreak = 1;
        }
    }
    
    appState.user.lastReadDate = today;
}

// Check for new badges
function checkBadges(sessionMinutes) {
    const newBadges = [];
    
    // Check marathon badge (60 minutes in one session)
    if (sessionMinutes >= 60) {
        appState.user.badges.push('marathon-earned');
    }
    
    // Check all badge requirements
    Object.keys(BADGES).forEach(badgeId => {
        if (!appState.user.badges.includes(badgeId) && 
            BADGES[badgeId].requirement(appState.user)) {
            appState.user.badges.push(badgeId);
            newBadges.push(badgeId);
        }
    });
    
    // Show badge notifications
    newBadges.forEach(badgeId => {
        showBadgeNotification(BADGES[badgeId]);
    });
}

// Show badge notification
function showBadgeNotification(badge) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-notification-content">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-info">
                <h3>New Badge!</h3>
                <p>${badge.name}</p>
                <small>${badge.description}</small>
            </div>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.5s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 4000);
}

// Update stats display
function updateStats() {
    document.getElementById('totalStars').textContent = appState.user.totalStars;
    document.getElementById('currentStreak').textContent = appState.user.currentStreak;
    document.getElementById('totalMinutes').textContent = appState.user.totalMinutes;
}

// Update badges display
function updateBadges() {
    const badgesGrid = document.getElementById('badgesGrid');
    badgesGrid.innerHTML = '';
    
    Object.keys(BADGES).forEach(badgeId => {
        const badge = BADGES[badgeId];
        const earned = appState.user.badges.includes(badgeId) || 
                      badge.requirement(appState.user);
        
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge ${earned ? '' : 'locked'}`;
        badgeElement.innerHTML = `
            <span class="badge-icon">${badge.icon}</span>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        `;
        
        badgesGrid.appendChild(badgeElement);
    });
}

// Generate team members
function generateTeamMembers() {
    const animals = ['🐱', '🐶', '🐸', '🐧', '🦊', '🐨', '🐯', '🐰'];
    const colors = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Pink', 'Yellow', 'Teal'];
    
    appState.team.members = [];
    
    // Generate 5-8 random team members
    const memberCount = Math.floor(Math.random() * 4) + 5;
    
    for (let i = 0; i < memberCount; i++) {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const minutes = Math.floor(Math.random() * 200) + 50; // Random reading minutes
        
        appState.team.members.push({
            id: i,
            avatar: animal,
            name: `${color} ${getAnimalName(animal)}`,
            minutes: minutes
        });
        
        appState.team.totalMinutes += minutes;
    }
    
    // Add current user to team
    appState.team.members.push({
        id: 'user',
        avatar: appState.user.avatar,
        name: `${appState.user.color} ${appState.user.animal}`,
        minutes: appState.user.totalMinutes,
        isCurrentUser: true
    });
    
    saveAppState();
}

// Get animal name from emoji
function getAnimalName(emoji) {
    const animalMap = {
        '🐱': 'Cat', '🐶': 'Dog', '🐸': 'Frog', '🐧': 'Penguin',
        '🦊': 'Fox', '🐨': 'Koala', '🐯': 'Tiger', '🐰': 'Rabbit',
        '🐻': 'Bear'
    };
    return animalMap[emoji] || 'Animal';
}

// Update team progress
function updateTeamProgress() {
    const progressFill = document.getElementById('teamProgress');
    const teamMinutes = document.getElementById('teamMinutes');
    const teamGoal = document.getElementById('teamGoal');
    const teamAvatars = document.getElementById('teamAvatars');
    
    // Update user's minutes in team
    const userMember = appState.team.members.find(m => m.id === 'user');
    if (userMember) {
        userMember.minutes = appState.user.totalMinutes;
    }
    
    // Calculate total team minutes
    const totalMinutes = appState.team.members.reduce((sum, member) => sum + member.minutes, 0);
    const progressPercent = Math.min((totalMinutes / appState.team.goal) * 100, 100);
    
    progressFill.style.width = `${progressPercent}%`;
    teamMinutes.textContent = totalMinutes;
    teamGoal.textContent = appState.team.goal;
    
    // Update team avatars
    teamAvatars.innerHTML = '';
    appState.team.members.forEach(member => {
        const avatar = document.createElement('div');
        avatar.className = `team-avatar ${member.isCurrentUser ? 'current-user' : ''}`;
        avatar.textContent = member.avatar;
        avatar.title = `${member.name}: ${member.minutes} minutes`;
        
        if (member.isCurrentUser) {
            avatar.style.border = '3px solid #667eea';
        }
        
        teamAvatars.appendChild(avatar);
    });
}

// Show star animation
function showStarAnimation() {
    const star = document.createElement('div');
    star.textContent = '⭐';
    star.style.cssText = `
        position: fixed;
        font-size: 3rem;
        z-index: 1000;
        pointer-events: none;
        animation: starFloat 2s ease-out forwards;
    `;
    
    // Position randomly around the quick add button
    const quickAdd = document.querySelector('.quick-add');
    const rect = quickAdd.getBoundingClientRect();
    star.style.left = `${rect.left + Math.random() * rect.width}px`;
    star.style.top = `${rect.top + Math.random() * rect.height}px`;
    
    document.body.appendChild(star);
    
    setTimeout(() => {
        document.body.removeChild(star);
    }, 2000);
}

// Settings functions
function showSettings() {
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function selectAvatar(emoji, animal) {
    appState.user.avatar = emoji;
    appState.user.animal = animal;
    
    // Update visual selection
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    updateUserDisplay();
    saveAppState();
}

function selectColor(color) {
    appState.user.color = color;
    
    // Update visual selection
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    updateUserDisplay();
    saveAppState();
}

// Parent view functions
function toggleParentView() {
    document.getElementById('parentModal').style.display = 'block';
    updateParentView();
}

function closeParentView() {
    document.getElementById('parentModal').style.display = 'none';
}

function showParentTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.parent-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    event.target.classList.add('active');
    
    if (tabName === 'logs') {
        updateReadingLogs();
    }
}

function updateParentView() {
    updateReadingLogs();
    loadParentSettings();
}

function updateReadingLogs() {
    const logsList = document.getElementById('logsList');
    logsList.innerHTML = '';
    
    appState.user.readingSessions.slice(-10).reverse().forEach(session => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        
        const date = new Date(session.date).toLocaleDateString();
        const time = new Date(session.date).toLocaleTimeString();
        
        logItem.innerHTML = `
            <div class="log-info">
                <strong>${date} at ${time}</strong>
                <span>${session.minutes} minutes${session.pages ? `, ${session.pages} pages` : ''}</span>
                <span class="status ${session.approved ? 'approved' : 'pending'}">
                    ${session.approved ? '✅ Approved' : '⏳ Pending'}
                </span>
            </div>
            <div class="log-actions">
                ${!session.approved ? `<button class="approve-btn" onclick="approveSession(${session.id})">Approve</button>` : ''}
                <button class="edit-btn" onclick="editSession(${session.id})">Edit</button>
                <button class="delete-btn" onclick="deleteSession(${session.id})">Delete</button>
            </div>
        `;
        
        logsList.appendChild(logItem);
    });
}

function approveSession(sessionId) {
    const session = appState.user.readingSessions.find(s => s.id === sessionId);
    if (session) {
        session.approved = true;
        saveAppState();
        updateReadingLogs();
    }
}

function editSession(sessionId) {
    const session = appState.user.readingSessions.find(s => s.id === sessionId);
    if (session) {
        const newMinutes = prompt('Edit minutes:', session.minutes);
        const newPages = prompt('Edit pages:', session.pages || 0);
        
        if (newMinutes !== null) {
            const oldMinutes = session.minutes;
            session.minutes = parseInt(newMinutes) || 0;
            session.pages = parseInt(newPages) || 0;
            
            // Update totals
            appState.user.totalMinutes += (session.minutes - oldMinutes);
            appState.user.totalStars = Math.floor(appState.user.totalMinutes / 5);
            
            updateStats();
            saveAppState();
            updateReadingLogs();
        }
    }
}

function deleteSession(sessionId) {
    if (confirm('Are you sure you want to delete this reading session?')) {
        const sessionIndex = appState.user.readingSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            const session = appState.user.readingSessions[sessionIndex];
            
            // Update totals
            appState.user.totalMinutes -= session.minutes;
            appState.user.totalStars = Math.floor(appState.user.totalMinutes / 5);
            
            // Remove session
            appState.user.readingSessions.splice(sessionIndex, 1);
            
            updateStats();
            saveAppState();
            updateReadingLogs();
        }
    }
}

function saveRewards() {
    appState.parent.rewards[10] = document.getElementById('reward10').value || appState.parent.rewards[10];
    appState.parent.rewards[25] = document.getElementById('reward25').value || appState.parent.rewards[25];
    appState.parent.rewards[50] = document.getElementById('reward50').value || appState.parent.rewards[50];
    
    saveAppState();
    alert('Rewards saved successfully!');
}

function updateTeamGoal() {
    const newGoal = parseInt(document.getElementById('teamGoalInput').value);
    if (newGoal && newGoal > 0) {
        appState.team.goal = newGoal;
        updateTeamProgress();
        saveAppState();
        alert('Team goal updated successfully!');
    }
}

function loadParentSettings() {
    document.getElementById('reward10').value = appState.parent.rewards[10];
    document.getElementById('reward25').value = appState.parent.rewards[25];
    document.getElementById('reward50').value = appState.parent.rewards[50];
    document.getElementById('teamGoalInput').value = appState.team.goal;
}

// Update display function
function updateDisplay() {
    updateStats();
    updateBadges();
    updateTeamProgress();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes starFloat {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
    }
    
    .badge-notification-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .badge-notification .badge-icon {
        font-size: 2rem;
    }
    
    .badge-notification h3 {
        margin: 0;
        font-size: 1.2rem;
    }
    
    .badge-notification p {
        margin: 5px 0;
        font-weight: 600;
    }
    
    .badge-notification small {
        opacity: 0.9;
    }
    
    .status.approved {
        color: #4ecdc4;
        font-weight: 600;
    }
    
    .status.pending {
        color: #feca57;
        font-weight: 600;
    }
    
    .team-avatar.current-user {
        transform: scale(1.1);
        box-shadow: 0 0 0 3px #667eea;
    }
`;
document.head.appendChild(style);