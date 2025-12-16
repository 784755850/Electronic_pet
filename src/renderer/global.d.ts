export {};

declare global {
  interface Window {
    electronAPI: {
      getPet: () => Promise<any>;
      getPlayer: () => Promise<any>;
      onPetUpdate: (callback: (pet: any) => void) => void;
      onShowBubble: (callback: (text: string) => void) => void;
      petAction: (action: string) => void;
      moveWindow: (deltaX: number, deltaY: number) => void;
      startDrag: () => void;
      endDrag: () => void;
      getColorSettings: () => Promise<any>;
      setColorTheme: (theme: string) => void;
      onColorUpdate: (callback: (colors: any) => void) => void;
      saveColors: (colors: any) => void;
      saveQuietHours: (cfg: { enabled: boolean; start: number; end: number }) => void;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => void;
      closeSettings: () => void;
      openSettings: () => void;
      openStatus: () => void;
      closeStatus: () => void;
      popTray: () => void;
      renamePet: (name: string) => void;
      updatePetAppearance: (seed: number) => void;
      setWidgetBg: (color: string) => void;
      resizeWindow: (width: number, height: number) => void;
      onWidgetBgUpdate: (callback: (color: string) => void) => void;
      feedPet: () => void;
      cleanPet: () => void;
      playWithPet: () => void;
      getJobs: () => Promise<any[]>;
      openWorkMenu: () => void;
      startWork: (jobId: string) => void;
      endWork: () => void;
      getStudies: () => Promise<any[]>;
      openStudyMenu: () => void;
      startStudy: (studyId: string) => void;
      getItems: () => Promise<any[]>;
      openShopMenu: () => void;
      openInventoryMenu: () => void;
      buyItem: (itemId: string, qty?: number) => void;
      useItem: (itemId: string) => void;
      getAdventureLocations: () => Promise<any[]>;
      startAdventure: (locationId: string) => Promise<any>;
      openAdventure: () => void;
      // LLM
      openChat: () => void;
      llmChat: (messages: any[]) => Promise<string>;
      getLLMConfig: () => Promise<any>;
      saveLLMConfig: (config: any) => void;
      testLLMConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
      getI18n: () => Promise<any>;
      getI18nData: () => Promise<any>;
      setLanguage: (lang: string) => void;
      onLanguageChange: (callback: (data: any) => void) => void;
      onShowInteraction: (callback: (data: { type: string; data: any; title: string }) => void) => void;
      interact: (type: string, id: string, mode: string) => void;
      onInteractionResult: (callback: (result: any) => void) => void;
      refreshInteraction: (type: string) => void;
      openDebug: () => void;
      debugAction: (action: string, param?: any) => void;
    };

    // Global variables from sprites.js
    PixelRenderer: any;
    SPRITES: any;
    updateColors: (colors: any) => void;

    // Global variables from pet-generator.js
    generatePetAppearance: (seed: number) => any;
  }
}
