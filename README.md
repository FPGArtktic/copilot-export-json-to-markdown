# Github Copilot Export JSON to Markdown Converter

This project provides tools to convert JSON files into Markdown (`.md`) files. It is designed to process JSON files exported from Copilot and generate human-readable Markdown documents.

## Author
- **Mateusz Okulanis** (2025)
- **Email**: FPGArtktic@outlook.com

## Features
- Converts JSON files in a specified input directory to Markdown files in an output directory.
- Extracts and formats relevant fields from JSON into Markdown syntax.
- Automatically creates the output directory if it does not exist.
- Available as both a standalone Python script and a dedicated Obsidian plugin.
- Correctly formats all code blocks, regardless of language specification.
- Works seamlessly within Obsidian's ecosystem.

## Project Structure
```
json_to_md.py               # Python script for JSON to Markdown conversion
jsons/                      # Directory containing input JSON files
markdowns/                  # Directory where output Markdown files are saved
json-to-md-obsidian/        # Obsidian plugin version with full integration capabilities
```

## Python Script

### Requirements
- Python 3.x

### Usage
1. Place your JSON files in the `jsons/` directory.
2. Run the script:
   ```bash
   python3 json_to_md.py
   ```
3. The converted Markdown files will be saved in the `markdowns/` directory.

![Usage example](usage.jpg)

## Obsidian Plugin

### Features
- Integrated directly into your Obsidian interface
- Converts JSON files to Markdown with a single click
- Configurable input and output folders
- Accessible via ribbon icon or command palette
- Properly formats all code blocks in the Markdown output
- Native integration with Obsidian's file system API
- Preserves JSON structure while making it readable in Markdown format

### Installation
1. Copy the `json-to-md-obsidian` folder to your Obsidian vault's plugins directory:
   ```
   <your-vault>/.obsidian/plugins/
   ```
2. Enable the plugin in Obsidian settings under "Community Plugins"
3. Configure the input and output folders in the plugin settings

### Usage
1. Place your JSON files in the configured input folder (default: `jsons/`)
2. Click the document icon in the Obsidian ribbon or use the command palette (Ctrl+P) and search for "Convert JSON files to Markdown"
3. The plugin will process all JSON files and save them as Markdown in the output folder (default: `markdowns/`)
4. Open the resulting Markdown files directly in Obsidian for a clean view of your Copilot conversations

## Example
### Input JSON (`jsons/example.json`):
```json
{
    "requesterUsername": "user123",
    "requests": [
        {
            "message": {"text": "What is the weather today?"},
            "response": [
                {"value": "The weather is sunny. Here is some code:\n```python\nprint('Hello world')\n```"}
            ]
        }
    ]
}
```

### Output Markdown (`markdowns/example.md`):
```markdown
# Requester: user123

## Request: What is the weather today?

### Response:
The weather is sunny. Here is some code:

```python
print('Hello world')
```
```

## Customization
You can modify the code in `main.js` within the Obsidian plugin folder or the Python script to customize how JSON data is formatted into Markdown.

## License
This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the LICENSE file for details.

Copyright © 2025 Mateusz Okulanis (FPGArtktic@outlook.com)