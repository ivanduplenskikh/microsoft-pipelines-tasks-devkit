import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import vscode from 'vscode';

import { TasksProvider } from './TasksProvider';
import { TaskItem } from './TaskItem';

export class TasksModule {
  readonly tasksProvider: TasksProvider;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.tasksProvider = new TasksProvider(context);

    vscode.window.registerTreeDataProvider('aptd.tasks', this.tasksProvider);

    vscode.commands.registerCommand('aptd.toggleTask', (x: string) => this.tasksProvider.toggleTaskSelection(x));
    vscode.commands.registerCommand('aptd.build', () => this.executeTasks('build', this.tasksProvider.getSelected()));
    vscode.commands.registerCommand('aptd.test',() => this.executeTasks('test', this.tasksProvider.getSelected()));
    vscode.commands.registerCommand('aptd.deploy', () => this.executeTasks('deploy', this.tasksProvider.getSelected()));

    vscode.commands.registerCommand('aptd.openTheTaskInFolderStructure', async (task: TaskItem) => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const taskFolder = vscode.Uri.file(join(workspaceFolders![0].uri.fsPath, "Tasks", task.getFormattedName()));
      await vscode.commands.executeCommand('revealInExplorer', taskFolder);
    });
  }

  private async executeTasks(action: 'build' | 'test' | 'deploy', selectedTasks: TaskItem[]) {
    if (selectedTasks.length === 0) {
      vscode.window.showInformationMessage('No tasks selected.');
      return;
    }

    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Azure Pipelines');

    switch (action) {
      case 'build':
        terminal.sendText(`node make.js build --task "@(${selectedTasks.map(x => x.label).join("|")})" --include-sourcemap`);

        selectedTasks.forEach(task => {
          const agentTaskPath = join(this.context.storageUri!.fsPath, "agent/_work/_tasks", task.getWorkName());

          if (!existsSync(agentTaskPath)) {
            mkdirSync(agentTaskPath);
          }

          const taskFolderPath = join(agentTaskPath, task.getVersion());
          writeFileSync(`${join(agentTaskPath, task.getVersion())}.completed`, new Date().toLocaleDateString());

          if (existsSync(taskFolderPath)) {
            if (lstatSync(taskFolderPath).isSymbolicLink()) {
              console.log(`Symlink for task already exists, skipping creation:\n${taskFolderPath}`);
              unlinkSync(taskFolderPath);
            } else {
            rmSync(taskFolderPath, { recursive: true, force: true });
            }
          }

          symlinkSync(vscode.Uri.file(join(vscode.workspace.workspaceFolders![0].uri.fsPath, "_build/Tasks", task.getFormattedName())).fsPath, taskFolderPath);
        });
        break;
      case 'test':
        terminal.sendText(`node make.js test --task "@(${selectedTasks.join("|")})"`);
        break;
      case 'deploy':
        vscode.window.showInformationMessage('Deploying tasks is not implemented yet.');
        break;
      default:
        vscode.window.showErrorMessage(`Unknown action: ${action}`);
    }

    terminal.show();
  }
}
