import jwt from "jsonwebtoken";
import { Logger } from "../utils/Logger";
import { Role } from "../types/DTOs";
import { UnauthorizedError } from "../errors/BaseError";

export class AuthService {
    private static SECRET_KEY = "secret";

    generateToken(userId: string, role: Role): string {
        Logger.info("Generating JWT token");
        return jwt.sign({ id: userId, role }, AuthService.SECRET_KEY, { expiresIn: "24h" });
    }

    verifyToken(token: string): { id: string; role: Role } {
        try {
            Logger.info("Verifying JWT token");
            const decoded = jwt.verify(token, AuthService.SECRET_KEY) as { id: string; role: Role };
            return decoded;
        } catch (error) {
            Logger.error("Token verification failed", error);
            throw new UnauthorizedError("Invalid or expired token");
        }
    }
}
