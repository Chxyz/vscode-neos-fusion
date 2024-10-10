import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FusionDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const line = document.lineAt(position.line).text;
    const wordInfo = this.getDotSeparatedWordAtPosition(line, position.character);

    if (!wordInfo) {
      return null;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const searchPattern = `prototype(${wordInfo.word})`;
      const results = this.findAllInFiles(rootPath, searchPattern);
      
      if (results.length > 0) {
        const originSelectionRange = new vscode.Range(
          position.line,
          wordInfo.startIndex,
          position.line,
          wordInfo.endIndex
        );

        return results.map(result => ({
          targetUri: vscode.Uri.file(result.file),
          targetRange: new vscode.Range(result.line, 0, result.line, result.lineText.length),
          targetSelectionRange: new vscode.Range(result.line, 0, result.line, result.lineText.length),
          originSelectionRange: originSelectionRange
        }));
      }
    }

    return null;
  }

  private getDotSeparatedWordAtPosition(line: string, position: number): { word: string, startIndex: number, endIndex: number } | null {
    const beforeCursor = line.slice(0, position);
    const afterCursor = line.slice(position);

    const beforeMatch = beforeCursor.match(/[\w.:]+$/);
    const afterMatch = afterCursor.match(/^[\w.:]+/);

    if (beforeMatch && afterMatch) {
      const word = beforeMatch[0] + afterMatch[0];
      const startIndex = beforeCursor.length - beforeMatch[0].length;
      const endIndex = beforeCursor.length + afterMatch[0].length;
      return { word, startIndex, endIndex };
    } else if (beforeMatch) {
      const word = beforeMatch[0];
      const startIndex = beforeCursor.length - word.length;
      const endIndex = beforeCursor.length;
      return { word, startIndex, endIndex };
    } else if (afterMatch) {
      const word = afterMatch[0];
      const startIndex = beforeCursor.length;
      const endIndex = beforeCursor.length + word.length;
      return { word, startIndex, endIndex };
    }

    return null;
  }

  private findAllInFiles(dir: string, searchPattern: string): { file: string, line: number, lineText: string }[] {
    let results: { file: string, line: number, lineText: string }[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(this.findAllInFiles(filePath, searchPattern));
      } else if (path.extname(file) === '.fusion') {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(searchPattern)) {
            results.push({ file: filePath, line: i, lineText: lines[i] });
          }
        }
      }
    }

    return results;
  }
}
