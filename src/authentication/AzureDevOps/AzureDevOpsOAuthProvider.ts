import * as azdev from 'azure-devops-node-api';
import vscode from 'vscode';

import { AzureDevOpsOAuthSession } from './AzureDevOpsOAuthSession';
import { AzureDevOpsApiClient } from '../AzureDevOpsApiClient';
import { AzureDevOps } from '../azuredevops';

interface OAuthSessionData {
  accessToken: string;
  organization: string;
  userId?: string;
}

export class AzureDevOpsOAuthProvider implements vscode.AuthenticationProvider, vscode.Disposable {
  static id = 'azuredevopsoauth';
  private static secretKey = 'AzureDevOpsOAuth';

  private _onDidChangeSessions = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
  readonly onDidChangeSessions = this._onDidChangeSessions.event;

  private currentSession: OAuthSessionData | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly secretStorage: vscode.SecretStorage) {
    this.initialize();
  }

  async getSessions(): Promise<vscode.AuthenticationSession[]> {
    const session = await this.getStoredSession();
    if (session) {
      return [new AzureDevOpsOAuthSession(session.accessToken, session.organization, session.userId)];
    }
    return [];
  }

  private async initialize() {
    this.currentSession = await this.getStoredSession();
    await vscode.commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', !!this.currentSession);

    this.disposables.push(
      this.secretStorage.onDidChange(async (e) => {
        if (e.key === AzureDevOpsOAuthProvider.secretKey) {
          await this.updateSessions();
        }
      }),
    );
  }

  private async getStoredSession(): Promise<OAuthSessionData | undefined> {
    const data = await this.secretStorage.get(AzureDevOpsOAuthProvider.secretKey);
    if (data) {
      try {
        return JSON.parse(data) as OAuthSessionData;
      } catch (err) {
        console.error('Failed to parse stored session:', err);
      }
    }
    return undefined;
  }

  private async updateSessions() {
    const previousSession = this.currentSession;
    this.currentSession = await this.getStoredSession();

    await vscode.commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', !!this.currentSession);

    const added: vscode.AuthenticationSession[] = [];
    const removed: vscode.AuthenticationSession[] = [];

    if (this.currentSession && !previousSession) {
      added.push(new AzureDevOpsOAuthSession(this.currentSession.accessToken, this.currentSession.organization, this.currentSession.userId));
    } else if (!this.currentSession && previousSession) {
      removed.push(new AzureDevOpsOAuthSession(previousSession.accessToken, previousSession.organization, previousSession.userId));
    }

    this._onDidChangeSessions.fire({ added, removed, changed: [] });
  }

  /**
   * Create a new authentication session using Microsoft account authentication
   */
  async createSession(scopes: readonly string[], options?: vscode.AuthenticationGetSessionOptions): Promise<vscode.AuthenticationSession> {
    try {
      // Use VS Code's built-in Microsoft authentication (which is already OAuth-based)
      // This leverages the existing MS authentication provider to get a token
      const msSession = await vscode.authentication.getSession('microsoft', ['499b84ac-1321-427f-aa17-267ca6975798/.default'], {
        createIfNone: true
      });

      const userProfile = await AzureDevOpsApiClient.getUserProfile(msSession.accessToken);
      let organization: AzureDevOps.Organization | undefined;

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching your Azure DevOps organizations...",
        cancellable: false,
      },
      async () => {
        const organizations = await AzureDevOpsApiClient.getUserOrganizations(msSession.accessToken, userProfile.coreAttributes.PublicAlias.value);
        const quickPick = await vscode.window.showQuickPick([
          {
            label: '',
            kind: vscode.QuickPickItemKind.Separator,
          },
          ...organizations.ownerOrganizations.map(org => ({
            label: org.accountName,
          })),
          {
            label: '',
            kind: vscode.QuickPickItemKind.Separator,
          },
          ...organizations.memberOrgs.map(org => ({
            label: org.accountName,
          }))
        ], { placeHolder: 'Select your Azure DevOps organization' });

        if (!quickPick) {
          throw new Error('No organization selected');
        }

        console.log(organizations);

        organization = [...organizations.memberOrgs, ...organizations.ownerOrganizations].find(x => x.accountName === quickPick.label);
      });

      if (!organization) {
        throw new Error('Organization is required for authentication');
      }

      // Use the token to authenticate with Azure DevOps
      const connection = new azdev.WebApi(
        `https://dev.azure.com/${organization.accountName}`,
        azdev.getBearerHandler(msSession.accessToken)
      );

      try {
        const coreApi = await connection.getCoreApi();
        const userInfo = await coreApi.getIdentityMru('me');

        if (!userInfo) {
          throw new Error('Failed to get user information from Azure DevOps');
        }

        // Store the session
        const sessionData: OAuthSessionData = {
          accessToken: msSession.accessToken,
          organization: organization.accountName,
          userId: userInfo[0].id
        };

        await this.secretStorage.store(AzureDevOpsOAuthProvider.secretKey, JSON.stringify(sessionData));
        this.currentSession = sessionData;

        await vscode.commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', true);

        const session = new AzureDevOpsOAuthSession(msSession.accessToken, organization.accountName, userInfo[0].id);
        this._onDidChangeSessions.fire({ added: [session], removed: [], changed: [] });

        return session;
      } catch (error) {
        console.error('Failed to connect to Azure DevOps:', error);

        // If organization is invalid, suggest visiting Azure DevOps portal
        const openPortal = 'Open Azure DevOps Portal';
        const result = await vscode.window.showErrorMessage(
          `Failed to connect to organization "${organization}". Please check if it exists and you have access to it.`,
          openPortal
        );

        if (result === openPortal) {
          await vscode.env.openExternal(vscode.Uri.parse('https://dev.azure.com'));
        }

        throw new Error(`Failed to connect to Azure DevOps: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Authentication failed: ${String(error)}`);
    }
  }

  async removeSession(sessionId: string): Promise<void> {
    await this.secretStorage.delete(AzureDevOpsOAuthProvider.secretKey);

    const previousSession = this.currentSession;
    this.currentSession = undefined;

    await vscode.commands.executeCommand('setContext', 'tasksDevKit.tfx.signed-in', false);

    if (previousSession) {
      const session = new AzureDevOpsOAuthSession(
        previousSession.accessToken,
        previousSession.organization,
        previousSession.userId
      );
      this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
    }
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}