import { AzureDevOpsPatSession } from './AzureDevOpsPatSession';
import {
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationProviderSessionOptions,
  AuthenticationSession,
  Disposable,
  EventEmitter,
  SecretStorage,
  commands,
  window,
} from 'vscode';

export class AzureDevOpsAuthenticationProvider implements AuthenticationProvider, Disposable {
  static id = 'azuredevopspat';
  private static secretKey = 'AzureDevOpsPAT';

  private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  readonly onDidChangeSessions = this._onDidChangeSessions.event;

  private currentToken: string | undefined;
  private disposables: Disposable[] = [];

  constructor(private readonly secretStorage: SecretStorage) {
    this.initialize();
  }

  async getSessions(
    scopes: readonly string[] | undefined,
    options: AuthenticationProviderSessionOptions,
  ): Promise<AuthenticationSession[]> {
    if (this.currentToken) {
      return [new AzureDevOpsPatSession(this.currentToken)];
    }
    return [];
  }

  private async initialize() {
    this.currentToken = await this.secretStorage.get(AzureDevOpsAuthenticationProvider.secretKey);
    await commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', !!this.currentToken);

    this.disposables.push(
      this.secretStorage.onDidChange(async (e) => {
        if (e.key === AzureDevOpsAuthenticationProvider.secretKey) {
          await this.updateSessions();
        }
      }),
    );
  }

  private async updateSessions() {
    const previousToken = this.currentToken;
    this.currentToken = await this.secretStorage.get(AzureDevOpsAuthenticationProvider.secretKey);

    await commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', !!this.currentToken);

    const added: AuthenticationSession[] = [];
    const removed: AuthenticationSession[] = [];

    if (this.currentToken && !previousToken) {
      added.push(new AzureDevOpsPatSession(this.currentToken));
    } else if (!this.currentToken && previousToken) {
      removed.push(new AzureDevOpsPatSession(previousToken));
    }

    this._onDidChangeSessions.fire({ added, removed, changed: [] });
  }

  async createSession(): Promise<AuthenticationSession> {
    const token = await window.showInputBox({
      prompt: 'Enter your Azure DevOps Personal Access Token (PAT)',
      password: true,
      ignoreFocusOut: true,
    });

    if (!token) {
      throw new Error('PAT is required for authentication');
    }

    await this.secretStorage.store(AzureDevOpsAuthenticationProvider.secretKey, token);
    this.currentToken = token;

    await commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', true);

    const session = new AzureDevOpsPatSession(token);
    this._onDidChangeSessions.fire({ added: [session], removed: [], changed: [] });

    return session;
  }

  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(AzureDevOpsAuthenticationProvider.secretKey);

    const previousToken = this.currentToken;
    this.currentToken = undefined;

    await commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', false);

    if (previousToken) {
      const session = new AzureDevOpsPatSession(previousToken);
      this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
    }
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
