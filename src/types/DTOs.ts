export enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
}

export interface CreateUserDTO {
    email: string;
    password: string;
    role?: Role;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface CreateTaskDTO {
    title: string;
    description?: string;
    deadline?: Date;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    ownerId: string;
}

export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    status?: string;
    deadline?: Date;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface User {
    id: string;
    email: string;
    password: string;
    role: Role;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    deadline?: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    ownerId: string;
    createdAt: Date;
}
