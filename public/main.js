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
    const summary = await api.studentSummary(user.id);
    const logs = await api.myLogs();
    render(app, h`
      <div class="card">
        <div class="row">
          <div class="stat">${summary.stars} <span class="stars">${'★'.repeat(Math.min(5,summary.stars))}</span></div>
          <div class="muted">${summary.totalMinutes} minutes</div>
        </div>
        <div>${summary.badges.map(badgePill).join('')}</div>
      </div>
      <div class="card">
        <h3>Log Reading</h3>
        <div class="row">
          <input id="minutes" type="number" min="0" placeholder="minutes" />
          <input id="date" type="date" />
          <input id="note" placeholder="note (optional)" />
          <button id="addLog">Add</button>
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
    // Group by student
    const byStudent = {};
    for(const l of logs.logs){ byStudent[l.student_id] = byStudent[l.student_id] || []; byStudent[l.student_id].push(l); }
    const studentIds = Object.keys(byStudent).map(Number);
    const summaries = await Promise.all(studentIds.map(id => api.studentSummary(id)));
    render(app, h`
      <div class="card">
        <h3>Children</h3>
        <div class="grid">
          ${summaries.map(s => h`<div class="card"><strong>${s.student.name}</strong><div>${s.totalMinutes} min · ${s.stars} stars</div><div>${s.badges.map(badgePill).join('')}</div>
            <div class="row" style="margin-top:8px"><input id="m-${s.student.id}" type="number" placeholder="minutes" /><input id="d-${s.student.id}" type="date" /><button data-sid="${s.student.id}" class="addLogChild">Add</button></div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3>All Logs</h3>
        <table class="table"><thead><tr><th>Student</th><th>Date</th><th>Minutes</th><th>Status</th></tr></thead><tbody>
          ${logs.logs.map(l=>`<tr><td>${summaries.find(s=>s.student.id===l.student_id)?.student.name||l.student_id}</td><td>${l.logged_at}</td><td>${l.minutes}</td><td>${l.status}</td></tr>`).join('')}
        </tbody></table>
      </div>
    `);
    document.querySelectorAll('.addLogChild').forEach(btn=>{
      btn.onclick = async () => {
        const sid = Number(btn.getAttribute('data-sid'));
        const minutes = Number(document.getElementById(`m-${sid}`).value || '0');
        const loggedAt = document.getElementById(`d-${sid}`).value;
        await api.createLog({ minutes, loggedAt, studentId: sid });
        renderApp();
      };
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
          ${classSum.perTeam.map(t=>h`<div class="card"><strong>${t.teamName}</strong><div>${t.totalMinutes} min · ${t.stars} stars</div></div>`).join('')}
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

