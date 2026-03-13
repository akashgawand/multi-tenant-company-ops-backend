# RBAC Task Manager - Product Specification

## 1. Executive Summary

A lightweight, multi-tenant, role-based company operation system designed to serve multiple organizations of varying sizes (5-500+ people per tenant). The platform enables teams to organize work, assign tasks, manage attendance, handle leave requests, and maintain clear access controls through a simple but powerful role and permission system—all within isolated tenant environments.

**Vision:** Empower multiple independent organizations to collaborate efficiently with complete data isolation, clarity on who can do what, and minimal operational complexity.

---

## 2. Product Overview

### Purpose

Provide a multi-tenant SaaS platform for company operations management where multiple independent organizations can manage tasks, attendance, leave requests, and user access based on role-based permissions with complete data isolation.

### Target Users

- Small to medium startups (5-500+ people)
- Multiple independent organizations sharing a single platform
- Product teams, engineering teams, operations teams, HR departments
- Organizations that need basic access control, data isolation, and operational simplicity without enterprise complexity

### Core Principles

- **Simplicity**: Minimal features, maximum clarity
- **Clarity**: Clear visibility of who can do what
- **Flexibility**: Adaptable role and permission system

---

## 3. Core Features

### 3.1 Task Management

- **Create Tasks**: Team members create tasks with title, description, due date
- **Assign Tasks**: Assign tasks to team members (based on permissions)
- **Task Status**: Draft → In Progress → In Review → Completed
- **Task Details**: Description, assignee, due date, priority (Low/Medium/High), project/category

### 3.2 Role-Based Permissions

- **Predefined Roles**:
  - `Admin`: Full tenant access, user management, role management, attendance management, leave approval (within tenant)
  - `Manager`: Create tasks, assign tasks, view team tasks, manage team members, approve attendance, manage leave requests
  - `Member`: Create tasks, view assigned tasks, update own tasks, mark attendance, apply for leave
  - `Viewer`: Read-only access to assigned and public tasks, view own attendance and leave status

- **Granular Permissions**:
  - `task.create`, `task.read`, `task.update`, `task.delete`, `task.assign`, `task.approve`
  - `user.read`, `user.create`, `user.update`, `user.delete`
  - `role.manage`
  - `attendance.mark`, `attendance.view`, `attendance.edit`, `attendance.view_team`
  - `leave.apply`, `leave.approve`, `leave.view_team`, `leave.cancel`
  - `tenant.manage` (Super Admin only)

### 3.3 User Management (Admin/Manager)

- Invite team members via email (within tenant)
- Assign roles to users (within tenant)
- Deactivate users (soft delete)
- View team member list with roles and status
- All data isolated per tenant

### 3.3.1 Tenant Management (System Admin)

- Create and manage multiple tenant organizations
- Monitor tenant usage and activity
- Enable/disable tenants
- Configure tenant-specific settings

### 3.4 Dashboard & Views

- **Personal Dashboard**: My assigned tasks, upcoming deadlines, task statistics, attendance, leave balance
- **Team Board**: Kanban-style task view (Draft → In Progress → In Review → Done)
- **Task List View**: Filterable task list (by assignee, status, priority, due date)
- **Team Overview**: Member list with assigned task count and attendance status
- **Attendance Dashboard**: Team attendance records and attendance history
- **Leave Management**: Leave requests, approvals, team leave calendar
- All views isolated per tenant

### 3.5 Basic Notifications

