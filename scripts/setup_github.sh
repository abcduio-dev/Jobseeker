#!/usr/bin/env bash

# Melbourne JobSeeker - GitHub Repository Setup Helper

echo "=========================================================="
echo "🇦🇺 Melbourne JobSeeker - GitHub Repository Setup Helper"
echo "=========================================================="

# Ensure Git repository exists
if [ ! -d ".git" ]; then
  git init
  git branch -m main
fi

# Ensure branch is main
git branch -m main 2>/dev/null || true

# Add all files and make initial commit if not already committed
git add .
if git diff --cached --quiet; then
  echo "ℹ️  No uncommitted changes."
else
  git commit -m "feat: initial release of Melbourne JobSeeker app for Data & BI Analysts"
  echo "✅ Committed all files to local branch 'main'."
fi

echo ""
echo "Checking GitHub CLI (gh) authentication..."
if gh auth status 2>/dev/null; then
  echo "✅ Authenticated with GitHub CLI!"
  echo "Creating GitHub repository..."
  gh repo create Jobseeker --public --source=. --push || {
    echo "ℹ️ If repo already exists or you prefer private, you can run:"
    echo "   gh repo create Jobseeker --private --source=. --push"
  }
else
  echo "⚠️  GitHub CLI is not logged in yet."
  echo ""
  echo "To publish this repository to your GitHub account, choose one of these two options:"
  echo ""
  echo "Option A: Using GitHub CLI (Recommended)"
  echo "  1. Run: gh auth login"
  echo "  2. Run: gh repo create Jobseeker --public --source=. --push"
  echo ""
  echo "Option B: Using Git Remote (Standard)"
  echo "  1. Create a new repository named 'Jobseeker' at https://github.com/new"
  echo "  2. Run:"
  echo "     git remote add origin https://github.com/YOUR_USERNAME/Jobseeker.git"
  echo "     git push -u origin main"
  echo ""
fi
echo "=========================================================="
