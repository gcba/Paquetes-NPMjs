import { CredentialStatus, CredentialStatusType } from "@quarkid/vc-core";

export class QuarkIDCredentialStatus extends CredentialStatus {
    type: QuarkIDCredentialStatusType | any;
    persistanceType: PersistanceType;
    bitArrayIndex: number;
    bitArraySC: string;
    bitArrayID: number | string;
}

export enum PersistanceType {
    IPFS = "IPFS"
}

export enum QuarkIDCredentialStatusType {
    BitArrayStatusEntry = "bitArrayStatusEntry",
    RevocationList2020Status = "RevocationList2020Status",
    CredentialStatusList2017 = "CredentialStatusList2017"
}