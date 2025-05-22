import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import vscode from 'vscode';

type TaskJson = {
  id: string;
  name: string;
  friendlyName: string;
  description: string;
  helpUrl: string;
  helpMarkDown: string;
  author: string;
  category: string;
  prejobexecution?: Record<string, unknown>;
  execution?: Record<string, unknown>;
  postjobexecution?: Record<string, unknown>;
  version: {
    Major: Number;
    Minor: Number;
    Patch: Number;
  };
};

export class TaskItem extends vscode.TreeItem {
  public readonly object: TaskJson;
  public isDisabled: boolean = false;

  constructor(public readonly label: string, private readonly path: string) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.object = JSON.parse(readFileSync(join(path, "task.json"), 'utf-8'));
    this.contextValue = 'taskItem';

    this.isDisabled = this.isTaskDisabled();
    this.tooltip = this.path;

    if (this.isDisabled) {
      this.iconPath = new vscode.ThemeIcon('circle-slash');
      this.description = 'Not the NodeJS task';
    } else {
      this.command = {
        command: 'aptd.commands.tasks.build',
        title: 'Build the task',
        arguments: [this]
      };
    }
  }

  async build(fsPath: string) {
    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Azure Pipelines');

    terminal.sendText(`node make.js build --task "@(${this.label})" --include-sourcemap`);

    const agentTaskPath = join(fsPath, "agent/_work/_tasks", this.getWorkName());

    if (!existsSync(agentTaskPath)) {
      mkdirSync(agentTaskPath);
    }

    const taskFolderPath = join(agentTaskPath, this.getVersion());
    writeFileSync(`${join(agentTaskPath, this.getVersion())}.completed`, new Date().toLocaleDateString());

    if (existsSync(taskFolderPath)) {
      if (lstatSync(taskFolderPath).isSymbolicLink()) {
        console.log(`Symlink for task already exists, skipping creation:\n${taskFolderPath}`);
        unlinkSync(taskFolderPath);
      } else {
        rmSync(taskFolderPath, { recursive: true, force: true });
      }
    }

    symlinkSync(vscode.Uri.file(join(vscode.workspace.workspaceFolders![0].uri.fsPath, "_build/Tasks", this.getFormattedName())).fsPath, taskFolderPath);

    terminal.show();
  }

  getFormattedName() {
    return `${this.object.name}V${this.object.version.Major}`;
  }

  getVersion() {
    return `${this.object.version.Major}.${this.object.version.Minor}.${this.object.version.Patch}`;
  }

  getWorkName() {
    return `${this.object.name}_${this.object.id.toLowerCase()}`;
  }

  private isTaskDisabled(): boolean {
    const { prejobexecution, execution, postjobexecution } = this.object;
    const executors = [Object.keys(prejobexecution ?? {}), Object.keys(execution ?? {}), Object.keys(postjobexecution ?? {})].flat();
    return executors.find(x => x.startsWith('Node')) === undefined;
  }
}
