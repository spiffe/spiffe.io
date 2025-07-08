#!/bin/bash
set -e

echo "Setting up Python environment with pip..."

# Upgrade pip to latest version
pip install --upgrade pip

# Always remove any existing virtual environment to avoid cached corruption
echo "Removing any existing virtual environment..."
rm -rf .venv

# Create a fresh virtual environment
echo "Creating fresh virtual environment..."
python -m venv .venv

# Activate the virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Verify the virtual environment is working
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"

# Install dependencies from requirements-dev.txt (includes both dev and regular dependencies)
echo "Installing dependencies..."
pip install -r requirements-dev.txt

echo "Python environment setup complete!" 