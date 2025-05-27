import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

import vscode from 'vscode';

import { TaskItem } from './TaskItem';

export class TasksProvider implements vscode.TreeDataProvider<TaskItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TaskItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined> = this._onDidChangeTreeData.event;

  private tasks: TaskItem[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || !workspaceFolders[0].uri.fsPath) {
      vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        'azure-pipelines-tasks-debugger-publisher.azure-pipelines-tasks-debugger#aptd.walkthrough',
        false
      );
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

  getChildren(_element?: TaskItem): vscode.ProviderResult<TaskItem[]> {
    return this.tasks;
  }

  private initTasks(taskRootFolderPath: string) {
    let tasksPaths = this.context.workspaceState.get<string[]>('tasks');

    if (tasksPaths === undefined) {
      tasksPaths = readdirSync(taskRootFolderPath).filter(x => existsSync(join(taskRootFolderPath, x, 'task.json')));
      this.context.workspaceState.update('tasks', tasksPaths);
    }

    this.tasks = tasksPaths.map(x => new TaskItem(x, join(taskRootFolderPath, x)));
  }
}