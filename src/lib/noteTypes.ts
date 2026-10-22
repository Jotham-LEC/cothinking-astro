// A note post type's listing (/notes/type/{type}): its name and what search
// engines are told; null for a type without a published note.
import { noteTypesInUse } from './explorer.ts';
import { published } from './pages.ts';
import type { Collections, Page } from './types.ts';

type NoteType = { handle: string; title: string; seoTitle: string; seoDescription: string };

export function noteTypes(pages: Page[], collections: Collections, collection = 'notes'): NoteType[] {
  const types = collections[collection]?.types ?? [];
  return noteTypesInUse(published(pages), collection, types).map((t) => ({
    handle: t.handle,
    title: t.title,
    seoTitle: `${t.title} notes`,
    seoDescription: `Every ${t.title.toLowerCase()} note, newest first.`,
  }));
}

export const noteType = (handle: string, pages: Page[], collections: Collections): NoteType | null =>
  noteTypes(pages, collections).find((t) => t.handle === handle) ?? null;
