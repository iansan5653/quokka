import { GraphQLClient } from "../util/graphql-client";
import { Status } from "./status";

const token = "TOKEN";

const client = new GraphQLClient("https://api.github.com/graphql", {
  Authorization: `bearer ${token}`,
});

const changeStatusDocument = ({ emoji, message, busy }: Status) => `
  mutation {
    changeUserStatus(input: {emoji: ":${emoji}:", message: "${message}", limitedAvailability: ${busy}}) {
      status {
        emoji
        expiresAt
        limitedAvailability: indicatesLimitedAvailability
        message
      }
    }
  }
`;

function setStatus(status: Status) {
  client.request(changeStatusDocument(status));
}

const clearStatusDocument = `
  mutation {
    changeUserStatus(input: {}) {
      status {
        message
      }
    }
  }
`;

function clearStatus() {
  client.request(clearStatusDocument);
}

export function setOrClearStatus(status: Status | null) {
  return status ? setStatus(status) : clearStatus();
}
