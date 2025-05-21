import vscode from 'vscode';

import { AzureDevOpsOAuthProvider } from './AzureDevOpsOAuthProvider';

export class AuthenticationModule {
  readonly oauthAuthProvider: AzureDevOpsOAuthProvider;

  constructor(context: vscode.ExtensionContext) {
    this.oauthAuthProvider = new AzureDevOpsOAuthProvider(context);
    vscode.authentication.registerAuthenticationProvider(
      AzureDevOpsOAuthProvider.id,
      'Azure DevOps',
      this.oauthAuthProvider,
      { supportsMultipleAccounts: false },
    );

    vscode.commands.registerCommand('aptd.connectToOrganization', async () => {
      try {
        await vscode.authentication.getSession(AzureDevOpsOAuthProvider.id, [], { createIfNone: true });
      } catch (e: any) {
        vscode.window.showErrorMessage(`OAuth login failed: ${e.message}.`);
        await vscode.commands.executeCommand("setContext", "aptd.isAuthorized", false);
      }
    });

    vscode.commands.registerCommand('aptd.switchOrganization', async () => {
        await this.oauthAuthProvider.switchOrganization();
    });

    vscode.commands.registerCommand('aptd.logout', async () => {
      await this.oauthAuthProvider.removeSession();
    });
  }
}