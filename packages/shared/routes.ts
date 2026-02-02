import { z } from 'zod';
import { 
  insertAccountSchema, accounts,
  insertCategorySchema, categories,
  insertTransactionSchema, transactions,
  insertDebtSchema, debts,
  insertInvestmentSchema, investments,
  insertGoalSchema, goals,
  insertIncomeEntrySchema, incomeEntries
} from './schema';

// Shared Error Schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  settings: {
    currency: {
      method: 'GET' as const,
      path: '/api/settings/currency',
      input: z.object({
        currency: z.enum(["BRL", "USD"]),
      }).optional(),
      responses: {
        200: z.object({
          currency: z.enum(["BRL", "USD"]),
        }),
      },
    },
  },
  // --- Dashboard ---
  dashboard: {
    get: {
      method: 'GET' as const,
      path: '/api/dashboard',
      responses: {
        200: z.object({
          totalBalance: z.number(),
          netWorth: z.number(),
          monthlyIncome: z.number(),
          monthlyExpenses: z.number(),
          savingsRate: z.number(),
          recentTransactions: z.array(z.custom<typeof transactions.$inferSelect>()),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  // --- Accounts ---
  accounts: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts',
      responses: {
        200: z.array(z.custom<typeof accounts.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/accounts/:id',
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts',
      input: insertAccountSchema,
      responses: {
        201: z.custom<typeof accounts.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/accounts/:id',
      input: insertAccountSchema.partial(),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/accounts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // --- Categories ---
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories',
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // --- Transactions ---
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        accountId: z.coerce.number().optional(),
        categoryId: z.coerce.number().optional(),
        type: z.enum(["income", "expense", "transfer"]).optional(),
        limit: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect & { category?: typeof categories.$inferSelect, account?: typeof accounts.$inferSelect }>()), // Include relations
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions',
      input: insertTransactionSchema.extend({
        date: z.coerce.date(),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/transactions/:id',
      input: insertTransactionSchema
        .extend({
          date: z.coerce.date().optional(),
        })
        .partial(),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // --- Debts ---
  debts: {
    list: {
      method: 'GET' as const,
      path: '/api/debts',
      responses: {
        200: z.array(z.custom<typeof debts.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/debts',
      input: insertDebtSchema,
      responses: {
        201: z.custom<typeof debts.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/debts/:id',
      input: insertDebtSchema.partial(),
      responses: {
        200: z.custom<typeof debts.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/debts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // --- Investments ---
  investments: {
    list: {
      method: 'GET' as const,
      path: '/api/investments',
      responses: {
        200: z.array(z.custom<typeof investments.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/investments',
      input: insertInvestmentSchema,
      responses: {
        201: z.custom<typeof investments.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/investments/:id',
      input: insertInvestmentSchema.partial(),
      responses: {
        200: z.custom<typeof investments.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    apply: {
      method: 'POST' as const,
      path: '/api/investments/apply',
      input: z.object({
        investmentId: z.coerce.number(),
        accountId: z.coerce.number(),
        amount: z.coerce.number().positive(),
        date: z.coerce.date().optional(),
        description: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof investments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/investments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // --- Goals ---
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/goals/:id',
      input: insertGoalSchema.partial(),
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  income: {
    entries: {
      list: {
        method: 'GET' as const,
        path: '/api/income/entries',
        responses: {
          200: z.array(z.custom<typeof incomeEntries.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/income/entries',
        input: insertIncomeEntrySchema,
        responses: {
          201: z.custom<typeof incomeEntries.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/income/entries/:id',
        input: insertIncomeEntrySchema.partial(),
        responses: {
          200: z.custom<typeof incomeEntries.$inferSelect>(),
          404: errorSchemas.notFound,
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/income/entries/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
          401: errorSchemas.unauthorized,
        },
      },
    },
    annual: {
      get: {
        method: 'GET' as const,
        path: '/api/income/annual',
        input: z.object({
          year: z.coerce.number().optional(),
        }).optional(),
        responses: {
          200: z.object({
            year: z.number(),
            months: z.array(z.object({
              month: z.number(),
              entriesTotal: z.number(),
              total: z.number(),
            })),
          }),
          401: errorSchemas.unauthorized,
        },
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
