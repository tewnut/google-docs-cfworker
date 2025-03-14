# Gooproxy

Gooproxy is a proxy for Google Workspace APIs. It is designed to be a powerful tool for **Chat AI agents**, enabling them to access, manipulate, and retrieve information from Google Workspace services in a task-specific manner. This project focuses on helping AI agents fetch data, process it, and take actions based on structured and understandable responses.

By integrating Gooproxy into your AI system, you can enable agents to:
- **Fetch specific data**: AI agents can access data from Google Sheets (e.g., project details, contact lists, inventory records) based on task-specific needs.
- **Manage files and documents**: With the Google Drive API integration, AI agents can list, upload, or download files from Google Drive, or even manipulate shared documents.
- **Read and send emails**: The Gmail API integration allows AI agents to read emails, analyze their content, and even send responses automatically.
- **Take actions**: AI agents can take action based on the structured data received from the APIs, such as analyzing a spreadsheet, replying to emails, or organizing files.

## Accessing
Once the Gooproxy worker is deployed, it is accessible through the following endpoint:

Base URL: https://gooproxy.wellcare.workers.dev/
Authorization URL for ChatGPT: https://gooproxy.wellcare.workers.dev/auth/login
Token URL for ChatGPT: https://gooproxy.wellcare.workers.dev/auth/token
Openapi Spec: https://gooproxy.wellcare.workers.dev/openapi.yaml

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request. If you encounter any issues or have suggestions for improvements, feel free to open an issue.

## License

This project is licensed under the MIT License.