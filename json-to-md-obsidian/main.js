const obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
    inputFolder: 'jsons',
    outputFolder: 'markdowns'
};

class JSONToMarkdownPlugin extends obsidian.Plugin {
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

        if (!inputFolder || !(inputFolder instanceof obsidian.TFolder)) {
            new obsidian.Notice(`Input folder "${this.settings.inputFolder}" not found!`);
            return;
        }

        if (!outputFolder) {
            try {
                await this.app.vault.createFolder(this.settings.outputFolder);
            } catch (error) {
                new obsidian.Notice(`Failed to create output folder: ${error}`);
                return;
            }
        }

        const jsonFiles = inputFolder.children.filter(file => 
            file instanceof obsidian.TFile && file.extension === 'json'
        );

        if (jsonFiles.length === 0) {
            new obsidian.Notice('No JSON files found in the input folder!');
            return;
        }

        let successCount = 0;
        for (const file of jsonFiles) {
            if (file instanceof obsidian.TFile) {
                try {
                    const content = await this.app.vault.read(file);
                    const jsonData = JSON.parse(content);
                    const mdContent = this.convertToMarkdown(jsonData);
                    
                    const outputFileName = `${file.basename}.md`;
                    const outputPath = `${this.settings.outputFolder}/${outputFileName}`;
                    
                    const existingFile = this.app.vault.getAbstractFileByPath(outputPath);
                    if (existingFile instanceof obsidian.TFile) {
                        await this.app.vault.modify(existingFile, mdContent);
                    } else {
                        await this.app.vault.create(outputPath, mdContent);
                    }
                    
                    successCount++;
                } catch (error) {
                    new obsidian.Notice(`Error processing file ${file.name}: ${error}`);
                }
            }
        }

        new obsidian.Notice(`Conversion completed! ${successCount} file(s) converted.`);
    }

    convertToMarkdown(data) {
        const mdLines = [];

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
                    for (const response of request.response) {
                        if (response.value) {
                            mdLines.push(response.value);
                        }
                    }
                }
            }
        }

        return mdLines.join('\n\n');
    }
}

class JSONToMDSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;

        containerEl.empty();
        containerEl.createEl('h2', {text: 'JSON to Markdown Converter Settings'});

        new obsidian.Setting(containerEl)
            .setName('Input Folder')
            .setDesc('Folder containing JSON files (relative to vault root)')
            .addText(text => text
                .setPlaceholder('jsons')
                .setValue(this.plugin.settings.inputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.inputFolder = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
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

module.exports = JSONToMarkdownPlugin;