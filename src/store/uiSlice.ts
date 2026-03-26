import { StateCreator } from "zustand";

export interface UISlice {
  sidebarWidth: number;
  isCommandPaletteOpen: boolean;
  isNotificationCenterOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleNotificationCenter: () => void;
  setSidebarWidth: (w: number) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  sidebarWidth: 220,
  isCommandPaletteOpen: false,
  isNotificationCenterOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleNotificationCenter: () =>
    set((state) => ({ isNotificationCenterOpen: !state.isNotificationCenterOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
});
