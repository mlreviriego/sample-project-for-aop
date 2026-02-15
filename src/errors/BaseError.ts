export class BaseError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code: string = "INTERNAL_ERROR"
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends BaseError {
    constructor(message: string = "Resource not found") {
        super(message, 404, "NOT_FOUND");
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message: string = "Unauthorized access") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends BaseError {
    constructor(message: string = "Forbidden access") {
        super(message, 403, "FORBIDDEN");
    }
}

export class ValidationError extends BaseError {
    constructor(message: string = "Validation failed") {
        super(message, 400, "VALIDATION_ERROR");
    }
}
