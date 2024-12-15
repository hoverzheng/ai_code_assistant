import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.askOllama', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个编辑器并选中代码');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showWarningMessage('未选中任何代码');
            return;
        }

        try {
            const result = await getCompletionFromOllama(selectedText);
            console.log("debug: complete result: ", result)
            // 在 VS Code 中显示补全结果
            vscode.window.showInformationMessage('代码补全结果已生成');
            editor.edit(editBuilder => {
                editBuilder.replace(selection, result);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`请求 Ollama 出错: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

// 调用 Ollama API 获取补全
async function getCompletionFromOllama(code: string): Promise<string> {
    const url = 'http://172.16.1.54:11434/api/chat'; // 替换为你的 Ollama 服务地址
    const payload = {
        model: 'llama3.2', // 替换为实际模型名称
        messages: [
            {
                role: 'user',
                content: `补全以下代码：\n  ${code}` // 将用户输入的代码放入 content 字段
            }
        ],
        stream: false
    };

    try {
        // for debug
        // console.log("send reques payload: ",payload)
        // 发送 POST 请求到 Ollama API
        const response = await axios.post(url, payload);

        // for debug
        // console.log("debug api response message: ", response.data.message)
        // console.log("debug api response message content: ", response.data.message.content)
        // 获取返回的 content 字段
        const completion = response.data.message.content;
        
        // 如果返回的 content 为空，抛出错误
        if (!completion) {
            throw new Error('Ollama API 返回为空的补全结果');
        }

        return completion;
    } catch (error) {
        console.error('Error calling Ollama API:', error);
        throw new Error('请求 Ollama API 出错');
    }
}

