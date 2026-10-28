/**
 * Barrel Infrastructure Layer — point d'entrée unique des adapters locaux.
 * Le container (src/services/container.ts) ne doit importer QUE ce fichier.
 */

export { getDatabase, closeDatabase, DB_NAME } from './database';
export { newId, now } from './mappers';
export { createSqliteUserRepository } from './userRepository';
export { createSqliteCategoryRepository } from './categoryRepository';
export { createSqliteBudgetRepository } from './budgetRepository';
export { createSqliteExpenseRepository } from './expenseRepository';
export { createSqliteScannedTicketRepository } from './scannedTicketRepository';
