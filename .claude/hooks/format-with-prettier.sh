#!/bin/bash

# Read hook input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path found
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Run prettier on the file if it has supported extensions
if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx|json|css|scss|md)$ ]]; then
  cd "$CLAUDE_PROJECT_DIR" && npx prettier --write "$FILE_PATH" 2>/dev/null
fi

exit 0
