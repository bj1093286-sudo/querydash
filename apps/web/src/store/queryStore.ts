import { create } from 'zustand';

interface QueryStoreState {
  id?: string;
  name: string;
  sqlText: string;
  datasourceId?: string;
  isDirty: boolean;
  setName: (name: string) => void;
  setSqlText: (sqlText: string) => void;
  setDatasourceId: (id: string) => void;
  loadQuery: (query: { id: string; name: string; sqlText: string; datasourceId: string }) => void;
  markSaved: (id: string) => void;
  reset: () => void;
}

export const useQueryStore = create<QueryStoreState>((set) => ({
  name: '새 쿼리',
  sqlText: '',
  isDirty: false,
  setName: (name) => set({ name, isDirty: true }),
  setSqlText: (sqlText) => set({ sqlText, isDirty: true }),
  setDatasourceId: (datasourceId) => set({ datasourceId, isDirty: true }),
  loadQuery: (query) => set({ ...query, isDirty: false }),
  markSaved: (id) => set({ id, isDirty: false }),
  reset: () =>
    set({
      id: undefined,
      name: '새 쿼리',
      sqlText: '',
      datasourceId: undefined,
      isDirty: false,
    }),
}));
