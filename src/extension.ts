import vscode from 'vscode';

import { AuthenticationModule } from './modules/Authentication';
import { TasksModule } from './modules/Tasks';
import { AgentModule } from './modules/Agent';

export async function activate(context: vscode.ExtensionContext) {
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

  console.log('Congratulations, your extension "microsoft-pipelines-tasks-devkit" is now active!');
}

export function deactivate() {}