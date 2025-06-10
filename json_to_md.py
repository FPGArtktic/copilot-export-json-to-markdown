import os
import json

def json_to_md(input_dir, output_dir):
    """
    Converts JSON files in the input directory to Markdown files in the output directory.

    Args:
        input_dir (str): Path to the directory containing JSON files.
        output_dir (str): Path to the directory where Markdown files will be saved.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith('.json'):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename.replace('.json', '.md'))

            with open(input_path, 'r', encoding='utf-8') as json_file:
                data = json.load(json_file)

            md_content = convert_to_markdown(data)

            with open(output_path, 'w', encoding='utf-8') as md_file:
                md_file.write(md_content)

def convert_to_markdown(data):
    """
    Converts a JSON object to a Markdown string.

    Args:
        data (dict): JSON data to convert.

    Returns:
        str: Markdown formatted string.
    """
    md_lines = []

    # Example: Extracting specific fields and formatting them as Markdown
    if 'requesterUsername' in data:
        md_lines.append(f"# Requester: {data['requesterUsername']}")

    if 'requests' in data:
        for request in data['requests']:
            if 'message' in request and 'text' in request['message']:
                md_lines.append("## Request:")
                md_lines.append(f"{request['message']['text']}")

            if 'response' in request:
                md_lines.append("## Response:")
                for response in request['response']:
                    if 'value' in response:
                        md_lines.append(response['value'])

    return '\n\n'.join(md_lines)

if __name__ == "__main__":
    input_directory = "./jsons"  # Replace with your input directory path
    output_directory = "./markdowns"  # Replace with your output directory path

    json_to_md(input_directory, output_directory)
    print(f"Conversion completed. Markdown files are saved in '{output_directory}'.")