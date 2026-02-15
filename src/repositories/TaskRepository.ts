import { Task } from "../types/DTOs";
import { Logger } from "../utils/Logger";

export class TaskRepository {
    private tasks: Task[] = [];

    async save(task: Task): Promise<Task> {
        Logger.info("Saving task to database");
        this.tasks.push(task);
        return task;
    }

    async delete(id: string): Promise<void> {
        Logger.info("Deleting task from database");
        this.tasks = this.tasks.filter(t => t.id !== id);
    }

    async findById(id: string): Promise<Task | undefined> {
        Logger.info("Finding task by id");
        return this.tasks.find(t => t.id === id);
    }

    async update(id: string, updates: Partial<Task>): Promise<Task | undefined> {
        Logger.info("Updating task in database");
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) {
            return undefined;
        }
        this.tasks[index] = { ...this.tasks[index], ...updates };
        return this.tasks[index];
    }

    async findByOwnerAndTitlePattern(ownerId: string, titlePattern: string, excludeId?: string): Promise<Task[]> {
        Logger.info("Finding tasks by owner and title pattern");
        return this.tasks.filter(t =>
            t.ownerId === ownerId &&
            t.title.toLowerCase().includes(titlePattern.toLowerCase()) &&
            (!excludeId || t.id !== excludeId)
        );
    }

    async findByOwner(ownerId: string): Promise<Task[]> {
        Logger.info(`Finding all tasks for owner: ${ownerId}`);
        return this.tasks.filter(t => t.ownerId === ownerId);
    }

    async deleteByOwner(ownerId: string): Promise<number> {
        Logger.info(`Deleting all tasks for owner: ${ownerId}`);
        const beforeCount = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.ownerId !== ownerId);
        const deletedCount = beforeCount - this.tasks.length;
        Logger.info(`Deleted ${deletedCount} tasks for owner: ${ownerId}`);
        return deletedCount;
    }

    async deleteMultiple(ids: string[]): Promise<number> {
        Logger.info(`Deleting multiple tasks: ${ids.join(", ")}`);
        const beforeCount = this.tasks.length;
        this.tasks = this.tasks.filter(t => !ids.includes(t.id));
        const deletedCount = beforeCount - this.tasks.length;
        Logger.info(`Deleted ${deletedCount} tasks`);
        return deletedCount;
    }
}
