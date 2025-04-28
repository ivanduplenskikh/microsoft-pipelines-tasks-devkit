import * as vscode from 'vscode';

import { AzureDevOpsAuthenticationProvider } from './AzureDevOps/AzureDevOpsAuthenticationProvider';

export class AuthenticationModule {
  readonly authProvider: AzureDevOpsAuthenticationProvider;

  constructor(context: vscode.ExtensionContext) {
    this.authProvider = new AzureDevOpsAuthenticationProvider(context.secrets);
  }

  registerAuthenticationProvider(): vscode.Disposable {
    return vscode.authentication.registerAuthenticationProvider(
      AzureDevOpsAuthenticationProvider.id,
      'Azure DevOps PAT',
      this.authProvider,
      { supportsMultipleAccounts: false },
    );
  }

  registerLoginCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('tasksDevKit.login', async () => {
      try {
        await vscode.authentication.getSession(AzureDevOpsAuthenticationProvider.id, [], { createIfNone: true });
        vscode.window.showInformationMessage('Successfully logged in to Azure DevOps.');
      } catch (e: any) {
        vscode.window.showErrorMessage(`Login failed: ${e.message}`);
      }
    });
  }

  registerLogoutCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('tasksDevKit.logout', async () => {
      const session = await vscode.authentication.getSession(AzureDevOpsAuthenticationProvider.id, [], {
        createIfNone: false,
      });

      if (session === undefined) {
        vscode.window.showInformationMessage('You are not logged in.');
      } else {
        await this.authProvider.removeSession(session.id);
        vscode.window.showInformationMessage('Successfully logged out of Azure DevOps.');
      }
    });
  }
}
