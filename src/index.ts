import { syncStatus } from "./quokka/sync-status";
import { Homepage, onGitHubAccessTokenChange, onStartSetGitHubToken } from "./views/homepage";

export function onHomepage(): GoogleAppsScript.Card_Service.Card[] {
  return Homepage();
}

export function onSyncChron(): void {
  syncStatus();
  console.log("Hello world");
}

global.onHomepage = onHomepage;
global.onSyncChron = onSyncChron;
global.onGitHubAccessTokenChange = onGitHubAccessTokenChange;
global.onStartSetGitHubToken = onStartSetGitHubToken;
