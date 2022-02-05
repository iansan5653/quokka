import { loadNextBatch } from "../quokka/load-batch";
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

function RefreshHintMessage() {
  return CardService.newTextParagraph().setText(
    "If you are experiencing any issues with the app, try refreshing below."
  );
}

function RefreshButton() {
  const refreshAction = CardService.newAction().setFunctionName("onRefresh");
  return CardService.newTextButton()
    .setText("Force Refresh")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(refreshAction);
}

function RefreshCard() {
  const header = CardService.newCardHeader().setTitle("Force Refresh");
  const section = CardService.newCardSection()
    .addWidget(RefreshHintMessage())
    .addWidget(RefreshButton());
  return CardService.newCardBuilder().setHeader(header).addSection(section).build();
}

export function Homepage(): GoogleAppsScript.Card_Service.Card[] {
  return [GitHubTokenStatusCard(), RefreshCard()];
}

export function onStartSetGitHubToken() {
  const navigation = CardService.newNavigation().pushCard(SetGitHubTokenCard());
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

export function onGitHubAccessTokenSave(
  event: GoogleAppsScript.Events.AppsScriptEvent & {
    formInput?: { githubAccessToken?: string };
  }
): GoogleAppsScript.Card_Service.ActionResponse {
  if (event.formInput?.githubAccessToken) githubAccessToken.set(event.formInput?.githubAccessToken);
  console.log("Saved new PAT");
  loadNextBatch();
  const notification = CardService.newNotification().setText("✅ Token saved");
  const navigation = CardService.newNavigation().popToRoot();
  const responseBuilder = CardService.newActionResponseBuilder();
  responseBuilder.setNotification(notification).setNavigation(navigation);
  return responseBuilder.build();
}

export function onHomepage() {
  return Homepage();
}
