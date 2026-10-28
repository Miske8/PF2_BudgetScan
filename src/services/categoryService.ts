/**
 * categoryService — Application Layer.
 */

import type { Category, CategoryIconName, NewCategoryInput } from '@/core/types/models';
import { DomainError } from '@/core/rules/businessRules';
import { getRepositories } from './container';

export interface CategoryService {
  list(userId: string): Promise<Category[]>;
  create(input: NewCategoryInput): Promise<Category>;
  rename(id: string, patch: Partial<Pick<Category, 'name' | 'color' | 'icon'>>): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createCategoryService(): CategoryService {
  const repo = () => getRepositories().categories;

  return {
    list(userId) {
      return repo().findAllForUser(userId);
    },

    async create(input) {
      const existing = await repo().findAllForUser(input.userId ?? '');
      const duplicate = existing.some(
        (c) => c.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
      );
      if (duplicate) {
        throw new DomainError(`La catégorie « ${input.name} » existe déjà.`);
      }
      return repo().create(input);
    },

    rename(id, patch) {
      return repo().update(id, patch);
    },

    async remove(id) {
      const category = await repo().findById(id);
      if (!category) return;
      if (category.isDefault) {
        throw new DomainError('Les catégories par défaut ne peuvent pas être supprimées.');
      }
      // Protection : impossible de supprimer une catégorie utilisée.
      const expenses = await getRepositories().expenses.findMany(category.userId ?? id, {
        categoryId: id,
        limit: 1,
      });
      if (expenses.length > 0) {
        throw new DomainError(
          'Impossible de supprimer cette catégorie : des dépenses y sont rattachées.',
        );
      }
      await repo().remove(id);
    },
  };
}

/** Icônes proposées à la création d'une catégorie personnalisée. */
export const SELECTABLE_ICONS: CategoryIconName[] = [
  'cart',
  'car',
  'home',
  'basketball',
  'medkit',
  'shirt',
  'ellipse',
];
