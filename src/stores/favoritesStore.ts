import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesStore {
  ids: string[]; // product slugs
  toggle: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (slug) =>
        set((s) => ({
          ids: s.ids.includes(slug)
            ? s.ids.filter((id) => id !== slug)
            : [...s.ids, slug],
        })),
      isFavorite: (slug) => get().ids.includes(slug),
      clear: () => set({ ids: [] }),
    }),
    { name: 'rf-favorites', storage: createJSONStorage(() => localStorage) }
  )
);
