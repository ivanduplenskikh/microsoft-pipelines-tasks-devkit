import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

import vscode, { tasks } from 'vscode';

import { TaskItem } from './TaskItem';

export class TasksProvider implements vscode.TreeDataProvider<TaskItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TaskItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined> = this._onDidChangeTreeData.event;

  private tasks: TaskItem[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
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

  toggleTaskSelection(taskName: string): void {
    const taskItem = this.items.find(taskItem => taskItem.label === taskName);

    if (!taskItem) {
      vscode.window.showErrorMessage(`Task ${taskName} not found`);
      return;
    }

    taskItem.toggle();
    this._onDidChangeTreeData.fire(taskItem);
  }

  getSelected(): TaskItem[] {
    return this.items.filter(taskItem => taskItem.checked);
  }

  private initTasks(taskRootFolderPath: string) {
    let tasksPaths = this.context.workspaceState.get<string[]>('tasks');

    if (tasksPaths === undefined) {
      tasksPaths = readdirSync(taskRootFolderPath).filter(x => existsSync(join(taskRootFolderPath, x, 'task.json')));
      this.context.workspaceState.update('tasks', tasksPaths);
    }

    this.items = tasksPaths.map(x => new TaskItem(x, join(taskRootFolderPath, x)));
  }
}