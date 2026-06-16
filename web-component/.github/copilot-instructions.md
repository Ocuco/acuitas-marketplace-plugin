# Copilot Instructions for Remote-B Project

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Vite + Lit + TypeScript project that creates web components for module federation. The project exposes standard web components that can be consumed by other applications.

## Key Technologies
- **Vite**: Build tool and development server
- **Lit**: Library for building fast, lightweight web components
- **TypeScript**: For type safety and better development experience
- **Module Federation**: For exposing components to other applications
- **Web Components**: Standard web components that work across frameworks

## Development Guidelines
- Use Lit decorators and lifecycle methods
- Follow web component standards
- Maintain compatibility with module federation
- Ensure components are framework-agnostic
- Use TypeScript for all component definitions
- Follow the same prop structure as the React components in remote-a

## Component Features
- Modal functionality for full-screen display
- Theme support (light/dark)
- User and configuration prop handling
- Event-driven communication with host applications
