# Custom Dashboard Framework

[中文文档](README_zh.md) | English

A modern frontend service framework based on Node.js + TypeScript, featuring Apple-style flat design with built-in user registration approval, permission management, route validation, and API proxy capabilities. Helps teams rapidly iterate various business pages in the `services/*` directory.

## Core Features

- 🎨 **Modern UI**: Top navigation bar + service tab switching, hidden uncommon elements, Apple-style minimalist design.
- 🔐 **Registration Approval**: Users submit registration requests, accounts are created after admin approval, with password modification support.
- 🛡️ **Permission Management**: Three-layer control with JWT + roles + service authorization, independent user/permission/service management panel.
- 🗺️ **Route Control**: Automatically validates permissions before accessing `/{serviceId}` and injects context to the frontend.
- 🔌 **API Proxy**: Automatically forwards `/{serviceId}/api/**` requests to `API_PROXY_TARGET` or service-specific custom addresses.
- 📚 **Agile Collaboration**: Each service includes `API_DOCUMENT.md / PLAN.md / WORKBLOOK.md`, with `.cursorrules` constraining the development process.

## Quick Start

```bash
cp .env.example .env
npm install
npm run build:services   # Build all service frontends for the first time
npm run dev
```

Visit `http://localhost:3100/app`, default admin account: `admin / admin123`.

Regular users need to submit registration requests, which must be approved by administrators in "Admin Panel > Registration Approval" before they can log in.

## Complete Feature Documentation

### 1. 🎨 Modern UI Design

- **Apple Style**: Flat design, rounded corners, glassmorphism effects, minimalist spacing
- **Top Navigation Bar**: Brand logo + service tabs + user menu
- **Responsive Design**: Adapts to desktop and mobile devices
- **Color Scheme**: #1d1d1f (dark) / #f5f5f7 (light) / #007aff (primary)

### 2. 🔐 User Authentication & Permissions

- **Registration Approval Process**:
  - Users submit registration requests
  - Accounts created after admin approval
  - Support for rejection with reason
- **JWT Authentication**: Token + HttpOnly Cookie dual protection
- **Three-Layer Permission Control**:
  - User roles (roles)
  - Service authorization (services)
  - Admin permissions (admin)
- **Password Management**:
  - User self-service password modification
  - Current password verification
  - Minimum length 6 characters

### 3. 👥 User Management

- **View All Users**: Display username, roles, service permissions
- **Edit User Permissions**: Modal form to edit roles and services
- **Delete Users**: With confirmation prompt
- **Security Protection**:
  - ✅ Admins cannot delete themselves
  - ✅ Admins cannot modify their own permissions

### 4. 📋 Registration Approval

- **Pending Requests List**: Display username, request time
- **Approve Request**: Automatically create user account
- **Reject Request**: Optional rejection reason
- **Status Tracking**: pending / approved / rejected

### 5. ⚙️ Service Management

- **View All Services**: Automatically loaded from `services/*/service.config.json`
- **Edit Service Configuration**:
  - Service name
  - Description
  - Required roles (comma-separated)
  - API proxy target address
  - API proxy rewrite path
- **Real-time Effect**: Automatically updates configuration file after modification

### 6. 🗺️ Routes & Proxy

- **Permission Validation**: Automatically verifies permissions before accessing `/{serviceId}`
- **Context Injection**: Injects service configuration and user info into `window.__SERVICE_CONTEXT__`
- **API Proxy**:
  - Frontend calls `/{serviceId}/api/**`
  - Automatically forwards to configured target address
  - Supports path rewriting
  - Supports service-level custom targets

### 7. 📚 Service Development Framework

- **Directory Structure**:
  ```
  services/
    example/
      service.config.json    # Service configuration
      public/index.html      # HTML template
      frontend/              # React/TS code
        main.tsx            # Entry file
        App.tsx             # Main component
        components/         # Custom components
      dist/                 # Build output
      API_DOCUMENT.md       # API documentation
      PLAN.md              # Business goals
      WORKBLOOK.md         # Implementation progress
  ```
- **Build Tool**: esbuild for fast bundling
- **Development Standards**: `.cursorrules` constrains UI style and development process

## Directory Structure

```
services/
  example/
    public/index.html   # Template entry, contains SERVICE_CONTEXT placeholder
    frontend/           # TypeScript/React code
    dist/               # esbuild output (auto-generated)
    API_DOCUMENT.md
    PLAN.md
    WORKBLOOK.md
```

## Adding a New Service

1. Copy `services/example` as a template, rename to `services/<serviceId>`.
2. Update `service.config.json`:
   - `requiredRoles`, `proxyRewrite`, `proxyTarget`.
3. **Let Cursor implement the service**: After configuring the necessary content, use Cursor to implement the service logic. Cursor will follow the `.cursorrules` standards and create the frontend code in `frontend/` directory.
4. Run `npm run build:services` to generate `dist/main.js`.
5. Ensure pages import `/public/global.css` and follow `.cursorrules` UI standards, especially keep `WORKBLOOK.md` updated in time.

> The console is located at `public/app.html`, containing login/registration, service authorization, navigation bar, and iframe workspace where service pages are rendered. Do not duplicate shell UI in individual services.

## API Endpoints

### Authentication & User

- `POST /auth/register` - Submit registration request
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user info
- `POST /auth/change-password` - Change password

