# Show available commands.
default:
	@just --list

# Start the local development server.
run:
	pnpm dev

# Build the static site into dist/.
build:
	pnpm build

# Preview the built site locally.
preview:
	pnpm preview

# Lint JavaScript, TypeScript, and Astro source.
lint:
	pnpm run lint

# Format supported project files.
format:
	pnpm run format

# Check supported project files without writing changes.
format-check:
	pnpm run format:check

# Run the full local CI check.
check:
	pnpm run check
