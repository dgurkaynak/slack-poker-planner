import { NodeClient } from '../vendor/olay-node-client';

let olay: NodeClient | undefined;

export function getOlay() {
  if (olay) {
    return olay;
  }

  if (!process.env.OLAY_WS_URL || !process.env.OLAY_WS_PROJECT) {
    return undefined;
  }

  olay = new NodeClient({
    wsRoot: process.env.OLAY_WS_URL,
    project: process.env.OLAY_WS_PROJECT,
  });

  return olay;
}
