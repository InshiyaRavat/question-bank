import { auth } from "@clerk/nextjs/server";

export function requireUserId() {
    const { userId } = auth();
    if (!userId) {
        const err = new Error("Unauthorized");
        err.status = 401;
        throw err;
    }
    return userId;
}
