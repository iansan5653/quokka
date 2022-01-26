import { githubAccessToken } from "../quokka/settings";
import { GraphQLClient } from "../util/graphql-client";
import { Status } from "./status";

class GitHubClient extends GraphQLClient {
  constructor(token: string) {
    super("https://api.github.com/graphql", {
      Authorization: `bearer ${token}`,
    });
  }

  public setStatus({ emoji, message, busy, expiresAt }: Status) {
    console.log(`Setting GitHub status to ${emoji}: ${message}`);
    this.request(`
      mutation {
        changeUserStatus(input: {emoji: ":${emoji}:", message: "${message}", limitedAvailability: ${busy}${
      expiresAt ? `, expiresAt: "${expiresAt.toISOString()}"` : ""
    }}) {
          status {
            emoji
            expiresAt
            limitedAvailability: indicatesLimitedAvailability
            message
          }
        }
      }
    `);
  }

  public clearStatus() {
    this.request(`
      mutation {
        changeUserStatus(input: {}) {
          status {
            message
          }
        }
      }
    `);
  }
}

export function setOrClearStatus(status: Status | null) {
  const token = githubAccessToken.get();
  const client = new GitHubClient(token);
  return status ? client.setStatus(status) : client.clearStatus();
}
