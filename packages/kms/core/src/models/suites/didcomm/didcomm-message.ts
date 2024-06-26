import { DIDCommMessagePacking, IDIDCommMessage, IDIDCommOptions } from "./didcomm-message-media-type"

export interface IPackDIDCommMessageArgs {
    message: IDIDCommMessage
    packing: DIDCommMessagePacking
    keyRef?: string
    options?: IDIDCommOptions
}