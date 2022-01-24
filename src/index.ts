// You can access any of the global GAS objects in this file. You can also
// import local files or external dependencies:
import { syncStatus } from "./sync-status";

export function onHomepage(): GoogleAppsScript.Card_Service.Card[] {
  return [
    CardService.newCardBuilder()
      .setName("Quokka Home")
      .setHeader(CardService.newCardHeader().setTitle("Quokka Home"))
      .build(),
  ];
}

export function onSyncChron(): void {
  syncStatus();
}

global.onHomepage = onHomepage;
global.onSyncChron = onSyncChron;
