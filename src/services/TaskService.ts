import { TaskRepository } from "../repositories/TaskRepository";
import { UserRepository } from "../repositories/UserRepository";
import { CreateTaskDTO, Task, UpdateTaskDTO } from "../types/DTOs";
import { Logger } from "../utils/Logger";
import { NotFoundError, ValidationError } from "../errors/BaseError";
import { CacheService } from "./CacheService";
import { TransactionManager } from "../utils/TransactionManager";

export class TaskService {
    constructor(
        private taskRepository: TaskRepository,
        private userRepository: UserRepository,
        private cacheService: CacheService,
        private transactionManager: TransactionManager
    ) { }

    async create(dto: CreateTaskDTO): Promise<Task> {
        Logger.info("Entering create task");
        Logger.debug(`Creating task with title: ${dto.title}`);

        try {
            Logger.debug("Validating task data");

            // Title validation
            if (!dto.title) {
                throw new ValidationError("Title is required");
            }
            if (dto.title.trim().length < 3) {
                throw new ValidationError("Title must be at least 3 characters long");
            }
            if (dto.title.length > 100) {
                throw new ValidationError("Title must not exceed 100 characters");
            }

            // Description validation
            if (dto.description && dto.description.length > 500) {
                throw new ValidationError("Description must not exceed 500 characters");
            }

            // Deadline validation
            if (dto.deadline) {
                const deadlineDate = new Date(dto.deadline);
                const now = new Date();

                if (isNaN(deadlineDate.getTime())) {
                    throw new ValidationError("Invalid deadline date format");
                }

                if (deadlineDate < now) {
                    throw new ValidationError("Deadline cannot be in the past");
                }

                // Ensure deadline is within reasonable future
                const fiveYearsFromNow = new Date();
                fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
                if (deadlineDate > fiveYearsFromNow) {
                    throw new ValidationError("Deadline cannot be more than 5 years in the future");
                }
            }

            // Priority validation
            if (dto.priority && !['LOW', 'MEDIUM', 'HIGH'].includes(dto.priority)) {
                throw new ValidationError("Priority must be LOW, MEDIUM, or HIGH");
            }

            this.transactionManager.begin();

            try {
                const owner = await this.userRepository.findById(dto.ownerId);
                if (!owner) {
                    throw new NotFoundError("Owner not found");
                }

                // Check for duplicate task titles for the same user
                const similarTasks = await this.taskRepository.findByOwnerAndTitlePattern(
                    dto.ownerId,
                    dto.title.trim()
                );

                if (similarTasks.length > 0) {
                    Logger.debug(`Found ${similarTasks.length} similar task(s) for user`);
                    throw new ValidationError("A task with similar title already exists for this user");
                }

                const task: Task = {
                    id: crypto.randomUUID(),
                    title: dto.title.trim(),
                    description: dto.description?.trim(),
                    status: "TODO",
                    deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                    priority: dto.priority || 'MEDIUM',
                    ownerId: dto.ownerId,
                    createdAt: new Date()
                };

                const savedTask = await this.taskRepository.save(task);

                this.transactionManager.commit();
                Logger.info(`Task created successfully: ${task.id}`);

                return savedTask;
            } catch (error) {
                this.transactionManager.rollback();
                throw error;
            }
        } catch (error) {
            Logger.error("Error creating task", error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        Logger.info("Entering delete task");
        Logger.debug(`Deleting task with id: ${id}`);

        try {
            await this.taskRepository.delete(id);
            this.cacheService.invalidate(`task:${id}`);
        } catch (error) {
            Logger.error("Error deleting task", error);
            throw error;
        }
    }

    async deleteByOwner(ownerId: string): Promise<number> {
        Logger.info("Entering deleteByOwner");
        Logger.debug(`Deleting all tasks for user: ${ownerId}`);

        try {
            Logger.debug("Validating owner exists");

            const owner = await this.userRepository.findById(ownerId);
            if (!owner) {
                throw new NotFoundError("Owner not found");
            }

            this.transactionManager.begin();

            try {
                const deletedCount = await this.taskRepository.deleteByOwner(ownerId);

                // Invalidate all cached tasks for this owner
                this.cacheService.clear();

                this.transactionManager.commit();
                Logger.info(`Successfully deleted ${deletedCount} tasks for user: ${ownerId}`);

                return deletedCount;
            } catch (error) {
                this.transactionManager.rollback();
                throw error;
            }
        } catch (error) {
            Logger.error("Error deleting tasks by owner", error);
            throw error;
        }
    }

    async deleteMultiple(ids: string[]): Promise<number> {
        Logger.info("Entering deleteMultiple");
        Logger.debug(`Deleting ${ids.length} tasks`);

        try {
            Logger.debug("Validating task IDs");

            if (!ids || ids.length === 0) {
                throw new ValidationError("At least one task ID required");
            }

            this.transactionManager.begin();

            try {
                const deletedCount = await this.taskRepository.deleteMultiple(ids);

                // Invalidate cache for deleted tasks
                ids.forEach(id => this.cacheService.invalidate(`task:${id}`));

                this.transactionManager.commit();
                Logger.info(`Successfully deleted ${deletedCount} tasks`);

                return deletedCount;
            } catch (error) {
                this.transactionManager.rollback();
                throw error;
            }
        } catch (error) {
            Logger.error("Error deleting multiple tasks", error);
            throw error;
        }
    }

    async getById(id: string): Promise<Task> {
        Logger.info("Entering getById task");
        Logger.debug(`Fetching task with id: ${id}`);

        try {
            const cached = this.cacheService.get(`task:${id}`);
            if (cached) {
                Logger.info("Returning task from cache");
                return cached;
            }

            const task = await this.taskRepository.findById(id);
            if (!task) {
                throw new NotFoundError("Task not found");
            }

            this.cacheService.set(`task:${id}`, task);

            return task;
        } catch (error) {
            Logger.error("Error fetching task", error);
            throw error;
        }
    }

    async getByOwner(ownerId: string): Promise<Task[]> {
        Logger.info("Entering getByOwner");
        Logger.debug(`Fetching all tasks for owner: ${ownerId}`);

        try {
            Logger.debug("Validating owner exists");

            const owner = await this.userRepository.findById(ownerId);
            if (!owner) {
                throw new NotFoundError("Owner not found");
            }

            const cacheKey = `tasks:owner:${ownerId}`;
            const cached = this.cacheService.get(cacheKey);
            if (cached) {
                Logger.info("Returning owner tasks from cache");
                return cached;
            }

            const tasks = await this.taskRepository.findByOwner(ownerId);

            this.cacheService.set(cacheKey, tasks);
            Logger.info(`Fetched ${tasks.length} tasks for owner: ${ownerId}`);

            return tasks;
        } catch (error) {
            Logger.error("Error fetching tasks by owner", error);
            throw error;
        }
    }

    async update(id: string, dto: UpdateTaskDTO): Promise<Task> {
        Logger.info("Entering update task");
        Logger.debug(`Updating task with id: ${id}`);

        try {
            Logger.debug("Validating update data");

            // Title validation
            if (dto.title !== undefined) {
                if (dto.title.trim().length < 3) {
                    throw new ValidationError("Title must be at least 3 characters long");
                }
                if (dto.title.length > 100) {
                    throw new ValidationError("Title must not exceed 100 characters");
                }
            }

            // Description validation
            if (dto.description !== undefined && dto.description.length > 500) {
                throw new ValidationError("Description must not exceed 500 characters");
            }

            // Deadline validation
            if (dto.deadline) {
                const deadlineDate = new Date(dto.deadline);
                const now = new Date();

                if (isNaN(deadlineDate.getTime())) {
                    throw new ValidationError("Invalid deadline date format");
                }

                if (deadlineDate < now) {
                    throw new ValidationError("Deadline cannot be in the past");
                }

                const fiveYearsFromNow = new Date();
                fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
                if (deadlineDate > fiveYearsFromNow) {
                    throw new ValidationError("Deadline cannot be more than 5 years in the future");
                }
            }

            // Priority validation
            if (dto.priority && !['LOW', 'MEDIUM', 'HIGH'].includes(dto.priority)) {
                throw new ValidationError("Priority must be LOW, MEDIUM, or HIGH");
            }

            // Status validation
            if (dto.status && !['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(dto.status)) {
                throw new ValidationError("Status must be TODO, IN_PROGRESS, DONE, or CANCELLED");
            }

            // Simulate transaction handling
            this.transactionManager.begin();

            try {
                const existing = await this.taskRepository.findById(id);
                if (!existing) {
                    throw new NotFoundError("Task not found");
                }

                // Check for duplicate task titles for the same user (if title is being updated)
                if (dto.title !== undefined) {
                    const similarTasks = await this.taskRepository.findByOwnerAndTitlePattern(
                        existing.ownerId,
                        dto.title.trim(),
                        id // Exclude current task
                    );

                    if (similarTasks.length > 0) {
                        Logger.debug(`Found ${similarTasks.length} similar task(s) for user`);
                        throw new ValidationError("A task with similar title already exists for this user");
                    }
                }

                // Prepare update data with trimmed strings
                const updateData: UpdateTaskDTO = {};
                if (dto.title !== undefined) updateData.title = dto.title.trim();
                if (dto.description !== undefined) updateData.description = dto.description.trim();
                if (dto.status) updateData.status = dto.status;
                if (dto.deadline) updateData.deadline = new Date(dto.deadline);
                if (dto.priority) updateData.priority = dto.priority;

                const updated = await this.taskRepository.update(id, updateData);
                if (!updated) {
                    throw new NotFoundError("Task not found");
                }

                this.cacheService.invalidate(`task:${id}`);

                this.transactionManager.commit();
                Logger.info(`Task updated successfully: ${id}`);

                return updated;
            } catch (error) {
                this.transactionManager.rollback();
                throw error;
            }
        } catch (error) {
            Logger.error("Error updating task", error);
            throw error;
        }
    }
}
