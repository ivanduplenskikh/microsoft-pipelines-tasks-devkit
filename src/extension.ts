import * as vscode from 'vscode';
import { TaskItem, TasksProvider } from './Provider/TasksProvider';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showInformationMessage('No workspace folder open.');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const tasksProvider = new TasksProvider(rootPath);
  vscode.window.registerTreeDataProvider('tasksDevKit.tasks', tasksProvider);

  console.log('Congratulations, your extension "microsoft-pipelines-tasks-devkit" is now active!');

  const disposable = vscode.commands.registerCommand('microsoft-pipelines-tasks-devkit.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from microsoft-pipelines-tasks-devkit!');
  });

  // Register the commands
  context.subscriptions.push(
    vscode.commands.registerCommand('tasksDevKit.toggleTask', (taskItem: TaskItem) => {
      tasksProvider.toggleTaskSelection(taskItem);
    }),

    vscode.commands.registerCommand('tasksDevKit.build', () => {
      executeTasks('build', tasksProvider.getSelectedTasks());
    }),

    vscode.commands.registerCommand('tasksDevKit.test', () => {
      executeTasks('test', tasksProvider.getSelectedTasks());
    }),

    vscode.commands.registerCommand('tasksDevKit.deploy', () => {
      executeTasks('deploy', tasksProvider.getSelectedTasks());
    }),
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function executeTasks(action: 'build' | 'test' | 'deploy', selectedTasks: string[]) {
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
