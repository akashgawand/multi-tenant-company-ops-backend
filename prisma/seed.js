import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seed...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    // ==================== TENANT ====================
    const tenant = await prisma.tenant.create({
        data: {
            name: "Acme Corporation",
        },
    });
    console.log(`✅ Created tenant: ${tenant.name}`);

    // ==================== PERMISSIONS ====================
    const permissions = [
        // Task Permissions
        { name: "task.create" },
        { name: "task.read" },
        { name: "task.update" },
        { name: "task.delete" },
        { name: "task.assign" },
        { name: "task.approve" },

        // User Permissions
        { name: "user.read" },
        { name: "user.create" },
        { name: "user.update" },
        { name: "user.delete" },

        // Role Permissions
        { name: "role.manage" },

        // Attendance Permissions
        { name: "attendance.mark" },
        { name: "attendance.view" },
        { name: "attendance.edit" },
        { name: "attendance.view_team" },

        // Leave Permissions
        { name: "leave.apply" },
        { name: "leave.approve" },
        { name: "leave.view_team" },
        { name: "leave.cancel" },

        // Tenant Permissions
        { name: "tenant.manage" },
    ];

    const createdPermissions = await Promise.all(
        permissions.map((perm) =>
            prisma.permission.upsert({
                where: { name: perm.name },
                update: {},
                create: perm,
            })
        )
    );
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // ==================== ROLES ====================
    const roles = [
        { name: "Admin", tenantId: tenant.id },
        { name: "Manager", tenantId: tenant.id },
        { name: "Member", tenantId: tenant.id },
        { name: "Viewer", tenantId: tenant.id },
    ];

    const createdRoles = await Promise.all(
        roles.map((role) =>
            prisma.role.create({
                data: role,
            })
        )
    );
    console.log(`✅ Created ${createdRoles.length} roles`);

    // ==================== ROLE-PERMISSION MAPPING ====================
    const permissionMap = {};
    createdPermissions.forEach((perm) => {
        permissionMap[perm.name] = perm.id;
    });

    const roleMap = {};
    createdRoles.forEach((role) => {
        roleMap[role.name] = role.id;
    });

    // Define permissions for each role based on the spec matrix
    const rolePermissions = {
        Admin: [
            "task.create",
            "task.read",
            "task.update",
            "task.delete",
            "task.assign",
            "task.approve",
            "user.read",
            "user.create",
            "user.update",
            "user.delete",
            "role.manage",
            "attendance.mark",
            "attendance.view",
            "attendance.edit",
            "attendance.view_team",
            "leave.apply",
            "leave.approve",
            "leave.view_team",
            "leave.cancel",
            "tenant.manage",
        ],
        Manager: [
            "task.create",
            "task.read",
            "task.update",
            "task.assign",
            "task.approve",
            "user.read",
            "attendance.mark",
            "attendance.view",
            "attendance.edit",
            "attendance.view_team",
            "leave.apply",
            "leave.approve",
            "leave.view_team",
            "leave.cancel",
        ],
        Member: [
            "task.create",
            "task.read",
            "task.update",
            "attendance.mark",
            "attendance.view",
            "leave.apply",
            "leave.cancel",
        ],
        Viewer: [
            "task.read",
            "attendance.mark",
            "attendance.view",
            "leave.apply",
        ],
    };

    // Create role-permission relationships
    let totalPermissionMappings = 0;
    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
        const roleId = roleMap[roleName];
        for (const permissionName of permissionNames) {
            const permissionId = permissionMap[permissionName];
            await prisma.rolePermissions.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: roleId,
                        permissionId: permissionId,
                    },
                },
                update: {},
                create: {
                    roleId: roleId,
                    permissionId: permissionId,
                },
            });
            totalPermissionMappings++;
        }
    }
    console.log(`✅ Created ${totalPermissionMappings} role-permission mappings`);

    // ==================== USERS ====================
    const hashedPassword = await bcrypt.hash("123456", 10);

    const usersToCreate = [
        {
            name: "Akash Gawand",
            email: "akash@acme.com",
            role: "Admin",
        },
        {
            name: "Bob Smith",
            email: "bob@acme.com",
            role: "Manager",
        },
        {
            name: "Carol Davis",
            email: "carol@acme.com",
            role: "Member",
        },
        {
            name: "David Wilson",
            email: "david@acme.com",
            role: "Member",
        },
        {
            name: "Emma Brown",
            email: "emma@acme.com",
            role: "Viewer",
        },
    ];

    const createdUsers = await Promise.all(
        usersToCreate.map((userData) =>
            prisma.user.create({
                data: {
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    tenantId: tenant.id,
                },
            })
        )
    );
    console.log(`✅ Created ${createdUsers.length} users`);

    // ==================== ASSIGN ROLES TO USERS ====================
    let totalUserRoles = 0;
    await Promise.all(
        createdUsers.map((user) => {
            const userData = usersToCreate.find((u) => u.email === user.email);
            const roleId = roleMap[userData.role];

            totalUserRoles++;
            return prisma.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: user.id,
                        roleId: roleId,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    roleId: roleId,
                },
            });
        })
    );
    console.log(`✅ Assigned roles to ${totalUserRoles} users`);

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📋 Seeded Data Summary:");
    console.log(`   - Tenants: 1 (${tenant.name})`);
    console.log(`   - Roles: ${createdRoles.length}`);
    console.log(`   - Permissions: ${createdPermissions.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log("\n👤 Test Users:");
    createdUsers.forEach((user) => {
        const userData = usersToCreate.find((u) => u.email === user.email);
        console.log(`   - ${user.email} (${userData.role})`);
    });
    console.log("\n🔑 Default Password: 123456");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Seeding failed:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
