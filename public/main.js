const api = {
  async login(username, password){
    const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    if(!res.ok) throw new Error('Login failed');
    return res.json();
  },
  async me(){
    const token = localStorage.getItem('token');
    const res = await fetch('/api/auth/me',{headers: token? {'x-user-id':token}:{}});
    return res.json();
  },
  async myLogs(){
    const token = localStorage.getItem('token');
    const res = await fetch('/api/logs',{headers:{'x-user-id':token}});
    return res.json();
  },
  async createLog(data){
    const token = localStorage.getItem('token');
    const res = await fetch('/api/logs',{method:'POST',headers:{'Content-Type':'application/json','x-user-id':token},body:JSON.stringify(data)});
    return res.json();
  },
  async approveLog(id, decision){
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/logs/${id}/approve`,{method:'POST',headers:{'Content-Type':'application/json','x-user-id':token},body:JSON.stringify({decision})});
    return res.json();
  },
  async studentSummary(studentId){
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/summary/student/${studentId}`,{headers:{'x-user-id':token}});
    return res.json();
  },
  async classSummary(classId){
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/summary/class/${classId}`,{headers:{'x-user-id':token}});
    return res.json();
  },
  async teamSummary(teamId){
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/summary/team/${teamId}`,{headers:{'x-user-id':token}});
    return res.json();
  }
};

// Anonymous identity helpers (privacy-first)
const ANIMALS = ['Fox','Owl','Bear','Otter','Panda','Tiger','Turtle','Koala','Dolphin','Hedgehog','Penguin','Lion','Zebra','Giraffe','Whale','Bee','Butterfly','Rabbit','Wolf','Cat','Dog','Parrot'];
const ANIMAL_EMOJI = {
  Fox:'🦊', Owl:'🦉', Bear:'🐻', Otter:'🦦', Panda:'🐼', Tiger:'🐯', Turtle:'🐢', Koala:'🐨', Dolphin:'🐬', Hedgehog:'🦔',
  Penguin:'🐧', Lion:'🦁', Zebra:'🦓', Giraffe:'🦒', Whale:'🐋', Bee:'🐝', Butterfly:'🦋', Rabbit:'🐰', Wolf:'🐺', Cat:'🐱', Dog:'🐶', Parrot:'🦜'
};
const COLORS = ['#ffadad','#ffd6a5','#fdffb6','#caffbf','#9bf6ff','#a0c4ff','#bdb2ff','#ffc6ff','#f1f2f6','#dfe7fd','#ffeaa7','#fab1a0'];

function hashToIndex(num, modulo){ return Math.abs((num * 2654435761) % 2147483647) % modulo; }

function getAnonIdentity(userId){
  const key = `profile.${userId}`;
  const saved = localStorage.getItem(key);
  if(saved){ try{ const p = JSON.parse(saved); return { animal: ANIMALS[p.animalIdx]||ANIMALS[0], color: COLORS[p.colorIdx]||COLORS[0], emoji: ANIMAL_EMOJI[ANIMALS[p.animalIdx]||ANIMALS[0]] }; }catch{} }
  const a = ANIMALS[hashToIndex(userId+17, ANIMALS.length)];
  const c = COLORS[hashToIndex(userId+71, COLORS.length)];
  return { animal: a, color: c, emoji: ANIMAL_EMOJI[a] };
}

function h(strings,...vals){
  return strings.reduce((acc,s,i)=>acc + s + (vals[i]??''),'');
}

function render(container, html){
  container.innerHTML = html;
}

function stars(n){
  return '★'.repeat(n) + '☆'.repeat(Math.max(0,5-n));
}

function badgePill(b){
  return `<span class="badge">${b.name}</span>`;
}

function computeStreak(logs){
  const days = new Set(
    logs.filter(l=>l.status==='approved').map(l=>l.logged_at)
  );
  let streak = 0;
  let d = new Date();
  for(;;){
    const iso = d.toISOString().slice(0,10);
    if(days.has(iso)){
      streak += 1;
      d.setDate(d.getDate()-1);
    }else{
      break;
    }
  }
  return streak;
}

// Timer state (per session)
let timerState = { running: false, startedAt: null, intervalId: null };

