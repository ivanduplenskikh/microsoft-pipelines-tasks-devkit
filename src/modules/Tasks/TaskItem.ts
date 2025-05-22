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
    }
  }

  async build(fsPath: string) {
    const agentTaskPath = join(fsPath, "agent/_work/_tasks", this.getWorkName());

    if (!existsSync(agentTaskPath)) {
      mkdirSync(agentTaskPath);
    }

    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Azure Pipelines');
    terminal.sendText(`node make.js build --task "@(${this.label})" --include-sourcemap`);

    const sourcePath = vscode.Uri.file(join(vscode.workspace.workspaceFolders![0].uri.fsPath, "_build/Tasks", this.getFormattedName())).fsPath;
    console.log('Source path', sourcePath);
    const targetPath = join(agentTaskPath, this.getVersion());
    console.log('Target path', targetPath);
    writeFileSync(`${join(agentTaskPath, this.getVersion())}.completed`, new Date().toLocaleDateString());

    if (existsSync(targetPath)) {
      if (lstatSync(targetPath).isSymbolicLink()) {
        console.log(`Symlink for task already exists, skipping creation:\n${targetPath}`);
        unlinkSync(targetPath);
      } else {
        rmSync(targetPath, { recursive: true, force: true });
      }
    }

    symlinkSync(sourcePath, targetPath);

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
