import { Logger } from "./Logger";

export class TransactionManager {
    private isActive = false;
    private operations: Array<() => void> = [];

    begin(): void {
        this.isActive = true;
        this.operations = [];
    }

    commit(): void {
        if (!this.isActive) {
            throw new Error("No active transaction to commit");
        }
        this.isActive = false;
        this.operations = [];
    }

    rollback(): void {
        if (!this.isActive) {
            throw new Error("No active transaction to rollback");
        }
        Logger.error("Rolling back transaction");
        this.isActive = false;
        this.operations = [];
    }

    addOperation(operation: () => void): void {
        if (!this.isActive) {
            throw new Error("No active transaction");
        }
        this.operations.push(operation);
    }
}
