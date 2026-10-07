# Manual setup guide

This repository intentionally requires human action for external service setup. These steps should be performed manually and authenticated by the human developer.

## Local machine

- Git
- VS Code
- Python
- Node.js
- npm
- optional development tools as needed later

## GitHub

- sign in to GitHub
- authenticate Git locally or through GitHub CLI
- create or connect the repository
- push and pull changes through the normal GitHub flow

## Supabase

- create a Supabase project
- obtain the project URL
- obtain the API keys
- configure the database and project settings

## Telegram

- create a Telegram bot using BotFather
- obtain the bot token
- configure the token in the environment file when implementation begins

## Google AI Studio / Gemini

- create or access the AI project
- generate a Gemini API key
- store it only in a local environment file

## Vercel

- connect the GitHub repository
- configure environment variables
- deploy the frontend when the app is ready

## Render

- connect the GitHub repository
- configure backend environment variables
- deploy the backend after implementation

## Important warning

Do not commit credentials. Use local environment configuration only, and keep secrets out of version control.
