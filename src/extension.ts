'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FusionDefinitionProvider } from './definitionProvider';
import * as vscode from 'vscode';

// Global variable to store the disposable for the definition provider.
// This allows us to properly clean up when the extension is deactivated.
let definitionProviderDisposable: vscode.Disposable | undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // activate TailwindCSS for Fusion files, so that autocompletion
    // for Tailwind CSS works properly
    const tailwindCssConfig = vscode.workspace.getConfiguration('tailwindCSS');
    let includeLanguagesConfig: any = tailwindCssConfig.get('includeLanguages') || {};
    if (includeLanguagesConfig["fusion"] !== "html") {
        includeLanguagesConfig["fusion"] = "html";
        tailwindCssConfig.update('includeLanguages', includeLanguagesConfig, true);
    }


    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "neos-fusion" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);

    function updateDefinitionProvider() {
        if (definitionProviderDisposable) {
            definitionProviderDisposable.dispose();
            definitionProviderDisposable = undefined;
        }

        const config = vscode.workspace.getConfiguration('neosFusion');
        const enableGoToDefinition = config.get('enableGoToDefinition', true);

        if (enableGoToDefinition) {
            definitionProviderDisposable = vscode.languages.registerDefinitionProvider(
                { scheme: 'file', language: 'fusion' },
                new FusionDefinitionProvider()
            );
            context.subscriptions.push(definitionProviderDisposable);
        }
    }

    // Initial setup
    updateDefinitionProvider();

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('neosFusion.enableGoToDefinition')) {
                updateDefinitionProvider();
            }
        })
    );
}

// This method is called when the extension is deactivated
export function deactivate() {
    if (definitionProviderDisposable) {
        definitionProviderDisposable.dispose();
    }
}
