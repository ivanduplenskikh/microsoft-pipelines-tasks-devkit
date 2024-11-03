import * as vscode from 'vscode';
import { TaskItem, TasksProvider } from './TasksProvider';

export class TasksModule {
  readonly tasksProvider: TasksProvider;

  constructor() {
    this.tasksProvider = new TasksProvider();
    vscode.window.registerTreeDataProvider('tasksDevKit.tasks', this.tasksProvider);
  }

  registerToggleTaskCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('tasksDevKit.toggleTask', (taskItem: TaskItem) => {
      this.tasksProvider.toggleTaskSelection(taskItem);
    });
  }

  registerBuildCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('tasksDevKit.build', () => {
      this.executeTasks('build', this.tasksProvider.getSelectedTasks());
    });
  }

  registerTestCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('tasksDevKit.test', () => {
      this.executeTasks('test', this.tasksProvider.getSelectedTasks());
    });
  }

  registerDeployCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('tasksDevKit.deploy', () => {
      this.executeTasks('deploy', this.tasksProvider.getSelectedTasks());
    });
  }

  private executeTasks(action: 'build' | 'test' | 'deploy', selectedTasks: string[]): void {
    if (selectedTasks.length === 0) {
      vscode.window.showInformationMessage('No tasks selected.');
      return;
    }

    const terminal = vscode.window.createTerminal('Azure Pipelines');

    selectedTasks.forEach((task) => {
      switch (action) {
        case 'build':
          terminal.sendText(`Executing node make.js build --task ${task}`, false);
          break;
        case 'test':
          terminal.sendText(`Executing node make.js test --task ${task}`, false);
          break;
        case 'deploy':
          terminal.sendText(`Executing node make.js build --task ${task}`, false);
          terminal.sendText(`Executing tfx build tasks upload --task-path ./_build/Tasks/${task}`, false);
          break;
      }
    });

    terminal.show();
  }
}
