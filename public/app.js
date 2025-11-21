const state = {
  token: localStorage.getItem('cd_token'),
  user: null,
  services: [],
  activeService: null,
};

const els = {
  userMenuBtn: document.querySelector('#user-menu-btn'),
  userMenu: document.querySelector('#user-menu'),
  userMenuInfo: document.querySelector('#user-menu-info'),
  userAvatar: document.querySelector('#user-avatar'),
  loginForm: document.querySelector('#login-form'),
  registerForm: document.querySelector('#register-form'),
  registerModal: document.querySelector('#register-modal'),
  showRegisterBtn: document.querySelector('#show-register-btn'),
  showChangePasswordBtn: document.querySelector('#show-change-password-btn'),
  showAdminBtn: document.querySelector('#show-admin-btn'),
  adminModal: document.querySelector('#admin-modal'),
  changePasswordModal: document.querySelector('#change-password-modal'),
  logoutBtn: document.querySelector('#logout-btn'),
  serviceTabs: document.querySelector('#service-tabs'),
  welcomeScreen: document.querySelector('#welcome-screen'),
  serviceFrame: document.querySelector('#service-frame'),
  toast: document.querySelector('#toast'),
};

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  els.toast.classList.add('show');
  setTimeout(() => {
    els.toast.classList.remove('show');
    setTimeout(() => els.toast.classList.add('hidden'), 300);
  }, 2500);
}

function setToken(token) {
  state.token = token;
  if (token) {
    localStorage.setItem('cd_token', token);
  } else {
    localStorage.removeItem('cd_token');
  }
}

async function request(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  if (res.status === 401) {
    setToken(null);
    state.user = null;
    renderUserMenu();
    throw new Error('未认证或会话已过期');
  }
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = (data && data.message) || res.statusText || '请求失败';
    throw new Error(message);
  }
  return data;
}

function renderUserMenu() {
  if (state.user) {
    if (els.userMenuInfo) {
      els.userMenuInfo.innerHTML = `
        <strong>${state.user.username}</strong>
        <small style="color: #86868b;">${state.user.roles?.join(', ') || '无角色'}</small>
      `;
    }
    if (els.userAvatar) {
      els.userAvatar.textContent = state.user.username.charAt(0).toUpperCase();
    }
    if (els.loginForm) els.loginForm.classList.add('hidden');
    if (els.showRegisterBtn) els.showRegisterBtn.classList.add('hidden');
    if (els.showChangePasswordBtn) els.showChangePasswordBtn.classList.remove('hidden');
    if (els.logoutBtn) els.logoutBtn.classList.remove('hidden');
    if (state.user.roles?.includes('admin')) {
      if (els.showAdminBtn) els.showAdminBtn.classList.remove('hidden');
    } else {
      if (els.showAdminBtn) els.showAdminBtn.classList.add('hidden');
    }
  } else {
    if (els.userMenuInfo) els.userMenuInfo.textContent = '未登录';
    if (els.userAvatar) els.userAvatar.textContent = '?';
    if (els.loginForm) els.loginForm.classList.remove('hidden');
    if (els.showRegisterBtn) els.showRegisterBtn.classList.remove('hidden');
    if (els.showChangePasswordBtn) els.showChangePasswordBtn.classList.add('hidden');
    if (els.showAdminBtn) els.showAdminBtn.classList.add('hidden');
    if (els.logoutBtn) els.logoutBtn.classList.add('hidden');
  }
}

function renderServiceTabs() {
  if (!els.serviceTabs) return;
  els.serviceTabs.innerHTML = '';
  state.services.forEach((service) => {
    const tab = document.createElement('button');
    tab.className = 'service-tab' + (state.activeService === service.id ? ' active' : '');
    tab.textContent = service.name || service.id;
    tab.addEventListener('click', () => selectService(service.id));
    els.serviceTabs.appendChild(tab);
  });
}

function selectService(serviceId) {
  state.activeService = serviceId;
  if (els.welcomeScreen) els.welcomeScreen.classList.add('hidden');
  if (els.serviceFrame) {
    els.serviceFrame.src = `/${serviceId}`;
    els.serviceFrame.classList.remove('hidden');
  }
  renderServiceTabs();
}

async function hydrateSession() {
  if (!state.token) return;
  try {
    const data = await request('/auth/me');
    state.user = data.user;
    renderUserMenu();
    await loadServices();
  } catch (error) {
    console.warn(error);
    showToast('会话无效，请重新登录');
  }
}

async function loadServices() {
  if (!state.token) return;
  try {
    const data = await request('/api/services');
    state.services = data.services || [];
    renderServiceTabs();
    if (state.services.length > 0 && !state.activeService) {
      selectService(state.services[0].id);
    }
  } catch (error) {
    console.error(error);
    showToast('加载服务列表失败');
  }
}

