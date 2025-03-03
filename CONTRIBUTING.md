# Contributing to Mythoclastia

Thank you for considering contributing to Mythoclastia! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as much detail as possible.
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
* **Provide specific examples to demonstrate the steps**.
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
* **Include screenshots and animated GIFs** which help you demonstrate the steps or point out the part which the suggestion is related to.
* **Explain why this enhancement would be useful** to most Mythoclastia users.

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the JavaScript and CSS styleguides
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * ⚡️ `:zap:` when improving performance
    * 🔥 `:fire:` when removing code or files
    * 🐛 `:bug:` when fixing a bug
    * ✨ `:sparkles:` when adding a new feature

### JavaScript Styleguide

All JavaScript code is linted with ESLint and should adhere to the project's ESLint configuration.

* Prefer the object spread operator (`{...anotherObj}`) to `Object.assign()`
* Use camelCase for variables, properties and function names
* Use PascalCase for classes and React components
* Use the arrow function syntax for anonymous functions
* Use template literals instead of string concatenation
* Add trailing commas for cleaner diffs

### CSS Styleguide

* Use CSS-in-JS or CSS modules rather than writing plain CSS
* Use camelCase for CSS-in-JS object keys
* Use meaningful class names that describe the purpose of the element
* Avoid using ID selectors
* Limit nesting to 3 levels

## Developing

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Mythoclastia.git`
3. Navigate to the project directory: `cd Mythoclastia`
4. Install dependencies: `npm install`
5. Create a new branch: `git checkout -b my-branch-name`
6. Make your changes
7. Run tests: `npm test`
8. Push your branch to your fork: `git push origin my-branch-name`
9. Open a pull request

### Dependencies

* React 19.0.0+
* Node.js 14.0.0+
* npm 6.0.0+

### Testing

* Write tests for all new features and fixes
* Run existing tests before submitting a pull request
* Ensure all tests pass before submitting

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

* `bug` - Issues that are bugs
* `documentation` - Issues that involve documentation
* `enhancement` - Issues that are feature requests
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed
* `question` - Issues that are questions
* `wontfix` - Issues that will not be worked on

Thank you for contributing to Mythoclastia! 