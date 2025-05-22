import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

interface JSONToMDSettings {
	inputFolder: string;
	outputFolder: string;
}

const DEFAULT_SETTINGS: JSONToMDSettings = {
	inputFolder: 'jsons',
	outputFolder: 'markdowns'
}

export default class JSONToMarkdownPlugin extends Plugin {
	settings: JSONToMDSettings;

	async onload() {
		await this.loadSettings();

		// Dodanie przycisku do paska bocznego
		this.addRibbonIcon('file-text', 'Convert JSON to Markdown', () => {
			this.convertJSONToMarkdown();
		});

		// Dodanie polecenia, które można wywołać z palety poleceń
		this.addCommand({
			id: 'convert-json-to-md',
			name: 'Convert JSON files to Markdown',
			callback: () => {
				this.convertJSONToMarkdown();
			}
		});

		// Dodanie ustawień pluginu
		this.addSettingTab(new JSONToMDSettingTab(this.app, this));
	}

	onunload() {
		// Nic do czyszczenia
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async convertJSONToMarkdown() {
		const inputFolder = this.app.vault.getAbstractFileByPath(this.settings.inputFolder);
		const outputFolder = this.app.vault.getAbstractFileByPath(this.settings.outputFolder);

		// Create input folder if it doesn't exist
		if (!inputFolder) {
			try {
				await this.app.vault.createFolder(this.settings.inputFolder);
				new Notice(`Created input folder "${this.settings.inputFolder}"`);
				// Refresh input folder reference
				const newInputFolder = this.app.vault.getAbstractFileByPath(this.settings.inputFolder);
				if (!newInputFolder || !(newInputFolder instanceof TFolder)) {
					new Notice(`Failed to access newly created input folder!`);
					return;
				}
			} catch (error) {
				new Notice(`Failed to create input folder: ${error}`);
				return;
			}
		} else if (!(inputFolder instanceof TFolder)) {
			new Notice(`"${this.settings.inputFolder}" exists but is not a folder!`);
			return;
		}

		// Create output folder if it doesn't exist
		if (!outputFolder) {
			try {
				await this.app.vault.createFolder(this.settings.outputFolder);
				new Notice(`Created output folder "${this.settings.outputFolder}"`);
			} catch (error) {
				new Notice(`Failed to create output folder: ${error}`);
				return;
			}
		} else if (!(outputFolder instanceof TFolder)) {
			new Notice(`"${this.settings.outputFolder}" exists but is not a folder!`);
			return;
		}

		// Re-get the input folder to ensure it's updated
		const refreshedInputFolder = this.app.vault.getAbstractFileByPath(this.settings.inputFolder);
		if (!refreshedInputFolder || !(refreshedInputFolder instanceof TFolder)) {
			new Notice(`Could not access input folder!`);
			return;
		}

		const jsonFiles = refreshedInputFolder.children.filter(file => 
			file instanceof TFile && file.extension === 'json'
		);

		if (jsonFiles.length === 0) {
			new Notice('No JSON files found in the input folder!');
			return;
		}

		let successCount = 0;
		for (const file of jsonFiles) {
			if (file instanceof TFile) {
				try {
					const content = await this.app.vault.read(file);
					const jsonData = JSON.parse(content);
					const mdContent = this.convertToMarkdown(jsonData);
					
					const outputFileName = `${file.basename}.md`;
					const outputPath = `${this.settings.outputFolder}/${outputFileName}`;
					
					const existingFile = this.app.vault.getAbstractFileByPath(outputPath);
					if (existingFile instanceof TFile) {
						await this.app.vault.modify(existingFile, mdContent);
					} else {
						await this.app.vault.create(outputPath, mdContent);
					}
					
					successCount++;
				} catch (error) {
					new Notice(`Error processing file ${file.name}: ${error}`);
				}
			}
		}

		new Notice(`Conversion completed! ${successCount} file(s) converted.`);
	}

	convertToMarkdown(data: any): string {
		const mdLines: string[] = [];

		// Wyodrębnianie konkretnych pól i formatowanie ich jako Markdown
		if (data.requesterUsername) {
			mdLines.push(`# Requester: ${data.requesterUsername}`);
		}

		if (data.requests) {
			for (const request of data.requests) {
				if (request.message && request.message.text) {
					mdLines.push(`## Request: ${request.message.text}`);
				}

				if (request.response) {
					mdLines.push("### Response:");
					
					// Accumulate response content for each request
					let responseContent = '';
					let commandOutput = '';
					let inCommandContext = false;
					
					for (const response of request.response) {
						// Handle different types of responses
						if (response.value) {
							// If we were in a command context, this might be the output
							if (inCommandContext) {
								commandOutput += response.value;
								inCommandContext = false;
							} else {
								responseContent += response.value;
							}
						} 
						else if (response.kind === 'inlineReference' && response.inlineReference) {
							// Handle file references
							const path = response.inlineReference.path;
							if (path) {
								const fileName = path.split('/').pop();
								responseContent += `\`${fileName}\``;
							}
						}
						else if (response.kind === 'toolInvocationSerialized') {
							// Handle terminal commands
							if (response.toolSpecificData && response.toolSpecificData.kind === 'terminal') {
								const command = response.toolSpecificData.command;
								const language = response.toolSpecificData.language || 'bash';
								if (command) {
									// If there was previous command output, add it before the new command
									if (commandOutput) {
										responseContent += `\n\n${commandOutput}\n\n`;
										commandOutput = '';
									}
									
									responseContent += `\n\`\`\`${language}\n${command}\n\`\`\`\n`;
									inCommandContext = true; // Mark that the next value might be output
								}
							}
							// Other tool invocations that might need special handling
							else if (response.toolId === 'copilot_readFile' && response.pastTenseMessage) {
								// Extract file read operations
								const readFileMatch = /Read \[\]\(file:\/\/\/(.*?)\)/.exec(response.pastTenseMessage.value);
								if (readFileMatch && readFileMatch[1]) {
									const filePath = readFileMatch[1];
									const fileName = filePath.split('/').pop();
									responseContent += `\nRead file: \`${fileName}\`\n`;
								}
							}
						}
						else if (response.kind === 'codeblockUri' && response.uri) {
							// Handle code block URIs
							const path = response.uri.path;
							if (path) {
								const fileName = path.split('/').pop();
								responseContent += `\nFile: \`${fileName}\`\n`;
							}
						}
					}
					
					// Add any remaining command output
					if (commandOutput) {
						responseContent += `\n\n${commandOutput}\n`;
					}
					
					// Process code blocks within the text
					const processedContent = this.processCodeBlocks(responseContent);
					
					mdLines.push(processedContent);
				}
			}
		}

		return mdLines.join('\n\n');
	}
	
	// Helper method to process code blocks in text
	processCodeBlocks(text: string): string {
		if (!text) return '';
		
		// Look for any code blocks with optional language specification
		const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)?(?:\s*\n)?([\s\S]*?)```/g;
		let match;
		let lastIndex = 0;
		let processedValue = '';
		
		while ((match = codeBlockRegex.exec(text)) !== null) {
			// Add text before the code block
			processedValue += text.substring(lastIndex, match.index);
			
			// Get the code content and language
			const language = match[1] || '';
			let codeContent = match[2].trim();
			
			// Format as proper markdown code block
			processedValue += `\n\`\`\`${language}\n${codeContent}\n\`\`\`\n`;
			
			lastIndex = match.index + match[0].length;
		}
		
		// Add any remaining text after the last code block
		if (lastIndex < text.length) {
			processedValue += text.substring(lastIndex);
		}
		
		// Clean up excessive newlines
		processedValue = processedValue.replace(/\n{3,}/g, '\n\n');
		
		// If we didn't process any code blocks, just return the original text
		return lastIndex > 0 ? processedValue : text;
	}
}

class JSONToMDSettingTab extends PluginSettingTab {
	plugin: JSONToMarkdownPlugin;

	constructor(app: App, plugin: JSONToMarkdownPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'JSON to Markdown Converter Settings'});

		new Setting(containerEl)
			.setName('Input Folder')
			.setDesc('Folder containing JSON files (relative to vault root)')
			.addText(text => text
				.setPlaceholder('jsons')
				.setValue(this.plugin.settings.inputFolder)
				.onChange(async (value) => {
					this.plugin.settings.inputFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Output Folder')
			.setDesc('Folder for generated Markdown files (relative to vault root)')
			.addText(text => text
				.setPlaceholder('markdowns')
				.setValue(this.plugin.settings.outputFolder)
				.onChange(async (value) => {
					this.plugin.settings.outputFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}