import { DIDDocument, Purpose } from "@extrimian/did-core";
import { VerifiableCredential } from "@extrimian/vc-core";
import { IKeyPair } from "../keypair";

export interface IVCJsonLDKeyPair extends IKeyPair {
    readonly id?: string;
    readonly controller?: string;
}

export interface IVCSuite {
    loadSuite(params: {
        secrets: IVCJsonLDKeyPair,
        useCache: boolean,
    });
    sign: (documentToSign: string, did: string, verificationMethodId: string, porpuse: Purpose) => Promise<any>;
}