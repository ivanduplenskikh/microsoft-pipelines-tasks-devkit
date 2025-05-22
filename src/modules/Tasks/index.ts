import { join } from 'node:path';

import vscode from 'vscode';

import { TaskItem } from './TaskItem';
import { TasksProvider } from './TasksProvider';

export class TasksModule {
  readonly tasksProvider: TasksProvider;

  constructor(context: vscode.ExtensionContext) {
    this.tasksProvider = new TasksProvider(context);
    const fsPath = context.storageUri!.fsPath;

    vscode.window.registerTreeDataProvider('aptd.tasks', this.tasksProvider);
    vscode.commands.registerCommand('aptd.commands.tasks.build', (task: TaskItem) => task.build(fsPath));
    vscode.commands.registerCommand('aptd.commands.tasks.attach-to-process', async () => {
        const success = await vscode.debug.startDebugging(undefined, {
          type: 'node',
          request: 'attach',
          name: 'Attach to Node Process',
          processId: '${command:PickProcess}'
        });

        if (!success) {
          vscode.window.showErrorMessage('Failed to start debugging session.');
        }
    });

    vscode.commands.registerCommand('aptd.commands.tasks.open-sources-folder', async (task: TaskItem) => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const taskFolder = vscode.Uri.file(join(workspaceFolders![0].uri.fsPath, "Tasks", task.getFormattedName()));
      await vscode.commands.executeCommand('revealInExplorer', taskFolder);
    });
  }
}
