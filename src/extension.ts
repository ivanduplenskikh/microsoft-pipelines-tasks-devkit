import vscode from 'vscode';

import { AuthenticationModule } from './authentication/module';
import { TasksModule } from './tasks/module';

export async function activate(context: vscode.ExtensionContext) {
  new AuthenticationModule(context);
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