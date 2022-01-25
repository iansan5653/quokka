export type Headers = Record<string, string>;

/**
 * A very bare-bones graphQL client to which more functionality can be added if necessary.
 * We can't use a library for this because Google Apps Script doesn't support browser or
 * Node APIs.
 */
export class GraphQLClient {
  constructor(private readonly url: string, private readonly headers: Headers) {}

  private buildPayload(document: string, variables?: object): string {
    const payload = JSON.stringify({
      query: `
        ${document}
        ${variables ? `variables ${JSON.stringify(variables)}` : ""}
      `,
    });
    console.log(payload);
    return payload;
  }

  public request(document: string, variables?: object): void {
    const response = UrlFetchApp.fetch(this.url, {
      contentType: "application/json",
      headers: this.headers,
      method: "post",
      payload: this.buildPayload(document, variables),
    });
    console.log(response.toString());
  }
}
