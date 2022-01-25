import { githubAccessToken } from "../quokka/settings";

function SettingsCard() {
  const settingsCardBuilder = CardService.newCardBuilder();

  const header = CardService.newCardHeader().setTitle("Settings");
  settingsCardBuilder.setHeader(header);

  const accessTokenSection = CardService.newCardSection().setHeader(
    "GitHub Authentication"
  );
  const accessTokenInput = CardService.newTextInput()
    .setFieldName("githubAccessToken")
    .setHint("Paste a GitHub PAT with 'user' scope.")
    .setTitle("GitHub PAT");
  const accessTokenOnChange = CardService.newAction()
    .setFunctionName("onGitHubAccessTokenChange")
    .setLoadIndicator(CardService.LoadIndicator.SPINNER);
  accessTokenInput.setOnChangeAction(accessTokenOnChange);
  accessTokenSection.addWidget(accessTokenInput);

  settingsCardBuilder.addSection(accessTokenSection);
  return settingsCardBuilder.build();
}

export function Homepage(): GoogleAppsScript.Card_Service.Card[] {
  return [SettingsCard()];
}

export function onGitHubAccessTokenChange(
  event: GoogleAppsScript.Events.AppsScriptEvent & {
    formInput?: { githubAccessToken?: string };
  }
): GoogleAppsScript.Card_Service.ActionResponse {
  if (event.formInput?.githubAccessToken)
    githubAccessToken.set(event.formInput?.githubAccessToken);

  const notification = CardService.newNotification().setText("✅ Saved");
  const navigation = CardService.newNavigation().updateCard(SettingsCard());
  const responseBuilder = CardService.newActionResponseBuilder();
  responseBuilder.setNotification(notification).setNavigation(navigation);
  return responseBuilder.build();
}
