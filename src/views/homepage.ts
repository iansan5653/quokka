import { githubAccessToken } from "../quokka/settings";

function GitHubTokenHintMessage() {
  return CardService.newTextParagraph().setText(
    "A GitHub personal access token (PAT) is required for Quokka to update your status. <a href='https://github.com/settings/tokens/new'>Create a PAT</a> (be sure to select <b>user</b> scope) and paste it below:"
  );
}

function GitHubTokenInput() {
  return CardService.newTextInput()
    .setFieldName("githubAccessToken")
    .setTitle("Personal Access Token");
}

function GitHubTokenSaveButton() {
  const saveAction = CardService.newAction().setFunctionName("onGitHubAccessTokenSave");
  return CardService.newTextButton()
    .setText("Save")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(saveAction);
}

function SetGitHubTokenCard() {
  const header = CardService.newCardHeader().setTitle("Set Access Token");
  const section = CardService.newCardSection()
    .addWidget(GitHubTokenHintMessage())
    .addWidget(GitHubTokenInput())
    .addWidget(GitHubTokenSaveButton());
  return CardService.newCardBuilder().setHeader(header).addSection(section).build();
}

function GitHubTokenStatusMessage(isTokenSet: boolean) {
  return CardService.newTextParagraph().setText(
    isTokenSet
      ? "You are authenticated with GitHub. Thanks!"
      : "Please click below to authenticate with GitHub."
  );
}

function GitHubTokenStartButton(isTokenSet: boolean) {
  const changeAction = CardService.newAction().setFunctionName("onStartSetGitHubToken");
  return CardService.newTextButton()
    .setText(isTokenSet ? "Update Token" : "Authenticate")
    .setTextButtonStyle(
      isTokenSet ? CardService.TextButtonStyle.TEXT : CardService.TextButtonStyle.FILLED
    )
    .setOnClickAction(changeAction);
}

function GitHubTokenStatusCard() {
  const isTokenSet =
    PropertiesService.getUserProperties().getProperty("githubAccessToken") !== null;

  const header = CardService.newCardHeader().setTitle("GitHub Authentication");
  const section = CardService.newCardSection()
    .addWidget(GitHubTokenStatusMessage(isTokenSet))
    .addWidget(GitHubTokenStartButton(isTokenSet));
  return CardService.newCardBuilder().setHeader(header).addSection(section).build();
}

export function Homepage(): GoogleAppsScript.Card_Service.Card[] {
  return [GitHubTokenStatusCard()];
}

export function onStartSetGitHubToken() {
  const navigation = CardService.newNavigation().pushCard(SetGitHubTokenCard());
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

export function onGitHubAccessTokenChange(
  event: GoogleAppsScript.Events.AppsScriptEvent & {
    formInput?: { githubAccessToken?: string };
  }
): GoogleAppsScript.Card_Service.ActionResponse {
  if (event.formInput?.githubAccessToken) githubAccessToken.set(event.formInput?.githubAccessToken);

  const notification = CardService.newNotification().setText("✅ Saved");
  const navigation = CardService.newNavigation().popToRoot();
  const responseBuilder = CardService.newActionResponseBuilder();
  responseBuilder.setNotification(notification).setNavigation(navigation);
  return responseBuilder.build();
}
