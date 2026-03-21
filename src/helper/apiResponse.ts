export function success(data: any) {
    return Response.json({ success: true, data });
}

export function error(message: string, status = 400) {
    return Response.json(
        { success: false, error: message },
        { status }
    );
}