async function loadAdminData(tab) {
  if (!state.token || !state.user?.roles?.includes('admin')) return;
  const usersList = document.querySelector('#users-list');
  const requestsList = document.querySelector('#requests-list');
  const servicesList = document.querySelector('#services-admin-list');

  try {
    if (tab === 'users' && usersList) {
      const data = await request('/admin/users');
      usersList.innerHTML = '';
      (data.users || []).forEach((user) => {
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
          <div class="data-item-info">
            <strong>${user.username}</strong>
            <small>角色: ${user.roles?.join(', ') || '无'} | 服务: ${user.services?.join(', ') || '无'}</small>
          </div>
          <div class="data-item-actions">
            <button onclick="editUser('${user.id}')">编辑</button>
            <button class="danger" onclick="deleteUser('${user.id}')">删除</button>
          </div>
        `;
        usersList.appendChild(item);
      });
    }

    if (tab === 'requests' && requestsList) {
      const data = await request('/admin/registration-requests');
      requestsList.innerHTML = '';
      const pending = (data.requests || []).filter((r) => r.status === 'pending');
      if (pending.length === 0) {
        requestsList.innerHTML = '<p style="color: #86868b;">暂无待审批申请</p>';
        return;
      }
      pending.forEach((req) => {
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
          <div class="data-item-info">
            <strong>${req.username}</strong>
            <small>申请时间: ${new Date(req.createdAt).toLocaleString()}</small>
          </div>
          <div class="data-item-actions">
            <button onclick="approveRequest('${req.id}')">通过</button>
            <button class="danger" onclick="rejectRequest('${req.id}')">拒绝</button>
          </div>
        `;
        requestsList.appendChild(item);
      });
    }

    if (tab === 'services' && servicesList) {
      const data = await request('/admin/services');
      servicesList.innerHTML = '';
      const services = data.services || [];
      if (services.length === 0) {
        servicesList.innerHTML = '<p style="color: #86868b;">暂无已注册服务</p>';
        return;
      }
      services.forEach((service) => {
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
          <div class="data-item-info">
            <strong>${service.name || service.id}</strong>
            <small>${service.description || '无描述'} | 要求角色: ${(service.requiredRoles || []).join(', ') || '无'}</small>
          </div>
          <div class="data-item-actions">
            <button onclick="editService('${service.id}')">编辑</button>
          </div>
        `;
        servicesList.appendChild(item);
      });
    }
  } catch (error) {
    console.error(error);
    showToast('加载管理数据失败');
  }
}

window.editUser = async (userId) => {
  try {
    const data = await request('/admin/users');
    const user = data.users.find((u) => u.id === userId);
    if (!user) {
      showToast('用户不存在');
      return;
    }
    
    const modal = document.querySelector('#edit-user-modal');
    const form = document.querySelector('#edit-user-form');
    if (!modal || !form) return;
    
    form.querySelector('[name="userId"]').value = user.id;
    form.querySelector('[name="username"]').value = user.username;
    form.querySelector('[name="roles"]').value = (user.roles || []).join(', ');
    form.querySelector('[name="services"]').value = (user.services || []).join(', ');
    
    modal.classList.remove('hidden');
  } catch (error) {
    showToast(error.message || '加载用户信息失败');
  }
};

window.deleteUser = async (userId) => {
  if (!confirm('确定删除该用户？')) return;
  try {
    await request('/admin/users/' + userId, { method: 'DELETE' });
    showToast('用户已删除');
    loadAdminData('users');
  } catch (error) {
    showToast(error.message);
  }
};

window.approveRequest = async (requestId) => {
  try {
    await request('/admin/registration-requests/' + requestId + '/approve', { method: 'POST' });
    showToast('申请已通过');
    loadAdminData('requests');
  } catch (error) {
    showToast(error.message);
  }
};

window.rejectRequest = async (requestId) => {
  const reason = prompt('拒绝原因（可选）');
  try {
    await request('/admin/registration-requests/' + requestId + '/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    showToast('申请已拒绝');
    loadAdminData('requests');
  } catch (error) {
    showToast(error.message);
  }
};

window.editService = async (serviceId) => {
  try {
    const data = await request('/admin/services');
    const service = data.services.find((s) => s.id === serviceId);
    if (!service) {
      showToast('服务不存在');
      return;
    }
    
    const modal = document.querySelector('#edit-service-modal');
    const form = document.querySelector('#edit-service-form');
    if (!modal || !form) return;
    
    form.querySelector('[name="serviceId"]').value = service.id;
    form.querySelector('[name="id"]').value = service.id;
    form.querySelector('[name="name"]').value = service.name || '';
    form.querySelector('[name="description"]').value = service.description || '';
    form.querySelector('[name="requiredRoles"]').value = (service.requiredRoles || []).join(', ');
    form.querySelector('[name="proxyTarget"]').value = service.proxyTarget || '';
    form.querySelector('[name="proxyRewrite"]').value = service.proxyRewrite || '';
    
    modal.classList.remove('hidden');
  } catch (error) {
    showToast(error.message || '加载服务信息失败');
  }
};

function bindEvents() {
  const editUserForm = document.querySelector('#edit-user-form');
  if (editUserForm) {
    editUserForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const userId = formData.get('userId');
      const roles = formData.get('roles');
      const services = formData.get('services');
      
      try {
        await request('/admin/users/' + userId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roles: roles ? roles.split(',').map((r) => r.trim()).filter(Boolean) : [],
            services: services ? services.split(',').map((s) => s.trim()).filter(Boolean) : [],
          }),
        });
        showToast('用户已更新');
        const modal = document.querySelector('#edit-user-modal');
        if (modal) modal.classList.add('hidden');
        loadAdminData('users');
      } catch (error) {
        showToast(error.message || '更新失败');
      }
    });
  }

  const editServiceForm = document.querySelector('#edit-service-form');
  if (editServiceForm) {
    editServiceForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const serviceId = formData.get('serviceId');
      const name = formData.get('name');
      const description = formData.get('description');
      const requiredRoles = formData.get('requiredRoles');
      const proxyTarget = formData.get('proxyTarget');
      const proxyRewrite = formData.get('proxyRewrite');
      
      try {
        await request('/admin/services/' + serviceId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            requiredRoles: requiredRoles ? requiredRoles.split(',').map((r) => r.trim()).filter(Boolean) : [],
            proxyTarget: proxyTarget || undefined,
            proxyRewrite: proxyRewrite || undefined,
          }),
        });
        showToast('服务配置已更新');
        const modal = document.querySelector('#edit-service-modal');
        if (modal) modal.classList.add('hidden');
        loadAdminData('services');
        await loadServices(); // 重新加载服务列表
      } catch (error) {
        showToast(error.message || '更新失败');
      }
    });
  }

  if (els.userMenuBtn) {
    els.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (els.userMenu) {
        els.userMenu.classList.toggle('hidden');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (els.userMenu && !els.userMenu.contains(e.target) && !els.userMenuBtn.contains(e.target)) {
      els.userMenu.classList.add('hidden');
    }
  });

  if (els.loginForm) {
    els.loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || '登录失败');
        setToken(data.token);
        state.user = data.user;
        renderUserMenu();
        await loadServices();
        showToast('登录成功');
        if (els.userMenu) els.userMenu.classList.add('hidden');
      } catch (error) {
        showToast(error.message || '登录失败');
      }
    });
  }

  if (els.showRegisterBtn) {
    els.showRegisterBtn.addEventListener('click', () => {
      if (els.userMenu) els.userMenu.classList.add('hidden');
      if (els.registerModal) els.registerModal.classList.remove('hidden');
    });
  }

  if (els.registerForm) {
    els.registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      try {
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || '注册失败');
        showToast('注册申请已提交，请等待审批');
        event.currentTarget.reset();
        if (els.registerModal) els.registerModal.classList.add('hidden');
      } catch (error) {
        showToast(error.message || '注册失败');
      }
    });
  }

  if (els.showChangePasswordBtn) {
    els.showChangePasswordBtn.addEventListener('click', () => {
      if (els.userMenu) els.userMenu.classList.add('hidden');
      if (els.changePasswordModal) els.changePasswordModal.classList.remove('hidden');
    });
  }

  if (els.showAdminBtn) {
    els.showAdminBtn.addEventListener('click', () => {
      if (els.userMenu) els.userMenu.classList.add('hidden');
      if (els.adminModal) els.adminModal.classList.remove('hidden');
      loadAdminData('users');
    });
  }

  const changePasswordForm = document.querySelector('#change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const oldPassword = formData.get('oldPassword');
      const newPassword = formData.get('newPassword');
      const confirmPassword = formData.get('confirmPassword');
      
      if (newPassword !== confirmPassword) {
        showToast('两次密码输入不一致');
        return;
      }
      
      try {
        await request('/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword }),
        });
        showToast('密码已更新');
        const modal = document.querySelector('#change-password-modal');
        if (modal) modal.classList.add('hidden');
        event.currentTarget.reset();
      } catch (error) {
        showToast(error.message || '修改密码失败');
      }
    });
  }

  if (els.logoutBtn) {
    els.logoutBtn.addEventListener('click', () => {
      setToken(null);
      state.user = null;
      state.services = [];
      state.activeService = null;
      if (els.serviceFrame) {
        els.serviceFrame.src = 'about:blank';
        els.serviceFrame.classList.add('hidden');
      }
      if (els.welcomeScreen) els.welcomeScreen.classList.remove('hidden');
      renderUserMenu();
      renderServiceTabs();
      showToast('已退出登录');
      if (els.userMenu) els.userMenu.classList.add('hidden');
    });
  }

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      const modal = document.querySelector(`#${modalId}`);
      if (modal) modal.classList.add('hidden');
    });
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
      const content = document.querySelector(`#tab-${tab}`);
      if (content) content.classList.add('active');
      loadAdminData(tab);
    });
  });
}

function init() {
  bindEvents();
  renderUserMenu();
  hydrateSession();
}

init();
