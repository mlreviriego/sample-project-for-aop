import { Request } from "express";
import { Logger } from "./Logger";
import { Role } from "../types/DTOs";
import { UnauthorizedError } from "../errors/BaseError";

export interface AuthContextData {
    userId: string;
    role: Role;
}

export class AuthContext {
    private static context: AuthContextData | null = null;

    static extractFromHeaders(req: Request): void {
        const userId = req.headers["x-user-id"] as string;
        const role = req.headers["x-role"] as string;

        if (!userId || !role) {
            Logger.error("Missing authentication headers");
            throw new UnauthorizedError("Authentication required");
        }

        this.context = {
            userId,
            role: role as Role
        };

        Logger.debug(`Auth context set: userId=${userId}, role=${role}`);
    }

    static get(): AuthContextData {
        if (!this.context) {
            Logger.error("Auth context not initialized");
            throw new UnauthorizedError("Authentication context not available");
        }
        return this.context;
    }

    static isAuthenticated(): boolean {
        return this.context != null;
    }

    static clear(): void {
        this.context = null;
    }

    static getUserId(): string {
        return this.get().userId;
    }

    static getRole(): Role {
        return this.get().role;
    }
}
