import * as fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

export class DebugProfilesGenerator {
  static generateDebugProfiles(selectedTasks: string[]): void {
    if (selectedTasks.length === 0) {
      vscode.window.showInformationMessage('No tasks selected.');
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const launchConfigPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'launch.json');
    let launchConfig: any = { version: '0.2.0', configurations: [] };

    // Read existing launch.json if it exists
    if (fs.existsSync(launchConfigPath)) {
      const launchConfigContent = fs.readFileSync(launchConfigPath, 'utf-8');
      launchConfig = JSON.parse(launchConfigContent);
    }

    selectedTasks.forEach((taskName) => {
      const debugConfig = {
        name: `Debug ${taskName}`,
        type: 'node',
        request: 'launch',
        runtimeExecutable: 'ts-node',
        skipFiles: ["<node_internals>/**"],
        program: '${workspaceFolder}/Tasks/' + taskName + '/main.ts',
        envFile: '${workspaceFolder}/Tasks/' + taskName + '/.env',
        cwd: '${workspaceFolder}/Tasks/' + taskName,
      };

      // Avoid duplicate configurations
      if (!launchConfig.configurations.find((config: any) => config.name === debugConfig.name)) {
        launchConfig.configurations.push(debugConfig);
      }
    });

    // Ensure .vscode directory exists
    const vscodeDir = path.dirname(launchConfigPath);
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }

    // Write updated launch.json
    fs.writeFileSync(launchConfigPath, JSON.stringify(launchConfig, null, 2), 'utf-8');
    vscode.window.showInformationMessage('Debug profiles generated successfully.');
  }

  static createEnvFiles(selectedTasks: string[]): void {
    if (selectedTasks.length === 0) {
      vscode.window.showInformationMessage('No tasks selected.');
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    // Content of the .env file
    const envContent = `SYSTEM_DEBUG="true"
# Update GitHub service connection id
INPUT_gitHubConnection="3d474538-a48c-4fd6-b823-a473cea456c2"
# Update authorization details
ENDPOINT_AUTH_3d474538-a48c-4fd6-b823-a473cea456c2={"scheme":"InstallationToken","parameters":{"IdToken":"your-idToken-here","IdSignature":"your-idSignature-here"}}
INPUT_action="create"
INPUT_repositoryName="LeftTwixWand/AdoTest"
INPUT_tag="installation-release"
INPUT_tagSource="userSpecifiedTag"
INPUT_target="eae8334dea192eff84c8ea7685a74a70b8cbbc41"
INPUT_title="Release with InstallationToken"
INPUT_isDraft="false"
INPUT_isPreRelease="false"
INPUT_assets="assets"
INPUT_assetUploadMode="assetUploadMode"
INPUT_releaseNotesSource="inline"
INPUT_releaseNotesInline="Some release with InstallationToken"
INPUT_releaseNotesFilePath="D:\\Projects\\sample.txt"
INPUT_addChangeLog="false"
INPUT_changeLogLabels="changeLogLabels"
INPUT_deleteExistingAssets="deleteExistingAssets"
INPUT_tagPattern="undefined"
INPUT_changeLogCompareToRelease="changeLogCompareToRelease"
INPUT_changeLogCompareToReleaseTag="changeLogCompareToReleaseTag"
INPUT_changeLogType="changeLogType"
`;

    selectedTasks.forEach((taskName) => {
      const taskEnvFilePath = path.join(workspaceFolders[0].uri.fsPath, 'Tasks', taskName, '.env');

      // Write the .env file
      fs.writeFileSync(taskEnvFilePath, envContent, 'utf-8');
    });

    vscode.window.showInformationMessage('.env files created successfully.');
  }
}
