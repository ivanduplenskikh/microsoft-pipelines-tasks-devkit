import vscode from 'vscode';

import { AzureDevOpsOAuthProvider } from './AzureDevOpsOAuthProvider';

export class AuthenticationModule {
  readonly oauthAuthProvider: AzureDevOpsOAuthProvider;

  constructor(context: vscode.ExtensionContext) {
    console.log('Registering authentication provider');

    this.oauthAuthProvider = new AzureDevOpsOAuthProvider(context);
    vscode.authentication.registerAuthenticationProvider(
      AzureDevOpsOAuthProvider.id,
      'Azure DevOps',
      this.oauthAuthProvider,
      { supportsMultipleAccounts: false },
    );

    vscode.commands.registerCommand('aptd.walkthrough.connect-to-organization', async () => {
      await vscode.authentication.getSession(AzureDevOpsOAuthProvider.id, [], { createIfNone: true });
    });

    vscode.commands.registerCommand('aptd.switchOrganization', async () => {
        await this.oauthAuthProvider.switchOrganization();
    });

    vscode.commands.registerCommand('aptd.walkthrough.logout', async () => {
      await this.oauthAuthProvider.removeSession();
    });
  }
}