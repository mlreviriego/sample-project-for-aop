import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { CreateUserDTO, LoginDTO } from "../types/DTOs";
import { Logger } from "../utils/Logger";
import { BaseError, ValidationError } from "../errors/BaseError";
import { AuthContext } from "../utils/AuthContext";

export class UserController {
    constructor(private userService: UserService) { }

    async register(req: Request, res: Response) {
        Logger.info("Entering register endpoint");

        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new ValidationError("Email and password required");
            }

            const dto: CreateUserDTO = { email, password };
            const user = await this.userService.createUser(dto);

            return res.status(201).json({
                id: user.id,
                email: user.email,
                role: user.role
            });

        } catch (err) {
            Logger.error("Error in register endpoint", err);

            if (err instanceof BaseError) {
                return res.status(err.statusCode).json({
                    error: err.message,
                    code: err.code
                });
            }

            return res.status(500).json({ error: "Internal error" });
        }
    }

    async login(req: Request, res: Response) {
        Logger.info("Entering login endpoint");

        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new ValidationError("Email and password required");
            }

            const dto: LoginDTO = { email, password };
            const token = await this.userService.authenticate(dto);

            return res.json({ token });

        } catch (err) {
            Logger.error("Error in login endpoint", err);

            if (err instanceof BaseError) {
                return res.status(err.statusCode).json({
                    error: err.message,
                    code: err.code
                });
            }

            return res.status(401).json({ error: "Authentication failed" });
        }
    }

    async getProfile(req: Request, res: Response) {
        Logger.info("Entering getProfile endpoint");

        try {
            AuthContext.extractFromHeaders(req);
            const userId = AuthContext.getUserId();

            const user = await this.userService.getById(userId);

            AuthContext.clear();

            return res.json({
                id: user.id,
                email: user.email,
                role: user.role
            });

        } catch (err) {
            Logger.error("Error in getProfile endpoint", err);
            AuthContext.clear();

            if (err instanceof BaseError) {
                return res.status(err.statusCode).json({
                    error: err.message,
                    code: err.code
                });
            }

            return res.status(500).json({ error: "Internal error" });
        }
    }
}
