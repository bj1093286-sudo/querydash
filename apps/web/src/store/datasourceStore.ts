import { create } from 'zustand';
import { api, type PublicDataSource } from '../lib/api';

interface DatasourceStoreState {
  items: PublicDataSource[];
  loading: boolean;
  fetchAll: () => Promise<void>;
}

export const useDatasourceStore = create<DatasourceStoreState>((set) => ({
  items: [],
  loading: false,
  fetchAll: async () => {
    set({ loading: true });
    try {
      const items = await api.datasources.list();
      set({ items });
    } finally {
      set({ loading: false });
    }
  },
}));
