/**
 * PORTS (Clean Architecture) — contrats d'accès aux données.
 *
 * L'application (services) ne dépend QUE de ces interfaces.
 * Implémentation actuelle : SQLite (src/infrastructure/db/*).
 * Future implémentation : Repository HTTP (API distante) — mêmes signatures,
 * il suffira d'échanger le câblage dans src/services/container.ts.
 */

import type {
  Budget,
  Category,
  Expense,
  ExpenseFilter,
  NewBudgetInput,
  NewCategoryInput,
  NewExpenseInput,
  NewScannedTicketInput,
  ScannedTicket,
  User,
} from '../types/models';

export interface UserRepository {
  create(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  count(): Promise<number>;
}

export interface CategoryRepository {
  create(input: NewCategoryInput): Promise<Category>;
  findAllForUser(userId: string): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  update(id: string, patch: Partial<Pick<Category, 'name' | 'color' | 'icon'>>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface BudgetRepository {
  upsert(input: NewBudgetInput): Promise<Budget>;
  findGlobal(userId: string, month: number, year: number): Promise<Budget | null>;
  findByCategory(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
  ): Promise<Budget | null>;
  findAllForPeriod(userId: string, month: number, year: number): Promise<Budget[]>;
  remove(id: string): Promise<void>;
}

export interface ExpenseRepository {
  create(input: NewExpenseInput): Promise<Expense>;
  findById(id: string): Promise<Expense | null>;
  findMany(userId: string, filter?: ExpenseFilter): Promise<Expense[]>;
  update(id: string, patch: Partial<Omit<NewExpenseInput, 'userId'>>): Promise<void>;
  remove(id: string): Promise<void>;
  sumByCategory(userId: string, month: number, year: number): Promise<Record<string, number>>;
  sumTotal(userId: string, month: number, year: number): Promise<number>;
  monthlyTotals(userId: string, lastMonths: number): Promise<{ month: number; year: number; total: number }[]>;
}

export interface ScannedTicketRepository {
  /**
   * Si `input.id` est fourni : upsert (mise à jour des champs d'extraction si le
   * ticket existe déjà, sinon création). Permet le flux capture -> OCR -> analyse.
   */
  create(input: NewScannedTicketInput & { id?: string }): Promise<ScannedTicket>;
  findById(id: string): Promise<ScannedTicket | null>;
  updateExtraction(
    id: string,
    patch: Partial<Pick<ScannedTicket, 'extractedAmount' | 'extractedDate' | 'rawText'>>,
  ): Promise<void>;
}

/** Regroupement pratique injecté dans les services. */
export interface Repositories {
  users: UserRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  expenses: ExpenseRepository;
  tickets: ScannedTicketRepository;
}
