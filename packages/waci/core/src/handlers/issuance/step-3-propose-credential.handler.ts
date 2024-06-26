import { RegisterHandler } from '../decorators/register-handler.decorator';
import {
  WACIMessage,
  WACIMessageHandler,
  WACIMessageHandlerResponse,
  WACIMessageResponseType,
  WACIMessageType,
  Actor,
  CredentialManifest,
  CredentialFulfillment,
  PresentationDefinition,
  InputDescriptor,
  OutputDescriptor,
  PresentationDefinitionFrame,
} from '../../types';
import { createUUID } from '../../utils';
import { callbacks } from '../../callbacks';

export type OfferCredentialMessageParamsBase =
  | OfferCredentialMessageParams
  | OfferCredentialMessageParamsFailed
  | OfferCredentialMessageParamsAsyncProcess;

export type OfferCredentialMessageParams = {
  issuerDid: string;
  issuerName: string;
  issuerStyles: any;
  output: {
    outputDescriptor: OutputDescriptor;
    verifiableCredential: any;
    //Verificar de donde sale este dato
    format: 'ldp_vc' | '';
  }[];
  input?: InputDescriptor[];
  frame?: PresentationDefinitionFrame;
  result?: OfferCredentialMessageResult.Succeded;
};

export type OfferCredentialMessageParamsFailed = {
  result?: OfferCredentialMessageResult.Failed;
  errorMessage?: string;
};

export type OfferCredentialMessageParamsAsyncProcess = {
  result?: OfferCredentialMessageResult.AsyncProcess;
  errorMessage?: string;
};

@RegisterHandler(Actor.Issuer, WACIMessageType.ProposeCredential)
export class ProposeCredentialHandler implements WACIMessageHandler {
  async handle(
    messageThread: WACIMessage[],
  ): Promise<WACIMessageHandlerResponse> {
    const message = messageThread[messageThread.length - 1];
    const holderDID = message.from;
    const issuerDID = message.to[0];
    const invitationId = message.pthid;
    const credentialManifestParams = await callbacks[
      Actor.Issuer
    ].getCredentialManifest({
      invitationId: invitationId,
      holderDid: holderDID,
      message,
    });

    credentialManifestParams.result =
      credentialManifestParams.result || OfferCredentialMessageResult.Succeded;

    if (
      credentialManifestParams.result == OfferCredentialMessageResult.Succeded
    ) {
      const credentialManifest = this.createMessage(credentialManifestParams);

      return {
        responseType: WACIMessageResponseType.ReplyThread,
        message: {
          type: WACIMessageType.OfferCredential,
          id: createUUID(),
          thid: message.id,
          from: issuerDID,
          to: [holderDID],
          body: {},
          attachments: credentialManifest,
        },
      };
    } else if (
      credentialManifestParams.result == OfferCredentialMessageResult.Failed
    ) {
      //TODO Return waci fail message if exist
    }

    //If credentialManifestParams.result == OfferCredentialMessageResult.AsyncProcess do nothing
  }

  private createMessage(
    params: OfferCredentialMessageParams,
  ): (CredentialManifest | CredentialFulfillment)[] {
    const manifestId = createUUID();
    const presentationDefinition: PresentationDefinition = params.input?.length
      ? {
        id: createUUID(),
        input_descriptors: params.input,
        frame: params.frame,
      }
      : undefined;

      
    return [
      {
        id: createUUID(),
        media_type: 'application/json',
        format: 'dif/credential-manifest/manifest@v1.0',
        data: {
          json: {
            options: {
              challenge: createUUID(),
            },
            credential_manifest: {
              id: manifestId,
              version: '0.1.0',
              issuer: {
                id: params.issuerDid,
                name: params.issuerName,
                styles: params.issuerStyles
              },
              presentation_definition: presentationDefinition,
              output_descriptors: params.output.map(
                (descriptors) => descriptors.outputDescriptor,
              ),
            },
          },
        },
      },
      {
        id: createUUID(),
        media_type: 'application/json',
        format: 'dif/credential-manifest/fulfillment@v1.0',
        data: {
          json: {
            '@context': [
              'https://extrimian.blob.core.windows.net/rskec/credentialsv1.jsonld',
              'https://extrimian.blob.core.windows.net/rskec/credential-manifestfulfillmentv1.jsonld',
            ],
            type: ['VerifiablePresentation', 'CredentialFulfillment'],
            credential_fulfillment: {
              id: createUUID(),
              manifest_id: manifestId,
              descriptor_map: params.output.map((descriptor, index) => {
                return {
                  id: descriptor.outputDescriptor.id,
                  format: descriptor.format || 'ldp_vp',
                  path: `$.verifiableCredential[${index}]`,
                };
              }),
            },
            verifiableCredential: params.output.map(
              (vcData) => vcData.verifiableCredential,
            ),
          },
        },
      },
    ];
  }
}

export enum OfferCredentialMessageResult {
  Succeded,
  Failed,
  AsyncProcess,
}
