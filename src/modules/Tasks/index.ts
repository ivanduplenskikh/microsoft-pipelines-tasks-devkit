import { join } from 'node:path';

import vscode from 'vscode';

import { TasksProvider } from './TasksProvider';
import { TaskItem } from './TaskItem';

export class TasksModule {
  readonly tasksProvider: TasksProvider;

  constructor(context: vscode.ExtensionContext) {
    this.tasksProvider = new TasksProvider(context);

    vscode.window.registerTreeDataProvider('aptd.tasks', this.tasksProvider);
    vscode.commands.registerCommand('aptd.commands.tasks.build', (task: TaskItem) => task.build(context.storageUri!.fsPath));

    vscode.commands.registerCommand('aptd.commands.tasks.open-sources-folder', async (task: TaskItem) => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const taskFolder = vscode.Uri.file(join(workspaceFolders![0].uri.fsPath, "Tasks", task.getFormattedName()));
      await vscode.commands.executeCommand('revealInExplorer', taskFolder);
    });
  }
}
