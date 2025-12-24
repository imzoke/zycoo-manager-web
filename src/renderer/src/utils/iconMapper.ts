import * as TablerIcons from '@vicons/tabler';
import { Component } from 'vue';

export function getIcon(name: string): Component | undefined {
  if (!name) return undefined;
  // Handle cases where name might differ (e.g. lowercase in DB vs PascalCase in lib)
  // But usually we just match exact name or try to make it PascalCase if needed.
  // Tabler icons are usually exported as "IconName" or just "Name"?
  // Looking at system.ts: import { Api, User ... } so it's just the name.

  return (TablerIcons as any)[name];
}
