import { User } from "../types/DTOs";
import { Logger } from "../utils/Logger";

export class UserRepository {
    private users: User[] = [];

    async save(user: User): Promise<User> {
        Logger.info("Saving user to database");
        this.users.push(user);
        return user;
    }

    async findByEmail(email: string): Promise<User | undefined> {
        Logger.info("Finding user by email");
        return this.users.find(u => u.email === email);
    }

    async findById(id: string): Promise<User | undefined> {
        Logger.info("Finding user by id");
        return this.users.find(u => u.id === id);
    }
}
