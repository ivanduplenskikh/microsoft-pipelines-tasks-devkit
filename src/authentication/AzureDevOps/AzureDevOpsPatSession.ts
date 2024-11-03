import { AuthenticationSession, AuthenticationSessionAccountInformation } from 'vscode';

export class AzureDevOpsPatSession implements AuthenticationSession {
  id: string;
  account: AuthenticationSessionAccountInformation;
  scopes: readonly string[];
  accessToken: string;

  constructor(token: string) {
    this.id = 'azuredevopspat';
    this.accessToken = token;
    this.account = { id: 'Azure DevOps', label: 'Personal Access Token' };
    this.scopes = [];
  }
}
