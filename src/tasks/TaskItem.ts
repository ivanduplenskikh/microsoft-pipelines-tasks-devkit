import * as vscode from 'vscode';

export class TaskItem extends vscode.TreeItem {
  public checked: boolean = false;

  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'taskItem';
    this.updateIcon();

    this.command = {
      command: 'tasksDevKit.toggleTask',
      title: 'Toggle Task Selection',
      arguments: [this],
    };
  }

  updateIcon(): void {
    this.iconPath = new vscode.ThemeIcon(this.checked ? 'check' : 'circle-large-outline');
  }
}
