import { join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';

import vscode from 'vscode';

import { TaskItem } from './TaskItem';

export class TasksProvider implements vscode.TreeDataProvider<TaskItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TaskItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined> = this._onDidChangeTreeData.event;

  private tasks: TaskItem[] = [];

  constructor() {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || !workspaceFolders[0].uri.fsPath) {
      vscode.commands.executeCommand('setContext', 'aptd.hasTasksFolderStructure', false);
      return;
    }

    vscode.commands.executeCommand('setContext', 'aptd.hasTasksFolderStructure', true);
    vscode.commands.executeCommand('setContext', 'aptd.isCompleted', true);
    this.initTasks(join(workspaceFolders[0].uri.fsPath, 'Tasks'));
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      const groups = Array.from(new Set(this.tasks.map(task => task.object.name)));
      const nameItems = groups.map(name =>
        new CategoryItem(name, this.tasks.filter(task => task.object.name === name))
      );
      return Promise.resolve(nameItems);
    }

    if (element instanceof CategoryItem) {
      return Promise.resolve(element.childrenItems);
    }

    return Promise.resolve([]);
  }

  toggleTaskSelection(taskItem: TaskItem): void {
    taskItem.toggle();
    this._onDidChangeTreeData.fire(taskItem);
  }

  getSelectedTasks(): TaskItem[] {
    return this.tasks.filter(taskItem => taskItem.checked);
  }

  private initTasks(tasksPath: string) {
    if (!existsSync(tasksPath)) {
      vscode.window.showErrorMessage(
        'It seems you are not at the root of [the Tasks repository](https://github.com/microsoft/azure-pipelines-tasks).\nCould you please open the folder?',
        'Open Folder'
      ).then(selection => {
        if (selection === 'Open Folder') {
          vscode.commands.executeCommand('vscode.openFolder');
        }
      });

      return;
    }

    const tasks = readdirSync(tasksPath)
      .filter(task => existsSync(join(tasksPath, task, 'task.json')));

    this.items = tasks.map(x => new TaskItem(x, join(tasksPath, x)));
  }
}