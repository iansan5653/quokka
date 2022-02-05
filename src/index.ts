import { onEventStart, onRefresh, onSync } from "./quokka/load-batch";
import {
  onHomepage,
  onGitHubAccessTokenSave,
  onStartSetGitHubToken,
} from "./views/homepage";

global.onHomepage = onHomepage;
global.onGitHubAccessTokenSave = onGitHubAccessTokenSave;
global.onStartSetGitHubToken = onStartSetGitHubToken;
global.onEventStart = onEventStart;
global.onRefresh = onRefresh;
global.onSync = onSync;
