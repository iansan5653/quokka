import { onEventStart, onRefresh } from "./quokka/load-batch";
import {
  Homepage,
  onGitHubAccessTokenSave,
  onStartSetGitHubToken,
} from "./views/homepage";

export function onHomepage(): GoogleAppsScript.Card_Service.Card[] {
  return Homepage();
}

global.onHomepage = onHomepage;
global.onGitHubAccessTokenSave = onGitHubAccessTokenSave;
global.onStartSetGitHubToken = onStartSetGitHubToken;
global.onEventStart = onEventStart;
global.onRefresh = onRefresh;
