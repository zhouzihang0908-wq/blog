/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { AuthUser } from './lib/server/types';

declare global {
  namespace App {
    interface Locals {
      user: AuthUser | null;
    }
  }

  interface Window {
    PagefindUI?: new (options: Record<string, unknown>) => unknown;
    __blogInteractionsInitialized?: boolean;
    __blogHeaderAuthInitialized?: boolean;
  }
}
