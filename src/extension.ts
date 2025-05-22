import { existsSync, symlinkSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import vscode from 'vscode';

import { AuthenticationModule } from './modules/Authentication';
import { TasksModule } from './modules/Tasks';
import { AgentModule } from './modules/Agent';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Activating extension');

  prepareEnvironment(context);

  new AuthenticationModule(context);
  new AgentModule(context);
  new TasksModule(context),

  vscode.commands.registerCommand(
    'aptd.openSettings',
    () => vscode.commands.executeCommand('setContext', 'aptd.is-completed', false)
  );

  vscode.commands.registerCommand(
    'aptd.letsGo',
    () => vscode.commands.executeCommand('setContext', 'aptd.is-completed', true)
  );

  vscode.commands.registerCommand('aptd.walkthrough.link-agent', () => linkAgent(context));
  vscode.commands.registerCommand('aptd.walkthrough.relink-agent', () => relinkAgent(context));
  vscode.commands.registerCommand('aptd.walkthrough.unlink-agent', () => unlinkAgent(context));

  console.log('Congratulations, your extension "microsoft-pipelines-tasks-devkit" is now active!');
}

async function unlinkAgent(context: vscode.ExtensionContext) {
  try {
    const linkPath = join(context.storageUri!.fsPath, 'agent');
    console.log(`Unlinking agent folder at: ${linkPath}`);
    unlinkSync(linkPath);
    vscode.window.showInformationMessage(`Agent folder unlinked successfully!`);
    vscode.commands.executeCommand('setContext', 'aptd.is-agent-linked', false);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to unlink the agent folder: ${error}`);
  }
}

async function relinkAgent(context: vscode.ExtensionContext) {
  unlinkAgent(context);
  linkAgent(context);
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
  vscode.commands.executeCommand('setContext', 'aptd.is-agent-linked', true);
}

async function prepareEnvironment(context: vscode.ExtensionContext) {
  if (!context.storageUri) {
    return;
  }

  if (!existsSync(context.storageUri.toString())) {
    await vscode.workspace.fs.createDirectory(context.storageUri);
  }

  vscode.commands.executeCommand('setContext', 'aptd.is-agent-linked', existsSync(join(context.storageUri.fsPath, 'agent')));
};

export function deactivate() {}