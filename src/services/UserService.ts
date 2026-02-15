import { UserRepository } from "../repositories/UserRepository";
import bcrypt from "bcrypt";
import { AuthService } from "./AuthService";
import { CreateUserDTO, LoginDTO, Role, User } from "../types/DTOs";
import { Logger } from "../utils/Logger";
import { NotFoundError, UnauthorizedError, ValidationError } from "../errors/BaseError";

export class UserService {
    constructor(
        private userRepository: UserRepository,
        private authService: AuthService
    ) { }

    async createUser(dto: CreateUserDTO): Promise<User> {
        Logger.info("Entering createUser");
        Logger.debug(`Creating user with email: ${dto.email}`);

        try {
            if (!dto.email || !dto.password) {
                throw new ValidationError("Email and password are required");
            }

            const hashed = await bcrypt.hash(dto.password, 10);

            const user: User = {
                id: crypto.randomUUID(),
                email: dto.email,
                password: hashed,
                role: dto.role || Role.USER
            };

            return await this.userRepository.save(user);
        } catch (error) {
            Logger.error("Error creating user", error);
            throw error;
        }
    }

    async authenticate(dto: LoginDTO): Promise<string> {
        Logger.info("Entering authenticate");
        Logger.debug(`Authenticating user: ${dto.email}`);

        try {
            const user = await this.userRepository.findByEmail(dto.email);
            if (!user) {
                throw new NotFoundError("User not found");
            }

            const valid = await bcrypt.compare(dto.password, user.password);
            if (!valid) {
                throw new UnauthorizedError("Invalid credentials");
            }

            return this.authService.generateToken(user.id, user.role);
        } catch (error) {
            Logger.error("Authentication error", error);
            throw error;
        }
    }

    async getById(id: string): Promise<User> {
        Logger.info("Entering getById");
        Logger.debug(`Fetching user by id: ${id}`);

        try {
            const user = await this.userRepository.findById(id);
            if (!user) {
                throw new NotFoundError("User not found");
            }
            return user;
        } catch (error) {
            Logger.error("Error fetching user", error);
            throw error;
        }
    }
}
