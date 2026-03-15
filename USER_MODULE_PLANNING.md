# User Management Module - Planning & Architecture

## Overview
User Management module handles CRUD operations for users within a tenant with proper role assignments, permissions, and data isolation.

---

## 1. API Endpoints

### 1.1 Get All Users (List)
```
GET /api/users
```
**Query Parameters:**
- `page` (optional): Pagination - default 1
- `limit` (optional): Items per page - default 10
- `search` (optional): Search by name/email
- `status` (optional): Filter by status (ACTIVE, INACTIVE, DELETED)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Akash Gawand",
      "email": "akash@acme.com",
      "status": "ACTIVE",
      "roles": ["Admin"],
      "createdAt": "2026-03-12T21:19:40.768Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### 1.2 Get Single User
```
GET /api/users/:id
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Akash Gawand",
    "email": "akash@acme.com",
    "status": "ACTIVE",
    "tenantId": 1,
    "roles": [
      {
        "id": 1,
        "name": "Admin",
        "permissions": ["user.read", "user.create", "user.update", "user.delete", "role.manage"]
      }
    ],
    "createdAt": "2026-03-12T21:19:40.768Z",
    "updatedAt": "2026-03-12T21:19:40.768Z"
  }
}
```

### 1.3 Create User
```
POST /api/users
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "SecurePassword123",
  "roleIds": [2] // Array of role IDs to assign
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "John Doe",
    "email": "john@acme.com",
    "status": "ACTIVE",
    "roles": ["Manager"],
    "createdAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### 1.4 Update User
```
PUT /api/users/:id
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@acme.com"
}
```

**Can update:**
- name
- email
- status
- roleIds (for assigning/removing roles)

### 1.5 Delete User (Soft Delete)
```
DELETE /api/users/:id
```

**Response:**
```json
{
  "message": "User deleted successfully",
  "data": {
    "id": 2,
    "status": "DELETED",
    "deletedAt": "2026-03-15T10:05:00.000Z"
  }
}
```

### 1.6 Assign/Update User Roles
```
PUT /api/users/:id/roles
```

**Request Body:**
```json
{
  "roleIds": [1, 2, 3]
}
```

### 1.7 Change User Status
```
PUT /api/users/:id/status
```

**Request Body:**
```json
{
  "status": "INACTIVE" // ACTIVE, INACTIVE, DELETED
}
```

---

## 2. Key Considerations & Security

### 🔐 **Tenant Isolation (CRITICAL)**
- **Every operation must verify the user belongs to the requesting user's tenant**
- When fetching users: `WHERE tenantId = req.user.tenantId`
- Prevent users from seeing/modifying users in other tenants
- Check: `if (userToModify.tenantId !== req.user.tenantId) throw "Unauthorized"`

### 🔑 **Permission-Based Access Control**

| Action | Required Permission | Roles |
|--------|-------------------|-------|
| Get All Users | `user.read` | Admin, Manager |
| Get Single User | `user.read` | Admin, Manager, (own user) |
| Create User | `user.create` | Admin, Manager |
| Update User | `user.update` | Admin, (Manager for own team) |
| Delete User | `user.delete` | Admin only |
| Assign Roles | `role.manage` | Admin only |
| Change Status | `user.update` | Admin only |

### ✅ **Validation Requirements**

#### Email Validation:
- Must be unique **within the tenant** (not globally)
- Must be valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Case-insensitive (normalize to lowercase)
- Trim whitespace

#### Password Validation:
- Minimum 8 characters
- Must contain uppercase, lowercase, number
- Hash using bcrypt (cost factor: 10)
- Never return in response

#### Name Validation:
- Required, non-empty
- Max 100 characters
- Trim whitespace

#### Role Validation:
- Role IDs must exist in the **same tenant**
- Prevent assigning roles from other tenants
- Cannot assign system admin roles through API (if applicable)

### 🚫 **What NOT to Do**

1. **Don't expose passwords** - Never return password field in responses
2. **Don't allow role escalation** - Users shouldn't be able to assign higher permission roles to themselves
3. **Don't bypass tenant checks** - Always validate `tenantId`
4. **Don't delete roles in use** - Prevent deleting roles assigned to active users
5. **Don't allow duplicate emails in tenant** - Check case-insensitively
6. **Don't trust client-provided tenantId** - Use `req.user.tenantId` from token

### 📋 **Data Returned Checklist**

**Always exclude:**
- ❌ `password`
- ❌ `deletedAt` (unless status is DELETED)

**Always include:**
- ✅ `id`
- ✅ `name`
- ✅ `email`
- ✅ `status`
- ✅ `roles` (flattened array of role names or full objects)
- ✅ `createdAt`
- ✅ `updatedAt`

---

## 3. Database Operations

### Query Pattern for List Users:
```javascript
// ✅ CORRECT
const users = await tx.user.findMany({
  where: {
    tenantId: req.user.tenantId,
    status: { not: "DELETED" } // Don't show deleted by default
  },
  include: {
    UserRoles: {
      include: { role: true }
    }
  },
  skip: (page - 1) * limit,
  take: limit
});
```

### Query Pattern for Get Single User:
```javascript
// ✅ CORRECT - Verify tenant ownership
const user = await tx.user.findUnique({
  where: { id: userId },
  include: {
    UserRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }
      }
    }
  }
});

