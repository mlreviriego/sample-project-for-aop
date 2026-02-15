import express from "express";
import { UserController } from "./controllers/UserController";
import { TaskController } from "./controllers/TaskController";
import { UserService } from "./services/UserService";
import { TaskService } from "./services/TaskService";
import { AuthService } from "./services/AuthService";
import { CacheService } from "./services/CacheService";
import { UserRepository } from "./repositories/UserRepository";
import { TaskRepository } from "./repositories/TaskRepository";
import { TransactionManager } from "./utils/TransactionManager";
import { Logger } from "./utils/Logger";

const app = express();
app.use(express.json());

// Initialize repositories
const userRepo = new UserRepository();
const taskRepo = new TaskRepository();

// Initialize supporting services
const authService = new AuthService();
const cacheService = new CacheService();
const transactionManager = new TransactionManager();

// Initialize services
const userService = new UserService(userRepo, authService);
const taskService = new TaskService(taskRepo, userRepo, cacheService, transactionManager);

// Initialize controllers
const userController = new UserController(userService);
const taskController = new TaskController(taskService);

// User routes
app.post("/register", (req, res) => userController.register(req, res));
app.post("/login", (req, res) => userController.login(req, res));
app.get("/profile", (req, res) => userController.getProfile(req, res));

// Task routes
app.post("/tasks", (req, res) => taskController.createTask(req, res));
app.get("/tasks/owner/list", (req, res) => taskController.getTasksByOwner(req, res));
app.get("/tasks/:id", (req, res) => taskController.getTask(req, res));
app.put("/tasks/:id", (req, res) => taskController.editTask(req, res));
app.delete("/tasks/:id", (req, res) => taskController.deleteTask(req, res));
app.delete("/tasks/owner/:userId", (req, res) => taskController.deleteTasksByOwner(req, res));
app.post("/tasks/delete-multiple", (req, res) => taskController.deleteMultipleTasks(req, res));

app.listen(3000, () => {
    Logger.info("Server running on port 3000");
});
