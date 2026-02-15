import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { CreateTaskDTO, Role, UpdateTaskDTO } from "../types/DTOs";
import { Logger } from "../utils/Logger";
import { BaseError, ValidationError, ForbiddenError } from "../errors/BaseError";
import { AuthContext } from "../utils/AuthContext";

export class TaskController {
    constructor(private taskService: TaskService) { }

    async createTask(req: Request, res: Response) {
        Logger.info("Entering createTask endpoint");

        try {
            const { title, description, deadline, priority } = req.body;

            if (!title) {
                throw new ValidationError("Title required");
            }

            AuthContext.extractFromHeaders(req);
            const userId = AuthContext.getUserId();

            const dto: CreateTaskDTO = {
                title,
                description,
                deadline: deadline ? new Date(deadline) : undefined,
                priority,
                ownerId: userId
            };
            const task = await this.taskService.create(dto);

            AuthContext.clear();

            return res.status(201).json(task);

        } catch (err) {
            Logger.error("Error in createTask endpoint", err);
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

    async deleteTask(req: Request, res: Response) {
        Logger.info("Entering deleteTask endpoint");

        try {
            const taskId = req.params.id as string;

            AuthContext.extractFromHeaders(req);
            const role = AuthContext.getRole();

            if (role !== Role.ADMIN) {
                throw new ForbiddenError("Admin role required");
            }

            await this.taskService.delete(taskId);

            AuthContext.clear();

            return res.status(204).send();

        } catch (err) {
            Logger.error("Error in deleteTask endpoint", err);
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

    async getTask(req: Request, res: Response) {
        Logger.info("Entering getTask endpoint");

        try {
            const task = await this.taskService.getById(req.params.id as string);
            return res.json(task);

        } catch (err) {
            Logger.error("Error in getTask endpoint", err);

            if (err instanceof BaseError) {
                return res.status(err.statusCode).json({
                    error: err.message,
                    code: err.code
                });
            }

            return res.status(500).json({ error: "Internal error" });
        }
    }

    async editTask(req: Request, res: Response) {
        Logger.info("Entering editTask endpoint");

        try {
            const taskId = req.params.id as string;
            const { title, description, status, deadline, priority } = req.body;

            if (!title && !description && !status && !deadline && !priority) {
                throw new ValidationError("At least one field (title, description, status, deadline, or priority) required");
            }

            const dto: UpdateTaskDTO = {};
            if (title !== undefined) dto.title = title;
            if (description !== undefined) dto.description = description;
            if (status) dto.status = status;
            if (deadline) dto.deadline = new Date(deadline);
            if (priority) dto.priority = priority;

            const task = await this.taskService.update(taskId, dto);

            return res.json(task);

        } catch (err) {
            Logger.error("Error in editTask endpoint", err);

            if (err instanceof BaseError) {
                return res.status(err.statusCode).json({
                    error: err.message,
                    code: err.code
                });
            }

            return res.status(500).json({ error: "Internal error" });
        }
    }

    async getTasksByOwner(req: Request, res: Response) {
        Logger.info("Entering getTasksByOwner endpoint");

        try {
            AuthContext.extractFromHeaders(req);
            const userId = AuthContext.getUserId();

            const tasks = await this.taskService.getByOwner(userId);
            AuthContext.clear();

            return res.json(tasks);

        } catch (err) {
            Logger.error("Error in getTasksByOwner endpoint", err);
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

    async deleteTasksByOwner(req: Request, res: Response) {
        Logger.info("Entering deleteTasksByOwner endpoint");

        try {
            AuthContext.extractFromHeaders(req);
            const userId = AuthContext.getUserId();
            const role = AuthContext.getRole();

            // Only allow users to delete their own tasks or admins to delete any user's tasks
            const targetUserId = typeof req.params.userId === 'string' ? req.params.userId : userId;
            if (targetUserId !== userId && role !== Role.ADMIN) {
                throw new ForbiddenError("You can only delete your own tasks");
            }

            const deletedCount = await this.taskService.deleteByOwner(targetUserId);
            AuthContext.clear();

            return res.json({ deletedCount, message: `Deleted ${deletedCount} tasks` });

        } catch (err) {
            Logger.error("Error in deleteTasksByOwner endpoint", err);
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

    async deleteMultipleTasks(req: Request, res: Response) {
        Logger.info("Entering deleteMultipleTasks endpoint");

        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new ValidationError("ids must be a non-empty array");
            }

            const deletedCount = await this.taskService.deleteMultiple(ids);

            return res.json({ deletedCount, message: `Deleted ${deletedCount} tasks` });

        } catch (err) {
            Logger.error("Error in deleteMultipleTasks endpoint", err);

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
