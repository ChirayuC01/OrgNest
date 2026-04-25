import type { Role } from "@prisma/client";

export function authorize(allowedRoles: Role[]) {
  return (user: { role: Role }) => {
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Forbidden: Access denied");
    }
  };
}
