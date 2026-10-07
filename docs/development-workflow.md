# Development workflow

## Goal

This repository is meant to support clear setup and handoff for future implementation agents. The workflow should remain simple and low-friction for human developers working in VS Code.

## Recommended process

1. Open the repository in VS Code.
2. Review the architecture and planning documents.
3. Edit files through the working tree.
4. Use Source Control to review changes.
5. Stage your files.
6. Commit the changes.
7. Push to GitHub when the repository is authenticated.
8. Pull before starting significant work to keep the branch current.

## Branching model

Initial branch approach:

- main
- feature/*
- fix/*
- docs/*

The current setup phase should remain intentionally simple and avoid over-engineering branch strategy.

## VS Code workflow

Human developers should be able to use the VS Code Source Control panel to:

- see modified files
- stage changes
- commit changes
- push to GitHub
- view Git history

This reduces the need for repeated terminal command use during normal development.

## Important constraint

This repository is not the final application. The workflow here is an environment setup and planning workflow, not a production-grade deployment pipeline.
