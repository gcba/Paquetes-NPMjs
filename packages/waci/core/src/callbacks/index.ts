import {
  CredentialFulfillment,
  Actor,
  CredentialManifest,
  InputDescriptor,
  PresentationDefinitionFrame,
  WACIMessage,
} from '../types';
import { OfferCredentialMessageParamsBase } from '../handlers/issuance/step-3-propose-credential.handler';

export type Callback<TInput = any, TOutput = any> = (
  input: TInput,
) => Promise<TOutput>;

export type InputCallbacks = {
  [Actor.Holder]?: {
    getHolderDID: Callback<{ message: WACIMessage }, string>;
    // Issuance flow
    getCredentialApplication: Callback<
      { manifest: CredentialManifest; fulfillment: CredentialFulfillment, message?: WACIMessage },
      { credentialsToPresent: any[]; presentationProofTypes: string[] }
    >;
    // Verification flow
    getCredentialPresentation: Callback<
      {
        inputDescriptors: InputDescriptor[],
        frame?: PresentationDefinitionFrame,
        message?: WACIMessage
      },
      { credentialsToPresent: any[] }
    >;
    signPresentation: Callback<{
      contentToSign: any;
      challenge: string;
      domain?: string;
      message?: WACIMessage;
    }>;
    handleCredentialFulfillment: Callback<{ credentialFulfillment: CredentialFulfillment[], message: WACIMessage }, boolean>;
    handlePresentationAck: Callback<{ status: any, message: WACIMessage }, void>;
  };

  [Actor.Issuer]?: {
    getCredentialManifest: Callback<
      { invitationId: string; holderDid: string, message: WACIMessage },
      OfferCredentialMessageParamsBase
    >;
    signCredential: Callback<{ vc: any, message: WACIMessage }, any>;
    verifyCredential: Callback<any, { result: boolean; error?: any }>;
    credentialVerificationResult?: Callback<{ result: boolean; error?: any, thid: string, vcs: any[], message: WACIMessage }, void>;
    verifyPresentation: Callback<
      { presentation: any; challenge: string },
      { result: boolean; error?: any }
    >;
    handleIssuanceAck: Callback<{ status: any, from: string, pthid: string, thid: string, message: WACIMessage }, void>;
  };
  [Actor.Verifier]?: {
    getPresentationDefinition: Callback<
      { invitationId: string },
      {
        inputDescriptors: InputDescriptor[],
        frame?: PresentationDefinitionFrame,
      }
    >;
    credentialVerificationResult?: Callback<{ result: boolean; error?: any, thid: string, vcs: any[], message: WACIMessage }, void>;
    verifyCredential: Callback<any, { result: boolean; error?: any }>;
    verifyPresentation: Callback<
      { presentation: any; challenge: string },
      { result: boolean; error?: any }
    >;
  };
};

export const callbacks: InputCallbacks = {} as any;
