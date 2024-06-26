import { PresentationSubmission } from './credential-application';

export type CredentialManifest = {
  id: string;
  media_type: string;
  format: 'dif/credential-manifest/manifest@v1.0';
  data: {
    json: {
      options: {
        challenge: string;
        domain?: string;
      };
      credential_manifest: {
        id: string;
        version: string;
        issuer: {
          id: string;
          name: string;
          styles?: CredentialManifestStyles;
        };
        format?: ClaimFormat;
        output_descriptors: OutputDescriptor[];
        presentation_definition?: PresentationDefinition;
      };
    };
  };
};

export type CredentialFulfillment = {
  id: string;
  media_type: 'application/json';
  format: 'dif/credential-manifest/fulfillment@v1.0';
  data: {
    json: {
      '@context': string[];
      type: string[];
      credential_fulfillment: {
        id: string;
        manifest_id: string;
        descriptor_map: {
          id: string;
          format: string;
          path: string;
        }[];
      };
      verifiableCredential: any[];
    };
  };
};

export type CredentialRequest = {
  id: string;
  media_type: string;
  format: 'dif/presentation-exchange/definitions@v1.0';
  data: {
    json: {
      options: {
        challenge: string;
        domain?: string;
      };
      presentation_definition?: PresentationDefinition;
    };
  };
};

export type CredentialPresentation = {
  id: string;
  media_type: string;
  format: 'dif/presentation-exchange/submission@v1.0';
  data: {
    json: {
      '@context': string[];
      type: string[];
      holder: string;
      verifiableCredential: any[];
      presentation_submission: PresentationSubmission;
      proof: {
        type: string;
        verificationMethod: string;
        created: string;
        proofPurpose: string;
        challenge: string;
        jws: string;
      };
    };
  };
};

export type OutputDescriptor = {
  id: string;
  schema?: string;
  display?: {
    title?: DisplayMappingObject;
    subtitle?: DisplayMappingObject;
    description?: DisplayMappingObject;
    properties?: (DisplayMappingObject & { label?: string })[];
  };
  styles: CredentialManifestStyles;
};

export type DisplayMappingObject =
  | {
    path?: string[];
    schema?: {
      type?: string;
    };
    fallback?: string;
  }
  | { text: string };

export type ClaimFormat = {
  jwt?: {
    alg: string[];
  };
  jwt_vc?: {
    alg: string[];
  };
  jwt_vp?: {
    alg: string[];
  };
  ldp_vc?: {
    proof_type: string[];
  };
  ldp_vp?: {
    proof_type: string[];
  };
  ldp?: {
    proof_type: string[];
  };
};

export type PresentationDefinitionFrame = {
  '@context': string[];
  type: string[];
  credentialSubject: {
    "@explicit": boolean;
    type: string[];
    [key: string]: {};
  };
}

export type PresentationDefinition = {
  id: string;
  input_descriptors: InputDescriptor[];
  frame?: PresentationDefinitionFrame;
  name?: string;
  purpose?: string;
  format?: ClaimFormat;
};

export type InputDescriptor = {
  id: string;
  constraints: {
    fields: {
      path: string[];
      id?: string;
      purpose?: string;
      filter?: {
        type: string;
        const?: any;
      };
    }[];
  };
  name?: string;
  purpose?: string;
  format?: ClaimFormat;
};

export type CredentialManifestStyles = {
  thumbnail?: ThumbnailImage;
  hero?: ThumbnailImage;
  background?: ColorDefinition;
  text?: ColorDefinition;
}

export type ColorDefinition = {
  color: string;
}

export type ThumbnailImage = {
  uri: string;
  alt: string;
}