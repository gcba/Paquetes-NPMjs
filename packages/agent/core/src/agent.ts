import { KMSClient } from "@extrimian/kms-client";
import { IKMS, LANG } from "@extrimian/kms-core";
import { VCProtocolNotFoundError } from "./exceptions/vc-protocol-not-found";
import { Messaging } from "./messaging/messaging";
import { AgentIdentity } from "./models/agent-identity";
import { AgentKMS } from "./models/agent-kms";
import { IAgentRegistry } from "./models/agent-registry";
import { IAgentResolver } from "./models/agent-resolver";
import { AgentSecureStorage } from "./models/agent-secure-storage";
import { IStorage } from "./models/agent-storage";
import { DID } from "./models/did";
import { ITransport } from "./models/transports/transport";
import { IAgentPlugin } from "./plugins/iplugin";
import { PluginDispatcher } from "./plugins/plugin-dispatcher";
import { AgentTransport } from "./transport/transport";
import { VCProtocol } from "./vc/protocols/vc-protocol";
import { VC } from "./vc/vc";

export class Agent {
    private _messaging: Messaging;

    public get messaging(): Messaging {
        return this._messaging;
    }

    private _vc: VC;

    public get vc(): VC {
        if (!this.identity.getOperationalDID()) {
            throw new Error("You need to create a DID first");
        }
        if (!this._vc) {
            this._vc = new VC({
                messaging: this.messaging,
                agentStorage: this.agentStorage,
                vcStorage: this.vcStorage,
                identity: this.identity,
                kms: this.kms,
                resolver: this.resolver,
                transports: this.agentTransport,
                vcProtocols: this.vcProtocols,
            })
        }
        return this._vc;
    }

    kms: IKMS;

    public identity: AgentIdentity;


    resolver: IAgentResolver;
    registry: IAgentRegistry;
    private agentSecureStorage: AgentSecureStorage;
    private vcStorage: IStorage;
    private agentStorage: IStorage;
    private vcProtocols: VCProtocol[];
    private agentTransport: AgentTransport;
    public agentKMS: AgentKMS;

    public get transport(): AgentTransport {
        return this.agentTransport;
    }

    private plugins: IAgentPlugin[];
    private readonly pluginDispatcher: PluginDispatcher;

    constructor(params: {
        didDocumentResolver: IAgentResolver,
        didDocumentRegistry: IAgentRegistry,
        supportedTransports?: ITransport[],
        secureStorage: AgentSecureStorage,
        agentStorage: IStorage,
        vcStorage: IStorage,
        vcProtocols: VCProtocol[],
        agentPlugins?: IAgentPlugin[],
        mnemonicLang?: LANG
    }) {
        this.agentSecureStorage = params.secureStorage;
        this.vcStorage = params.vcStorage;
        this.agentSecureStorage = params.secureStorage;
        this.agentStorage = params.agentStorage;
        this.pluginDispatcher = new PluginDispatcher(params.agentPlugins);
        this.vcProtocols = params.vcProtocols;

        this.kms = new KMSClient({
            lang: params.mnemonicLang || LANG.en,
            storage: this.agentSecureStorage,
            didResolver: (did: string) => this.resolver.resolve(DID.from(did)),
            mobile: false,
        });

        if (!params.didDocumentResolver) {
            throw new Error("didDocumentResolver is required. You can define a custom resolver that extends AgentDocumentResolver interface or set an universal resolver endpoint URL.");
        }

        if (!params.didDocumentRegistry) {
            throw new Error("didDocumentRegistry is required. You can define a custom registry that extends AgentDocumentRegistry interface or set a modena endpoint URL.");
        }

        this.identity = new AgentIdentity({
            agentStorage: this.agentStorage,
            kms: this.kms,
            registry: this.registry,
            resolver: this.resolver,
        });

        this.resolver = params.didDocumentResolver as IAgentResolver;
        this.registry = params.didDocumentRegistry as IAgentRegistry;
        this.registry.initialize({ kms: this.kms });

        this.agentKMS = new AgentKMS({
            identity: this.identity,
            kms: this.kms,
            resolver: this.resolver
        });

        this.agentTransport = new AgentTransport({
            transports: params.supportedTransports,
            agent: this,
        });

        this.vcProtocols.forEach(vcProtocol => {
            vcProtocol.initialize({
                agent: this,
            });
        });

        this.plugins = params.agentPlugins;
    }

    async initialize(params?: {
        operationalDID?: DID,
    }) {
        await this.identity.initialize({
            operationalDID: params?.operationalDID,
            registry: this.registry,
            resolver: this.resolver,
        });

        if (this.plugins) {
            await Promise.all(this.plugins.map(async x => await x.initialize({ agent: this })));
        }

        if (!this._vc) {
            this._vc = new VC({
                messaging: this.messaging,
                agentStorage: this.agentStorage,
                vcStorage: this.vcStorage,
                identity: this.identity,
                kms: this.kms,
                resolver: this.resolver,
                transports: this.agentTransport,
                vcProtocols: this.vcProtocols,
            });
        }

        this._messaging = new Messaging({
            kms: this.kms,
            identity: this.identity,
            resolver: this.resolver,
            registry: this.registry,
            transport: this.agentTransport,
        });

        this.agentTransport.messageArrived.on(async (data) => {
            await this.processMessage({
                message: data.message,
                transport: data.transport,
                contextMessage: data.contextMessage
            });
        });
    }

    async processMessage(params: {
        message: any,
        transport?: ITransport
        contextMessage?: any
    }) {
        try {
            await this.vc.processMessage(params)
        } catch (error) {
            if (error instanceof VCProtocolNotFoundError) {
                const response = await this.pluginDispatcher.dispatch(
                    {
                        message: params.message,
                        contextMessage: params.contextMessage
                    });

                if (response) {
                    await this.agentTransport.sendMessage({
                        message: response.message,
                        to: response.to,
                        messageContext: params.contextMessage,
                        preferredTransport: params.transport
                    });
                }
            } else {
                throw error;
            }
        }
    }
}