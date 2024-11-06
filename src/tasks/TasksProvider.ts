import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TaskItem } from './TaskItem';

export class TasksProvider implements vscode.TreeDataProvider<TaskItem> {
  private workspaceRoot: string = '';

  private _onDidChangeTreeData = new vscode.EventEmitter<TaskItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined> = this._onDidChangeTreeData.event;

  private tasksMap: Map<string, TaskItem> = new Map();

  constructor() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showInformationMessage('No workspace folder open.');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    this.workspaceRoot = rootPath;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TaskItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<TaskItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No tasks in empty workspace');
      return Promise.resolve([]);
    }

    const tasks = this.getTasks();
    return Promise.resolve(tasks);
  }

  private getTasks(): TaskItem[] {
    const tasksDir = path.join(this.workspaceRoot, 'Tasks');
    if (fs.existsSync(tasksDir)) {
      const taskNames = fs.readdirSync(tasksDir).filter((task) => fs.statSync(path.join(tasksDir, task)).isDirectory());

      return taskNames.map((taskName) => {
        let taskItem = this.tasksMap.get(taskName);
        if (!taskItem) {
          taskItem = new TaskItem(taskName);
          this.tasksMap.set(taskName, taskItem);
        }
        return taskItem;
      });
    }
    return [];
  }

  toggleTaskSelection(taskItem: TaskItem): void {
    taskItem.checked = !taskItem.checked;
    taskItem.updateIcon();
    this._onDidChangeTreeData.fire(taskItem);
  }

  getSelectedTasks(): string[] {
    return Array.from(this.tasksMap.values())
      .filter((taskItem) => taskItem.checked)
      .map((taskItem) => taskItem.label);
  }
}