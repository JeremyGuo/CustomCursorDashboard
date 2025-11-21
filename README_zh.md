# Custom Dashboard Framework

中文 | [English Documentation](README.md)

基于 Node.js + TypeScript 的现代化前端服务框架，采用 Apple 风格扁平设计，内置用户注册审批、权限管理、路由校验与 API 代理能力，帮助团队在 `services/*` 目录敏捷迭代各类业务页面。

## 核心能力

- 🎨 **现代化 UI**：顶部导航栏 + 服务标签切换，隐藏不常用元素，Apple 风格极简设计。
- 🔐 **注册审批**：用户提交注册申请，管理员审批后方可创建账号，支持密码修改。
- 🛡️ **权限管理**：JWT + 角色 + 服务授权三层控制，独立的用户/权限/服务管理面板。
- 🗺️ **路由管控**：访问 `/{serviceId}` 前自动校验权限，并注入上下文至前端。
- 🔌 **API 代理**：前端调用 `/{serviceId}/api/**` 时自动转发到 `API_PROXY_TARGET` 或服务自定义地址。
- 📚 **敏捷协作**：每个服务自带 `API_DOCUMENT.md / PLAN.md / WORKBLOOK.md`，`.cursorrules` 约束开发流程。

## 快速开始

```bash
cp .env.example .env
npm install
npm run build:services   # 初次构建所有服务前端
npm run dev
```

访问 `http://localhost:3100/app`，默认管理员账号：`admin / admin123`。

普通用户需提交注册申请，由管理员在"管理面板 > 注册审批"中通过后方可登录。

## 完整功能说明

### 1. 🎨 现代化 UI 设计

- **Apple 风格**：扁平设计、圆角、毛玻璃效果、极简留白
- **顶部导航栏**：品牌 Logo + 服务标签 + 用户菜单
- **响应式设计**：适配桌面和移动设备
- **配色方案**：#1d1d1f (深色) / #f5f5f7 (浅色) / #007aff (主色)

### 2. 🔐 用户认证与权限

- **注册审批流程**：
  - 用户提交注册申请
  - 管理员审批后创建账号
  - 支持拒绝并填写原因
- **JWT 认证**：Token + HttpOnly Cookie 双重保护
- **三层权限控制**：
  - 用户角色 (roles)
  - 服务授权 (services)
  - 管理员权限 (admin)
- **密码管理**：
  - 用户自助修改密码
  - 验证当前密码
  - 最小长度 6 位

### 3. 👥 用户管理

- **查看所有用户**：显示用户名、角色、服务权限
- **编辑用户权限**：模态表单编辑角色和服务
- **删除用户**：带确认提示
- **安全保护**：
  - ✅ 管理员不能删除自己
  - ✅ 管理员不能修改自己的权限

### 4. 📋 注册审批

- **待审批列表**：显示用户名、申请时间
- **通过申请**：自动创建用户账号
- **拒绝申请**：可选填写拒绝原因
- **状态追踪**：pending / approved / rejected

### 5. ⚙️ 服务管理

- **查看所有服务**：从 `services/*/service.config.json` 自动加载
- **编辑服务配置**：
  - 服务名称
  - 描述
  - 要求角色（逗号分隔）
  - API 代理目标地址
  - API 代理重写路径
- **实时生效**：修改后自动更新配置文件

### 6. 🗺️ 路由与代理

- **权限校验**：访问 `/{serviceId}` 前自动验证权限
- **上下文注入**：将服务配置和用户信息注入到 `window.__SERVICE_CONTEXT__`
- **API 代理**：
  - 前端调用 `/{serviceId}/api/**`
  - 自动转发到配置的目标地址
  - 支持路径重写
  - 支持服务级别自定义目标

### 7. 📚 服务开发框架

- **目录结构**：
  ```
  services/
    example/
      service.config.json    # 服务配置
      public/index.html      # HTML 模板
      frontend/              # React/TS 代码
        main.tsx            # 入口文件
        App.tsx             # 主组件
        components/         # 自定义组件
      dist/                 # 构建产物
      API_DOCUMENT.md       # API 文档
      PLAN.md              # 业务目标
      WORKBLOOK.md         # 实现进度
  ```
- **构建工具**：esbuild 快速打包
- **开发规范**：`.cursorrules` 约束 UI 风格和开发流程

## 目录结构

```
services/
  example/
    public/index.html   # 模板入口，包含 SERVICE_CONTEXT 占位符
    frontend/           # TypeScript/React 代码
    dist/               # esbuild 产物（自动生成）
    API_DOCUMENT.md
    PLAN.md
    WORKBLOOK.md
```

## 新增服务流程

1. 复制 `services/example` 作为模板，更名为 `services/<serviceId>`。
2. 更新 `service.config.json`：
   - `requiredRoles`、`proxyRewrite`、`proxyTarget`。
3. **使用 Cursor 实现服务**：配置完必要的内容后，让 Cursor 实现服务逻辑。Cursor 会遵循 `.cursorrules` 规范，在 `frontend/` 目录下创建前端代码。
4. `npm run build:services` 生成 `dist/main.js`。
5. 确保页面引入 `/public/global.css` 并遵守 `.cursorrules` UI 规范，特别是 `WORKBLOOK.md` 及时记录。

> 控制台位于 `public/app.html`，包含登录/注册、服务授权、导航栏与 iframe 工作区，服务页面在其中渲染。禁止在各服务重复实现外壳 UI。

## API 端点

### 认证与用户

- `POST /auth/register` - 提交注册申请
- `POST /auth/login` - 登录
- `GET /auth/me` - 获取当前用户信息
- `POST /auth/change-password` - 修改密码

### 管理员

