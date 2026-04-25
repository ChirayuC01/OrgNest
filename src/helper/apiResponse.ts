export function success<T>(data: T, status = 200) {
    return Response.json({ success: true, data }, { status });
}

export function error(message: string, status = 400) {
    return Response.json({ success: false, error: message }, { status });
}

export function validationError(errors: Record<string, string[]>) {
    return Response.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 422 }
    );
}

export function formatZodError(zodError: import("zod").ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of zodError.errors) {
        const key = issue.path.join(".") || "root";
        errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return errors;
}
