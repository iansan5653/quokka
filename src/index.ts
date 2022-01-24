// You can access any of the global GAS objects in this file. You can also
// import local files or external dependencies:
import {helloWorld} from "./example";

console.log(helloWorld);

export function onHomepage(): GoogleAppsScript.Card_Service.Card[] {
  return [CardService.newCardBuilder().setName("Quokka Home")
    .setHeader(CardService.newCardHeader().setTitle("Quokka Home")).build()]
}

global.onHomepage = onHomepage;