- `GET /admin/users` - 用户列表
- `PATCH /admin/users/:id` - 更新用户权限
- `DELETE /admin/users/:id` - 删除用户
- `GET /admin/registration-requests` - 注册申请列表
- `POST /admin/registration-requests/:id/approve` - 通过申请
- `POST /admin/registration-requests/:id/reject` - 拒绝申请
- `GET /admin/services` - 服务列表
- `PATCH /admin/services/:id` - 更新服务配置

### 服务

- `GET /api/services` - 可访问服务列表
- `GET /:serviceId` - 渲染服务页面
- `ALL /:serviceId/api/**` - API 代理转发
- `GET /api/services/:id/docs/{api|plan|workblook}` - 查看服务文档

## SERVICE_CONTEXT

服务器在渲染 `public/index.html` 时注入：

```json
{
  "service": {
    "id": "example",
    "name": "示例服务",
    "proxy": { "path": "/example/api", "rewrite": "/api" }
  },
  "user": { "username": "admin", "roles": ["admin"] }
}
```

前端可通过 `window.__SERVICE_CONTEXT__` 直接访问。

## 代理说明

- `/{service}/api/**` → `proxyTarget + proxyRewrite`（默认 `.env` 中 `API_PROXY_TARGET` + `/api`）。
- 服务级别 `proxyTarget` 可覆盖默认值，支持链接 SaaS 或本地微服务。

## UI 规范

### 颜色
- 主色：`#007aff` (悬浮: `#0051d5`)
- 文字：`#1d1d1f` (弱化: `#86868b`)
- 背景：`#f5f5f7`

### 字体
- 系统字体：`-apple-system, BlinkMacSystemFont, 'SF Pro Display'`
- 标题：20-48px，字重 600-700
- 正文：14-17px
- 辅助：13px

### 圆角
- 小组件：8-10px
- 卡片：12-16px
- 模态窗口：14-16px

### 间距
- 遵循 8px 倍数（8/16/24/32）
- 卡片内边距：16-24px
- 卡片外边距：12-16px

### 按钮规范
- 主按钮：`#007aff` 背景，悬浮 `#0051d5`
- 次要按钮：透明背景 + 边框
- 圆角：8-10px
- 字重：600

### 图标样式
- 纯线性或双色，避免拟物
- 自定义组件必须在 `services/xxx/frontend/components` 下实现且复用变量

## 管理面板使用流程

### 普通用户注册
1. 点击用户菜单 → "注册账号"
2. 填写用户名、密码
3. 提交申请，等待管理员审批

### 管理员审批
1. 登录管理员账号（`admin/admin123`）
2. 点击用户菜单 → "管理面板"
3. 切换到"注册审批"标签
4. 点击"通过"或"拒绝"

### 分配权限
1. 管理面板 → "用户管理"
2. 点击用户的"编辑"按钮
3. 修改角色/服务权限
4. 保存

### 修改密码
1. 点击用户菜单 → "修改密码"
2. 输入当前密码、新密码
3. 确认后保存

### 编辑服务配置
1. 管理面板 → "服务管理"
2. 点击服务的"编辑"按钮
3. 修改服务名称、描述、要求角色、API 代理等
4. 保存后自动更新配置文件

## 开发工作流

### 新增服务

1. 复制模板：
   ```bash
   cp -r services/example services/新服务名
   ```

2. 修改 `service.config.json`：
   ```json
   {
     "id": "新服务名",
     "name": "显示名称",
     "description": "服务描述",
     "entryHtml": "public/index.html",
     "entryScript": "dist/main.js",
     "requiredRoles": ["service:新服务名"],
     "proxyRewrite": "/api",
     "proxyTarget": "${API_PROXY_TARGET}"
   }
   ```

3. **使用 Cursor 实现服务**：配置完必要的内容后，让 Cursor 实现服务逻辑。Cursor 会遵循 `.cursorrules` 规范，在 `services/新服务名/frontend/` 目录下创建前端代码。

4. 构建：
   ```bash
   npm run build:services
   ```

5. 更新文档：
   - `API_DOCUMENT.md` - 接口说明
   - `PLAN.md` - 业务目标
   - `WORKBLOOK.md` - 实现进度

### 分配权限

管理员登录 → 管理面板 → 用户管理 → 编辑用户：
- 角色：`service:新服务名`（或者 `admin`）
- 服务：`新服务名`

## 安全特性

1. **JWT + HttpOnly Cookie**：双重 Token 保护
2. **权限校验中间件**：所有管理接口需要 admin 角色
3. **自我保护**：管理员不能删除/降权自己
4. **密码加密**：bcrypt 哈希存储
5. **iframe 沙箱**：限制服务页面权限

## 故障排查

### 服务不显示
1. 检查 `service.config.json` 格式
2. 运行 `npm run build:services`
3. 重启服务器
4. 硬刷新浏览器（Cmd+Shift+R）

### 没有权限访问
1. 确认用户角色包含所需角色
2. 或者在用户的 services 字段添加服务 ID
3. 管理员账号可以访问所有服务

### API 代理不工作
1. 检查 `proxyTarget` 是否正确
2. 确认目标服务已启动
3. 查看服务器日志排查错误

## 特色功能

- ✅ 零配置服务注册（自动扫描 services 目录）
- ✅ 热更新服务配置（管理面板直接编辑）
- ✅ 注册审批流程（防止恶意注册）
- ✅ 权限精细控制（角色 + 服务双重验证）
- ✅ 现代化 UI（Apple 风格设计）
- ✅ 敏捷开发规范（.cursorrules 约束）
- ✅ 完整的管理面板（用户/审批/服务三合一）

## ROADMAP

- ✅ 框架 MVP
- 🔜 CLI 初始化脚手架
- 🔜 Session 驱动 SSO
