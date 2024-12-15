"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.askOllama', () => __awaiter(this, void 0, void 0, function* () {
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
            const result = yield getCompletionFromOllama(selectedText);
            console.log("debug: complete result: ", result);
            // 在 VS Code 中显示补全结果
            vscode.window.showInformationMessage('代码补全结果已生成');
            editor.edit(editBuilder => {
                editBuilder.replace(selection, result);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`请求 Ollama 出错: ${error.message}`);
        }
    }));
    context.subscriptions.push(disposable);
}
function deactivate() { }
// 调用 Ollama API 获取补全
function getCompletionFromOllama(code) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post(url, payload);
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
        }
        catch (error) {
            console.error('Error calling Ollama API:', error);
            throw new Error('请求 Ollama API 出错');
        }
    });
}
