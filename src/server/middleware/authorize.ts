export function authorize(allowedRoles: string[]) {
    return (user: { role: string }) => {
        if (!allowedRoles.includes(user.role)) {
            throw new Error("Forbidden: Access denied");
        }
    };
}