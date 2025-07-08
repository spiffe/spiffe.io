#!/bin/bash
set -e

echo "Setting up Python environment with pip..."

# Upgrade pip to latest version
pip install --upgrade pip

# Create a virtual environment if one doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
fi

# Activate the virtual environment
source .venv/bin/activate

# Install dependencies from requirements-dev.txt (includes both dev and regular dependencies)
echo "Installing dependencies..."
pip install -r requirements-dev.txt

echo "Python environment setup complete!" 