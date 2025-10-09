import { Evaluation, SuiteID, VOPRFClient } from "@cloudflare/voprf-ts";
import { toBytes } from "@fileverse/crypto/utils";
import { fromUint8Array } from "js-base64";

export class VOPRFManager {
  private voprfClient: VOPRFClient;
  private suite: SuiteID;
  private evaluationUrl: string;

  constructor(suite: SuiteID, publicKey: string, evaluationUrl: string) {
    this.voprfClient = new VOPRFClient(suite, toBytes(publicKey));
    this.suite = suite;
    this.evaluationUrl = evaluationUrl;
  }

  async getEvaluation(serializedReq: string): Promise<{ evaluation: string }> {
    const response = await fetch(this.evaluationUrl, {
      method: "POST",
      body: JSON.stringify({ evaluationRequest: serializedReq }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }

  async processInput(inputBytes: Uint8Array): Promise<Uint8Array> {
    try {
      const [finData, evalReq] = await this.voprfClient.blind([inputBytes]);
      const serializedReq = fromUint8Array(evalReq.serialize());

      const { evaluation } = await this.getEvaluation(serializedReq);
      const deserializedEval = Evaluation.deserialize(
        this.suite,
        toBytes(evaluation)
      );

      const [output] = await this.voprfClient.finalize(
        finData,
        deserializedEval
      );
      if (!output) throw new Error("VOPRF finalization returned no output");

      return output;
    } catch (error) {
      throw new Error(
        `VOPRF processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