// Verify tenant
if (user.tenantId !== req.user.tenantId) {
  throw new Error("Unauthorized");
}
```

### Query Pattern for Create User:
```javascript
// Use transaction to ensure atomicity
const user = await prisma.$transaction(async (tx) => {
  // 1. Check email uniqueness in tenant
  const existing = await tx.user.findFirst({
    where: { email: normalizedEmail, tenantId: req.user.tenantId }
  });
  
  // 2. Verify all roles exist in tenant
  const roles = await tx.role.findMany({
    where: { id: { in: roleIds }, tenantId: req.user.tenantId }
  });
  
  // 3. Create user
  const newUser = await tx.user.create({
    data: { /* ... */ }
  });
  
  // 4. Assign roles
  await tx.userRole.createMany({
    data: roleIds.map(roleId => ({
      userId: newUser.id,
      roleId
    }))
  });
  
  return newUser;
});
```

### Query Pattern for Soft Delete:
```javascript
// ✅ CORRECT - Soft delete (don't remove from DB)
await tx.user.update({
  where: { id: userId },
  data: {
    status: "DELETED",
    deletedAt: new Date()
  }
});
```

---

## 4. Error Handling

| Error | HTTP Status | Message |
|-------|-----------|---------|
| User not found | 404 | "User not found" |
| Email already exists in tenant | 409 | "Email already in use" |
| Invalid role for tenant | 400 | "One or more roles do not exist in this tenant" |
| Unauthorized (wrong tenant) | 403 | "Access denied" |
| Permission denied | 403 | "You don't have permission to perform this action" |
| Invalid input | 400 | "Validation failed: {details}" |
| Cannot delete last admin | 400 | "Cannot delete the last admin in tenant" |

---

## 5. Performance Optimization

### Indexing Needed:
```prisma
@@index([tenantId])           // For filtering by tenant
@@index([email])              // For email lookups
@@index([tenantId, email])    // Composite for tenant + email searches
@@index([status])             // For status filtering
```

### N+1 Query Prevention:
- Use `include` instead of multiple queries
- Don't fetch roles separately in a loop
- Use pagination for list endpoints

### Caching Opportunities:
- Cache role permissions (they rarely change)
- Cache user roles after fetch
- Clear cache on role assignment changes

---

## 6. Middleware & Middleware Chain

```
Request
  ↓
[Auth Middleware] - Verify JWT token, extract user
  ↓
[Tenant Validation] - Ensure user has valid tenantId
  ↓
[Permission Middleware] - Check if user has required permission
  ↓
[Route Handler]
  ↓
[Response Handler] - Format response, exclude sensitive data
```

### Example for DELETE /users/:id:
```javascript
router.delete('/users/:id', 
  authMiddleware,           // Verify token
  permissionMiddleware('user.delete'), // Only Admin
  userController.deleteUser
);
```

---

## 7. Testing Checklist

- [ ] Tenant isolation: User A cannot see/modify User B from other tenant
- [ ] Permission enforcement: Manager cannot delete users (needs Admin)
- [ ] Email uniqueness: Cannot create 2 users with same email in tenant
- [ ] Soft delete: Deleted user shows status DELETED, not removed from DB
- [ ] Role assignment: Assigning non-existent role returns 400
- [ ] Password not exposed: No password in any response
- [ ] Pagination works: Returns correct page/limit/total
- [ ] Role inheritance: Fetching user includes all assigned roles
- [ ] Concurrent updates: Multiple updates to same user don't corrupt data

---

## 8. File Structure

```
src/models/user/
  ├── user.controller.ts    // Request handlers
  ├── user.service.ts       // Business logic, DB queries
  ├── user.validation.ts    // Input validation schemas
  ├── user.routes.ts        // Route definitions
  └── user.types.ts         // TypeScript interfaces
```

---

## 9. Response Format Standard

All responses should follow:
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email is already in use",
    "details": {}
  }
}
```

---

## Next Steps

1. Create `user.types.ts` with interfaces
2. Create `user.validation.ts` with validation rules
3. Create `user.service.ts` with database queries
4. Create `user.controller.ts` with route handlers
5. Create `user.routes.ts` with route definitions
6. Integrate into main `routes/routes.js`
7. Test with Postman/Insomnia