- Task assigned to me
- Task marked complete (for assignee's manager)
- Task approval needed

---

## 4. Role & Permission Matrix

| Permission                 | Admin | Manager | Member | Viewer                  |
| -------------------------- | ----- | ------- | ------ | ----------------------- |
| View all tasks             | ✓     | ✓       | ✗      | Limited (only his onwn) |
| Create task                | ✓     | ✓       | ✓      | ✗                       |
| Update own task            | ✓     | ✓       | ✓      | ✗                       |
| Update others' tasks       | ✓     | ✓       | ✗      | ✗                       |
| Delete task                | ✓     | ✓ (own) | ✗      | ✗                       |
| Assign task                | ✓     | ✓       | ✗      | ✗                       |
| Approve task               | ✓     | ✓       | ✗      | ✗                       |
| Manage users               | ✓     | ✗       | ✗      | ✗                       |
| Manage roles & permissions | ✓     | ✗       | ✗      | ✗                       |
| Mark attendance (self)     | ✓     | ✓       | ✓      | ✓                       |
| View own attendance        | ✓     | ✓       | ✓      | ✓                       |
| View team attendance       | ✓     | ✓       | ✗      | ✗                       |
| Edit attendance record     | ✓     | ✓       | ✗      | ✗                       |
| Apply for leave            | ✓     | ✓       | ✓      | ✓                       |
| Approve / Reject leave     | ✓     | ✓       | ✗      | ✗                       |
| View team leave requests   | ✓     | ✓       | ✗      | ✗                       |
| Cancel own leave request   | ✓     | ✓       | ✓      | ✗                       |

---

## 5. User Stories

### As a Manager

- I want to assign tasks to my team members so they know what to work on
- I want to see which team members are overloaded with tasks
- I want to approve or reject completed tasks before marking them done
- I want to onboard new team members and assign them the appropriate role

### As a Team Member

- I want to see all tasks assigned to me in one place
- I want to update the status of my tasks as I progress
- I want to create tasks for myself or request tasks from my manager
- I want to see what my teammates are working on (if they're in my project)

### As a Tenant Admin

- I want to manage all users in my organization and assign them roles
- I want to manage attendance tracking for my team
- I want to approve or reject leave requests from my team members
- I want to maintain system integrity and ensure proper access controls within my tenant

### As a System Admin

- I want to create and manage multiple tenant organizations
- I want to monitor the platform's overall health and usage
- I want to manage system-wide roles and permissions
- I want to maintain data isolation between tenants

---

## 6. Data Models (Simplified)

### Tenant

- id, name, slug, status (active/inactive)
- created_at, updated_at

### User

- id, tenant_id, email, name, avatar_url, role_id
- status (active/inactive)
- created_at, updated_at

### Role

- id, tenant_id, name (Admin/Manager/Member/Viewer)
- description, is_system_defined (boolean)
- created_at, updated_at

### Permission

- id, name (e.g., task.create, user.delete, attendance.mark, leave.apply)
- description, category (task/user/role/attendance/leave)
- created_at, updated_at

### RolePermission (Join Table)

- role_id, permission_id

### Task

- id, tenant_id, title, description, status (draft/in_progress/in_review/completed)
- priority (low/medium/high)
- created_by_id, assigned_to_id
- due_date
- created_at, updated_at, completed_at

### Attendance

- id, tenant_id, user_id, date, status (present/absent/leave)
- created_at, updated_at

### Leave

- id, tenant_id, user_id, leave_type (sick/personal/vacation/other)
- start_date, end_date, status (applied/approved/rejected)
- reason, approved_by_id
- created_at, updated_at, approved_at

---

## 7. User Flows

### Flow 1: New User Onboarding

1. Admin invites user via email
2. User receives invitation link
3. User sets password and creates account
4. User's role is auto-assigned (default: Member)
5. User sees dashboard with onboarding guide

### Flow 2: Task Creation & Assignment

1. Manager/Member creates task with details
2. Manager assigns task to team member
3. Assignee gets notification
4. Assignee updates task in real-time
5. When done, manager approves (if required by role)

### Flow 3: Task Completion

1. Team member marks task as "In Review"
2. Manager/Approver reviews and approves
3. Task moved to "Completed"
4. Completion recorded with timestamp

---

## 8. Technical Stack (Recommended)

**Frontend:**

- React or Vue.js for UI
- State management (Redux/Vuex if needed)
- Responsive design (mobile-friendly)

**Backend:**

- Node.js with Express (or similar)
- Prisma ORM for database interactions
- JWT for authentication

**Database:**

- PostgreSQL (or MySQL/MongoDB)

**Deployment:**

- Vercel/Netlify for frontend
- Heroku/Railway/VPS for backend

---

## 9. Success Metrics

- **Adoption**: 80% of team uses system daily
- **Engagement**: Average 5+ tasks created per user per week
- **Performance**: Page load time < 2 seconds
- **Satisfaction**: NPS score > 40
- **Reliability**: 99.9% uptime

---

## 10. Non-Functional Requirements

### Security

- All endpoints protected by JWT authentication
- Permission checks on every API call
- Password hashing (bcrypt)
- HTTPS only
- Rate limiting to prevent abuse

### Performance

- Lazy load tasks (pagination)
- Cache frequently accessed data
- Optimize database queries with indexes

### Usability

- Mobile-responsive design
- Intuitive UI, minimal learning curve
- Dark/Light mode support

---

## 11. Future Enhancements

### Phase 2

- **Teams/Projects**: Organize tasks by teams or projects
- **Comments**: Add comments and mentions on tasks
- **File Attachments**: Attach files to tasks
- **Activity Log**: Track who did what and when
- **Email Notifications**: Daily digest of tasks

### Phase 3

- **Recurring Tasks**: Setup tasks that repeat
- **Task Dependencies**: Define task dependencies
- **Time Tracking**: Log hours spent on tasks
- **Custom Roles**: Create custom roles with flexible permissions
- **API**: Public API for integrations

### Phase 4

- **Integrations**: Slack, GitHub, Calendar integrations
- **Advanced Analytics**: Burndown charts, velocity tracking
- **Mobile App**: Native iOS/Android app

---

## 12. Constraints & Assumptions

**Constraints:**

- No real-time collaboration (async-first approach)
- Maximum 500 concurrent users per tenant in MVP
- Simple permission model (no hierarchical roles)
- Complete data isolation enforced at database level (all queries filtered by tenant_id)
- Each tenant operates independently with no cross-tenant visibility

**Assumptions:**

- All users have valid email addresses
- Each organization (tenant) manages user invitations independently
- Tenant namespaces are globally unique (slug-based)
- Tasks are text-based (no Gantt charts)
- Multi-tenant architecture supports unlimited tenants (platform level)
- Roles and permissions are pre-defined at system level but applied per tenant

---

## 13. Success Criteria for MVP

1. ✓ Users can sign up and log in
2. ✓ Admins can manage roles and users
3. ✓ Users can create and view assigned tasks
4. ✓ Managers can assign and approve tasks
5. ✓ Permission system works correctly (no unauthorized access)
6. ✓ Dashboard shows personalized task list
7. ✓ Mobile-responsive design
8. ✓ Zero critical bugs in testing

---

## 14. Glossary

| Term            | Definition                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| **RBAC**        | Role-Based Access Control - assigns permissions to roles, not individual users |
| **Role**        | A set of permissions (e.g., Admin, Manager, Member)                            |
| **Permission**  | An action a user can perform (e.g., task.create, user.delete)                  |
| **Status**      | Current state of a task in workflow                                            |
| **Assignee**    | Person responsible for completing a task                                       |
| **Soft Delete** | Mark as inactive instead of permanently removing                               |

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Ready for Development