### Admin

- `GET /admin/users` - User list
- `PATCH /admin/users/:id` - Update user permissions
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/registration-requests` - Registration request list
- `POST /admin/registration-requests/:id/approve` - Approve request
- `POST /admin/registration-requests/:id/reject` - Reject request
- `GET /admin/services` - Service list
- `PATCH /admin/services/:id` - Update service configuration

### Services

- `GET /api/services` - List of accessible services
- `GET /:serviceId` - Render service page
- `ALL /:serviceId/api/**` - API proxy forwarding
- `GET /api/services/:id/docs/{api|plan|workblook}` - View service documentation

## SERVICE_CONTEXT

Injected by the server when rendering `public/index.html`:

```json
{
  "service": {
    "id": "example",
    "name": "Example Service",
    "proxy": { "path": "/example/api", "rewrite": "/api" }
  },
  "user": { "username": "admin", "roles": ["admin"] }
}
```

Frontend can access directly via `window.__SERVICE_CONTEXT__`.

## Proxy Configuration

- `/{service}/api/**` → `proxyTarget + proxyRewrite` (default `.env` `API_PROXY_TARGET` + `/api`).
- Service-level `proxyTarget` can override default value, supports linking to SaaS or local microservices.

## UI Standards

### Colors
- Primary: `#007aff` (hover: `#0051d5`)
- Text: `#1d1d1f` (muted: `#86868b`)
- Background: `#f5f5f7`

### Fonts
- System fonts: `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`
- Headings: 20-48px, weight 600-700
- Body: 14-17px
- Auxiliary: 13px

### Border Radius
- Small components: 8-10px
- Cards: 12-16px
- Modal windows: 14-16px

### Spacing
- Follow 8px multiples (8/16/24/32)
- Card padding: 16-24px
- Card margin: 12-16px

### Button Standards
- Primary button: `#007aff` background, hover `#0051d5`
- Secondary button: Transparent background + border
- Border radius: 8-10px
- Font weight: 600

### Icon Style
- Pure linear or two-tone, avoid skeuomorphic
- Custom components must be implemented in `services/xxx/frontend/components` and reuse variables

## Admin Panel Usage

### Regular User Registration
1. Click user menu → "Register Account"
2. Fill in username, password
3. Submit request, wait for admin approval

### Admin Approval
1. Login with admin account (`admin/admin123`)
2. Click user menu → "Admin Panel"
3. Switch to "Registration Approval" tab
4. Click "Approve" or "Reject"

### Assign Permissions
1. Admin Panel → "User Management"
2. Click user's "Edit" button
3. Modify roles/service permissions
4. Save

### Change Password
1. Click user menu → "Change Password"
2. Enter current password, new password
3. Confirm and save

### Edit Service Configuration
1. Admin Panel → "Service Management"
2. Click service's "Edit" button
3. Modify service name, description, required roles, API proxy, etc.
4. Save to automatically update configuration file

## Development Workflow

### Adding a New Service

1. Copy template:
   ```bash
   cp -r services/example services/new-service-name
   ```

2. Modify `service.config.json`:
   ```json
   {
     "id": "new-service-name",
     "name": "Display Name",
     "description": "Service description",
     "entryHtml": "public/index.html",
     "entryScript": "dist/main.js",
     "requiredRoles": ["service:new-service-name"],
     "proxyRewrite": "/api",
     "proxyTarget": "${API_PROXY_TARGET}"
   }
   ```

3. **Let Cursor implement the service**: After configuring the necessary content, use Cursor to implement the service logic. Cursor will follow the `.cursorrules` standards and create the frontend code in `services/new-service-name/frontend/`.

4. Build:
   ```bash
   npm run build:services
   ```

5. Update documentation:
   - `API_DOCUMENT.md` - API documentation
   - `PLAN.md` - Business goals
   - `WORKBLOOK.md` - Implementation progress

### Assign Permissions

Admin login → Admin Panel → User Management → Edit User:
- Roles: `service:new-service-name` (or `admin`)
- Services: `new-service-name`

## Security Features

1. **JWT + HttpOnly Cookie**: Dual token protection
2. **Permission Validation Middleware**: All admin endpoints require admin role
3. **Self-Protection**: Admins cannot delete/downgrade themselves
4. **Password Encryption**: bcrypt hash storage
5. **iframe Sandbox**: Limits service page permissions

## Troubleshooting

### Service Not Displaying
1. Check `service.config.json` format
2. Run `npm run build:services`
3. Restart server
4. Hard refresh browser (Cmd+Shift+R)

### No Permission to Access
1. Confirm user roles include required roles
2. Or add service ID to user's services field
3. Admin accounts can access all services

### API Proxy Not Working
1. Check if `proxyTarget` is correct
2. Confirm target service is running
3. Check server logs for errors

## Key Features

- ✅ Zero-config service registration (auto-scan services directory)
- ✅ Hot-update service configuration (edit directly in admin panel)
- ✅ Registration approval process (prevents malicious registration)
- ✅ Fine-grained permission control (role + service dual validation)
- ✅ Modern UI (Apple-style design)
- ✅ Agile development standards (.cursorrules constraints)
- ✅ Complete admin panel (user/approval/service three-in-one)

## ROADMAP

- ✅ Framework MVP
- 🔜 CLI initialization scaffold
- 🔜 Session-driven SSO

