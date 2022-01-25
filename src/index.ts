import { syncStatus } from "./quokka/sync-status";

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
  console.log("Hello world")
}

global.onHomepage = onHomepage;
global.onSyncChron = onSyncChron;
