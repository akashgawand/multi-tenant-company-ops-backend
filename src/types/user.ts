import { Prisma } from "@prisma/client";

export const userSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  UserRoles: {
    select: {
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type QueriedUser = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

export type QueriedUserRole = QueriedUser["UserRoles"][number];
