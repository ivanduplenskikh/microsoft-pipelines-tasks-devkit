import { existsSync, linkSync, symlinkSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import vscode from 'vscode';

import { AuthenticationModule } from './modules/Authentication';
import { TasksModule } from './modules/Tasks';
import { AgentModule } from './modules/Agent';

export async function activate(context: vscode.ExtensionContext) {
  prepareEnvironment(context);

  new AuthenticationModule(context);
  new AgentModule(context);
  new TasksModule(context),

  vscode.commands.registerCommand(
    'aptd.openSettings',
    () => vscode.commands.executeCommand('setContext', 'aptd.isCompleted', false)
  );

  vscode.commands.registerCommand(
    'aptd.letsGo',
    () => vscode.commands.executeCommand('setContext', 'aptd.isCompleted', true)
  );

  vscode.commands.registerCommand('aptd.linkAgent', () => linkAgent(context));
  vscode.commands.registerCommand('aptd.unlinkAgent', () => unlinkAgent(context));

  console.log('Congratulations, your extension "microsoft-pipelines-tasks-devkit" is now active!');
}

async function unlinkAgent(context: vscode.ExtensionContext) {
  try {
    const linkPath = join(context.storageUri!.fsPath, 'agent');
    console.log(`Unlinking agent folder at: ${linkPath}`);
    unlinkSync(linkPath);
    vscode.window.showInformationMessage(`Agent folder unlinked successfully!`);
    vscode.commands.executeCommand('setContext', 'aptd.isAgentSetup', false);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to unlink the agent folder: ${error}`);
  }
}

async function linkAgent(context: vscode.ExtensionContext) {
  const folderUris = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: 'Select Folder'
  });

  if (!folderUris || folderUris.length === 0) {
    return;
  }

  const agentPath = folderUris[0].fsPath;

  if (!existsSync(join(agentPath, "_work"))) {
    vscode.window.showErrorMessage(`The selected folder is not a valid agent folder. Please select a valid agent folder.`);
    return;
  }

  const linkPath = join(context.storageUri!.fsPath, 'agent');
  symlinkSync(agentPath, linkPath);
  vscode.window.showInformationMessage(`Agent folder linked successfully!\n${linkPath}`);
  vscode.commands.executeCommand('setContext', 'aptd.isAgentSetup', true);
}

async function prepareEnvironment(context: vscode.ExtensionContext) {
  if (!context.storageUri) {
    return;
  }

  if (!existsSync(context.storageUri.toString())) {
    await vscode.workspace.fs.createDirectory(context.storageUri);
  }

  vscode.commands.executeCommand('setContext', 'aptd.isAgentSetup', existsSync(join(context.storageUri.fsPath, 'agent')));
};

export function deactivate() {}