async function renderApp(){
  const { user } = await api.me();
  const app = document.getElementById('app');
  const login = document.getElementById('login');
  if(!user){
    app.style.display='none';
    login.style.display='block';
    return;
  }
  login.style.display='none';
  app.style.display='block';

  if(user.role==='student'){
    const [summary, logs, classSum] = await Promise.all([
      api.studentSummary(user.id),
      api.myLogs(),
      api.classSummary(user.class_id)
    ]);
    const streak = computeStreak(logs.logs);
    const meIdentity = getAnonIdentity(user.id);
    const classmates = classSum.perStudent.filter(s=>s.studentId!==user.id).map(s=>({ id:s.studentId, ident:getAnonIdentity(s.studentId) }));
    const todayIso = new Date().toISOString().slice(0,10);
    render(app, h`
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div>
            <div class="stat">${summary.stars} <span class="stars">${'★'.repeat(Math.min(5,summary.stars))}</span></div>
            <div class="muted">${summary.totalMinutes} minutes</div>
            <div class="muted">Streak: ${streak} day${streak===1?'':'s'}</div>
            <div style="margin-top:8px">${summary.badges.map(badgePill).join('')}</div>
          </div>
          <div class="profile">
            <div class="avatar" style="background:${meIdentity.color}">${meIdentity.emoji}</div>
            <button id="editProfile" class="secondary">Pick Animal + Color</button>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Big Start</h3>
        <div class="row">
          <div id="timerDisplay" class="timer-display">00:00</div>
          <button id="timerToggle" class="big-start">${timerState.running?'Stop':'Start'}</button>
          <button id="saveTimer" class="secondary" ${timerState.running?'disabled':''}>Save as Log</button>
          <span class="muted">Today: ${todayIso}</span>
        </div>
      </div>
      <div class="card">
        <h3>Quick Add</h3>
        <div class="row">
          <input id="minutes" type="number" min="0" placeholder="minutes" />
          <input id="date" type="date" />
          <input id="note" placeholder="note (optional)" />
          <button id="addLog">Add</button>
        </div>
      </div>
      <div class="card">
        <h3>Class Goal</h3>
        <div class="row" style="justify-content:space-between">
          <div style="min-width:260px">
            ${classSum.goalProgress ? h`
              <div class="muted">Goal: ${classSum.goalProgress.goal.target_minutes} minutes</div>
              <div class="progress"><div style="width:${classSum.goalProgress.percentage}%"></div></div>
              <div class="muted">${classSum.goalProgress.percentage}%</div>
            `: h`<div class="muted">No class goal set</div>`}
          </div>
          <div class="avatars">
            <div class="avatar" title="You" style="background:${meIdentity.color}">${meIdentity.emoji}</div>
            ${classmates.map(c=>`<div class="avatar" title="Classmate" style="background:${c.ident.color}">${c.ident.emoji}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <h3>My Logs</h3>
        <table class="table">
          <thead><tr><th>Date</th><th>Minutes</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            ${logs.logs.map(l=>`<tr><td>${l.logged_at}</td><td>${l.minutes}</td><td>${l.status}</td><td>${l.note??''}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);
    // Profile picker
    document.getElementById('editProfile').onclick = () => {
      const a = prompt(`Pick animal (0-${ANIMALS.length-1}):\n`+ANIMALS.map((n,i)=>`${i}: ${ANIMAL_EMOJI[n]} ${n}`).join('\n'), '0');
      if(a==null) return;
      const c = prompt(`Pick color (0-${COLORS.length-1}):`, '0');
      if(c==null) return;
      localStorage.setItem(`profile.${user.id}`, JSON.stringify({ animalIdx: Math.max(0,Math.min(ANIMALS.length-1, Number(a)||0)), colorIdx: Math.max(0,Math.min(COLORS.length-1, Number(c)||0)) }));
      renderApp();
    };
    // Timer handlers
    const display = document.getElementById('timerDisplay');
    function updateDisplay(){
      if(!timerState.startedAt){ display.textContent = '00:00'; return; }
      const ms = Date.now() - timerState.startedAt;
      const mm = Math.floor(ms/60000);
      const ss = Math.floor((ms%60000)/1000);
      display.textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    }
    updateDisplay();
    if(timerState.running && !timerState.intervalId){ timerState.intervalId = setInterval(updateDisplay, 500); }
    document.getElementById('timerToggle').onclick = () => {
      if(!timerState.running){
        timerState.running = true; timerState.startedAt = Date.now(); timerState.intervalId = setInterval(updateDisplay, 500); renderApp();
      } else {
        timerState.running = false; clearInterval(timerState.intervalId); timerState.intervalId = null; renderApp();
      }
    };
    document.getElementById('saveTimer').onclick = async () => {
      if(timerState.running) return;
      if(!timerState.startedAt){ alert('Start the timer first'); return; }
      const minutes = Math.max(1, Math.round((Date.now()-timerState.startedAt)/60000));
      await api.createLog({ minutes, loggedAt: todayIso, note: 'Timer' });
      timerState = { running:false, startedAt:null, intervalId:null };
      renderApp();
    };
    // Quick add
    document.getElementById('addLog').onclick = async () => {
      const minutes = Number(document.getElementById('minutes').value || '0');
      const loggedAt = document.getElementById('date').value;
      const note = document.getElementById('note').value;
      await api.createLog({ minutes, loggedAt, note });
      renderApp();
    };
  }

  if(user.role==='parent'){
    const logs = await api.myLogs();
    const byStudent = {};
    for(const l of logs.logs){ byStudent[l.student_id] = byStudent[l.student_id] || []; byStudent[l.student_id].push(l); }
    const studentIds = Object.keys(byStudent).map(Number);
    const summaries = await Promise.all(studentIds.map(id => api.studentSummary(id)));
    const familyMinutes = summaries.reduce((sum,s)=>sum + s.totalMinutes, 0);
    const rewardsKey = `rewards.${user.id}`;
    const rewards = JSON.parse(localStorage.getItem(rewardsKey) || '[]');
    const pinKey = `pin.${user.id}`;
    let unlocked = sessionStorage.getItem(`pin.unlocked.${user.id}`) === '1';
    render(app, h`
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3>Children</h3>
          <div class="row">
            <button id="pinBtn" class="secondary">${unlocked?'Lock':'Unlock'} (PIN)</button>
          </div>
        </div>
        <div class="grid">
          ${summaries.map(s => h`<div class="card"><strong>${s.student.name}</strong><div>${s.totalMinutes} min · ${s.stars} stars</div><div>${s.badges.map(badgePill).join('')}</div>
            <div class="row" style="margin-top:8px"><input id="m-${s.student.id}" type="number" placeholder="minutes" /><input id="d-${s.student.id}" type="date" /><button data-sid="${s.student.id}" class="addLogChild">Add</button></div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3>Approve / Edit Logs</h3>
        <table class="table"><thead><tr><th>Student</th><th>Date</th><th>Minutes</th><th>Status</th><th>Action</th></tr></thead><tbody>
          ${logs.logs.map(l=>{
            const s = summaries.find(s=>s.student.id===l.student_id);
            const actions = l.status==='pending' ? h`
              <button class="small approve" data-id="${l.id}" ${!unlocked?'disabled':''}>Approve</button>
              <button class="small reject" data-id="${l.id}" ${!unlocked?'disabled':''}>Reject</button>
              <button class="small edit" data-id="${l.id}" ${!unlocked?'disabled':''}>Edit</button>
            ` : '';
            return `<tr><td>${s?.student.name||l.student_id}</td><td>${l.logged_at}</td><td>${l.minutes}</td><td>${l.status}</td><td>${actions}</td></tr>`;
          }).join('')}
        </tbody></table>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between; align-items:baseline">
          <h3>Family Rewards</h3>
          <div class="muted">Family minutes: ${familyMinutes}</div>
        </div>
        <div id="rewardsList">${rewards.map((r,i)=>h`<div class="row reward-item">
          <input type="checkbox" data-idx="${i}" class="reward-claim" ${r.claimed?'checked':''} ${!unlocked?'disabled':''} />
          <div>${r.text}</div>
          <div class="muted">Target: ${r.targetMinutes} min</div>
        </div>`).join('')}</div>
        <div class="row" style="margin-top:8px">
          <input id="rewardText" placeholder="e.g., Movie Night" />
          <input id="rewardTarget" type="number" placeholder="target minutes" />
          <button id="addReward">Add Reward</button>
        </div>
      </div>
    `);
    // PIN
    document.getElementById('pinBtn').onclick = () => {
      const existing = localStorage.getItem(pinKey);
      if(!existing){
        const p = prompt('Set a 4-digit PIN');
        if(p && /^\d{4}$/.test(p)){ localStorage.setItem(pinKey, p); alert('PIN set'); }
        else { alert('PIN must be 4 digits'); }
      } else if(!unlocked){
        const p = prompt('Enter PIN');
        if(p===existing){ sessionStorage.setItem(`pin.unlocked.${user.id}`,'1'); unlocked = true; renderApp(); }
        else { alert('Wrong PIN'); }
      } else {
        sessionStorage.removeItem(`pin.unlocked.${user.id}`); unlocked = false; renderApp();
      }
    };
    // Rewards handlers
    document.getElementById('addReward').onclick = () => {
      const text = document.getElementById('rewardText').value.trim();
      const target = Number(document.getElementById('rewardTarget').value||'0');
      if(!text || target<=0) return alert('Enter reward and target minutes');
      rewards.push({ text, targetMinutes: target, claimed:false });
      localStorage.setItem(rewardsKey, JSON.stringify(rewards));
      renderApp();
    };
    document.querySelectorAll('.reward-claim').forEach(cb=>cb.onchange = () => {
      const idx = Number(cb.getAttribute('data-idx'));
      rewards[idx].claimed = cb.checked;
      localStorage.setItem(rewardsKey, JSON.stringify(rewards));
    });
    // Add child log
    document.querySelectorAll('.addLogChild').forEach(btn=>{
      btn.onclick = async () => {
        const sid = Number(btn.getAttribute('data-sid'));
        const minutes = Number(document.getElementById(`m-${sid}`).value || '0');
        const loggedAt = document.getElementById(`d-${sid}`).value;
        await api.createLog({ minutes, loggedAt, studentId: sid });
        renderApp();
      };
    });
    // Approve/Reject/Edit
    document.querySelectorAll('button.approve').forEach(b=>b.onclick = async () => { await api.approveLog(b.getAttribute('data-id'),'approved'); renderApp(); });
    document.querySelectorAll('button.reject').forEach(b=>b.onclick = async () => { await api.approveLog(b.getAttribute('data-id'),'rejected'); renderApp(); });
    document.querySelectorAll('button.edit').forEach(b=>b.onclick = async () => {
      const id = b.getAttribute('data-id');
      const minutes = prompt('New minutes:');
      const date = prompt('New date (YYYY-MM-DD):');
      await fetch(`/api/logs/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json','x-user-id':localStorage.getItem('token') }, body: JSON.stringify({ minutes: minutes? Number(minutes): undefined, loggedAt: date||undefined }) });
      renderApp();
    });
  }

  if(user.role==='teacher'){
    const classSum = await api.classSummary(user.class_id);
    const logs = await api.myLogs();
    render(app, h`
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div>
            <div class="stat">Class Minutes: ${classSum.totalMinutes}</div>
            <div class="muted">Class Stars: ${classSum.stars}</div>
          </div>
          ${classSum.goalProgress ? h`<div style="min-width:260px">
            <div class="muted">Goal: ${classSum.goalProgress.goal.target_minutes} minutes</div>
            <div class="progress"><div style="width:${classSum.goalProgress.percentage}%"></div></div>
            <div class="muted">${classSum.goalProgress.percentage}%</div>
          </div>`:''}
        </div>
      </div>
      <div class="card">
        <h3>Teams</h3>
        <div class="grid">
          ${classSum.perTeam.map(t=>{
            const teamStudents = classSum.perStudent.filter(s=>s.teamId===t.teamId);
            return h`<div class="card"><strong>${t.teamName}</strong>
              <div>${t.totalMinutes} min · ${t.stars} stars</div>
              <div class="avatars" style="margin-top:6px">${teamStudents.slice(0,20).map(s=>{
                const ident = getAnonIdentity(s.studentId);
                return `<div class="avatar" title="${ident.animal}" style="background:${ident.color}">${ident.emoji}</div>`;
              }).join('')}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <h3>Approve Logs</h3>
        <table class="table"><thead><tr><th>Student</th><th>Date</th><th>Minutes</th><th>Status</th><th>Action</th></tr></thead><tbody>
          ${logs.logs.map(l=>{
            const student = classSum.perStudent.find(s=>s.studentId===l.student_id);
            return `<tr><td>${student?.name||l.student_id}</td><td>${l.logged_at}</td><td>${l.minutes}</td><td>${l.status}</td><td>`+
              (l.status==='pending'?`<button class="approve" data-id="${l.id}">Approve</button> <button class="reject" data-id="${l.id}">Reject</button>`:'')+
            `</td></tr>`;
          }).join('')}
        </tbody></table>
      </div>
    `);
    document.querySelectorAll('button.approve').forEach(b=>b.onclick = async () => { await api.approveLog(b.getAttribute('data-id'),'approved'); renderApp(); });
    document.querySelectorAll('button.reject').forEach(b=>b.onclick = async () => { await api.approveLog(b.getAttribute('data-id'),'rejected'); renderApp(); });
  }

  const header = document.createElement('div');
  header.className='row';
  header.style.marginBottom='12px';
  header.innerHTML = h`<div class="card" style="width:100%"><div class="row" style="justify-content:space-between"><div>
    <strong>${user.name}</strong> <span class="muted">(${user.role})</span>
  </div><div class="row"><button id="logout" class="secondary">Logout</button></div></div></div>`;
  app.prepend(header);
  document.getElementById('logout').onclick = () => { localStorage.removeItem('token'); renderApp(); };
}

document.getElementById('loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const username = fd.get('username');
  const password = fd.get('password');
  try{
    const { token } = await api.login(username, password);
    localStorage.setItem('token', token);
    renderApp();
  }catch(err){ alert('Login failed'); }
});

renderApp();

