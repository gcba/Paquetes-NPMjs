import { isNil } from 'lodash';
import { RegisterHandler } from '../decorators/register-handler.decorator';
import {
  WACIMessage,
  WACIMessageHandler,
  WACIMessageHandlerResponse,
  WACIMessageType,
  WACIMessageResponseType,
  Actor,
  CredentialManifest,
  CredentialFulfillment,
} from '../../types';
import {
  extractExpectedChallenge,
  createUUID,
  verifyPresentation,
} from '../../utils';
import { callbacks } from '../../callbacks';
import { ProblemReportMessage } from '../../types/problem-report';

@RegisterHandler(Actor.Issuer, WACIMessageType.RequestCredential)
export class RequestCredentialHandler implements WACIMessageHandler {
  async handle(
    messageThread: WACIMessage[],
  ): Promise<WACIMessageHandlerResponse | void> {
    const messageToProcess = messageThread[messageThread.length - 1];
    const holderDID = messageToProcess.from;
    const issuerDID = messageToProcess.to[0];
    const problemReport = new ProblemReportMessage();
    const offerCredentialMessage = messageThread.find(
      (message) => message.type === WACIMessageType.OfferCredential,
    );

    const manifests: CredentialManifest[] =
      offerCredentialMessage.attachments.filter(
        (attachment) => !isNil(attachment?.data?.json?.credential_manifest),
      );

    const applicationsToCheck = manifests
      .filter(
        (manifest) =>
          !isNil(
            manifest?.data?.json?.credential_manifest?.presentation_definition,
          ),
      )
      .map((manifest) => ({
        presentationDefinition:
          manifest.data.json.credential_manifest.presentation_definition,
        application: messageToProcess.attachments.find(
          (attachment) =>
            attachment.data.json.credential_application.manifest_id ===
            manifest.data.json.credential_manifest.id,
        ),
      }));

    const verificationResultCallback = callbacks[Actor.Issuer]?.credentialVerificationResult;
    let vcs = [];

    if (
      applicationsToCheck.every((applicationToCheck) =>
        !isNil(applicationToCheck.application),
      )
    ) {
      for await (const applicationToCheck of applicationsToCheck) {
        const verify = await verifyPresentation(
          applicationToCheck.presentationDefinition,
          applicationToCheck.application,
          callbacks[Actor.Issuer].verifyCredential,
        );
        let result = verify.result;

        for (let vc of verify.vcs) {
          vcs.push(vc);
        }

        if (!result) {
          if (verificationResultCallback) {
            verificationResultCallback({
              result: verify.result,
              error: verify.erorrs,
              thid: messageToProcess.thid,
              vcs: verify.vcs,
              message: messageToProcess,
            })
          }

          return {
            responseType: WACIMessageResponseType.ReplyThread,
            message: {
              type: WACIMessageType.ProblemReport,
              id: createUUID(),
              thid: messageToProcess.id,
              from: issuerDID,
              to: [holderDID],
              body: problemReport.presentProofMessage(
                verify.error.name,
                verify.error.description,
              ),
            },
          };
        }

        if (applicationsToCheck.length) {
          const challengeToCheck = extractExpectedChallenge(
            offerCredentialMessage,
          );

          const presentation = messageToProcess.attachments[0].data.json;
          const verifyPresentationResult = await callbacks[
            Actor.Issuer
          ].verifyPresentation({ presentation, challenge: challengeToCheck });

          if (!verifyPresentationResult.result) {
            return {
              responseType: WACIMessageResponseType.ReplyThread,
              message: {
                type: WACIMessageType.ProblemReport,
                id: createUUID(),
                thid: messageToProcess.id,
                from: issuerDID,
                to: [holderDID],
                body: problemReport.presentProofMessage(
                  verifyPresentationResult.error.name,
                  verifyPresentationResult.error.description,
                ),
              },
            };
          }

        }
      }

      if (verificationResultCallback) {
        verificationResultCallback({
          result: true,
          error: null,
          thid: messageToProcess.thid,
          vcs: vcs,
          message: messageToProcess,
        })
      }
    }


    const fulfillments: CredentialFulfillment[] =
      offerCredentialMessage.attachments.filter(
        (attachment) =>
          !isNil(attachment?.data?.json?.credential_fulfillment),
      );

    return {
      responseType: WACIMessageResponseType.ReplyThread,
      message: {
        type: WACIMessageType.IssueCredential,
        id: createUUID(),
        thid: messageToProcess.thid,
        from: issuerDID,
        to: [holderDID],
        body: {},
        attachments: await Promise.all(
          fulfillments.map(async ({ data: { json } }) => ({
            id: createUUID(),
            media_type: 'application/json',
            format: 'dif/credential-manifest/fulfillment@v1.0',
            data: {
              json: {
                ...json,
                verifiableCredential: await Promise.all(
                  json.verifiableCredential.map((vc) => {
                    return callbacks[Actor.Issuer].signCredential({ vc: vc, message: messageToProcess })
                  }),
                ),
              },
            },
          })),
        ),
      },
    };
  }
}


