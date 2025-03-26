import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DataSourceState {
    useRealData: boolean;
    setUseRealData: (value: boolean) => void;
    moduleConfig: {
        goals: boolean;
        tasks: boolean;
        finance: boolean;
    };
    toggleModule: (module: keyof DataSourceState['moduleConfig']) => void;
}

export const useDataSourceStore = create<DataSourceState>()(
    persist(
        (set) => ({
            useRealData: process.env.NODE_ENV === 'production',
            setUseRealData: (value) => set({ useRealData: value }),
            moduleConfig: {
                goals: false,
                tasks: false,
                finance: false
            },
            toggleModule: (module) => 
                set((state) => ({
                    moduleConfig: {
                        ...state.moduleConfig,
                        [module]: !state.moduleConfig[module]
                    }
                }))
        }),
        {
            name: 'data-source-storage',
            partialize: (state) => 
                process.env.NODE_ENV === 'production' 
                    ? { useRealData: true } 
                    : state
        }
    )
); 