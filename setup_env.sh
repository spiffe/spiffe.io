#!/bin/bash
set -e

echo "Setting up Python environment..."

# Remove any existing virtual environment
rm -rf .venv

# Install pipenv if not present
if ! command -v pipenv &> /dev/null; then
    echo "Installing pipenv..."
    pip install pipenv
fi

# Create a fresh virtual environment and install dependencies
echo "Creating fresh virtual environment..."
pipenv install --dev --clear

echo "Python environment setup complete!" 