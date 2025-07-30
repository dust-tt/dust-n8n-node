# n8n-nodes-dust

This is an n8n community node. It lets you use Dust agents in your n8n workflows.

Dust is a platform for creating custom AI agents that combine leading AI models with company knowledge to help teams work better, leveraging RAG technology for accurate, contextual responses.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Example Workflow](#example-workflow)  
[Authentication](#authentication)  
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Talk to an Agent
- Upload a Document

## Credentials

- Dust Workspace ID
- Dust API Key
- Dust Region

## Compatibility

- n8n 1.1.1

## Usage

1. **Add the Dust node to your workflow.**
2. **Select the operation:**
   - _Talk to an Agent_: Send a message to a Dust agent and receive a response.
   - _Upload a Document_: Upload a document to a Dust data source.
3. **Configure the required parameters:**
   - For "Talk to an Agent": Provide the message and select the agent.
   - For "Upload a Document": Provide Space ID, Data Source Name, Document ID, and Document Content.
4. **(Optional) Fill in additional fields** for more control (e.g., username, email, timezone, tags, etc.).
5. **Execute the workflow** to interact with Dust.

## Example Workflow

### Talk to an Agent

- **Operation:** Talk to an Agent
- **Parameters:**
  - Message: `What is the latest update on project X?`
  - Agent: (Select from dropdown)
  - Additional Fields (optional): Username, Email, Timezone

**Output:**

```
{
  "agentMessage": "Project X is on track for delivery next week.",
  "conversationUrl": "https://dust.tt/w/{workspaceId}/assistant/{conversationId}",
  "userMessage": { ... }
}
```

### Upload a Document

- **Operation:** Upload a Document
- **Parameters:**
  - Space ID: `your_space_id`
  - Data Source Name: `your_data_source`
  - Document ID: `doc-123`
  - Document Content: `This is the content of the document.`
  - Additional Fields (optional): Title, MIME Type, Source URL, Tags, Async, Light Document Output

**Output:**

```
{
  "documentId": "doc-123",
  "status": "uploaded"
}
```

## Authentication

To use this node, you need to set up Dust API credentials in n8n:

- **API Key:** Get your API key from your [Dust account settings](https://dust.tt/settings/api).
- **Workspace ID:** Find your workspace ID in the Dust dashboard URL or settings.
- **Region:** Select `EU` or `US` depending on your workspace location.

Add these credentials in n8n under the "Dust API" credential type and reference them in the node.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Dust API Documentation](https://docs.dust.tt/reference/api)

## Version history

- 0.1.1
  - Add SkipToolsValidation + rename assitant to agent
- 0.1.0
  - Initial release
