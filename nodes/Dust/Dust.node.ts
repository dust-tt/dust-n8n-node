import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestMethods,
	NodeConnectionType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

export class Dust implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dust',
		name: 'dust',
		icon: 'file:dust.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Dust API',
		defaults: {
			name: 'Dust',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'dustApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.region === "EU" ? "https://eu.dust.tt" : "https://dust.tt"}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: 'Bearer ={{$credentials.apiKey}}',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Talk to an Agent',
						value: 'talkToAssistant',
					},
					{
						name: 'Upload a Document',
						value: 'uploadDocument',
					},
				],
				default: 'talkToAssistant',
			},
			// Talk to Agent Parameters
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				default: '',
				description: 'Message to send to the agent',
				displayOptions: {
					show: {
						operation: ['talkToAssistant'],
					},
				},
			},
			{
				displayName: 'Agent',
				name: 'assistantConfigurationId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAgents',
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['talkToAssistant'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['talkToAssistant'],
					},
				},
				options: [
					{
						displayName: 'Username',
						name: 'username',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
					},
					{
						displayName: 'Timezone',
						name: 'timezone',
						type: 'string',
						default: '',
					},
				],
			},
			// Upload Document Parameters
			{
				displayName: 'Space ID',
				name: 'spaceId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: 'ID of the space where the document will be uploaded',
			},
			{
				displayName: 'Data Source Name',
				name: 'dataSourceName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
			},
			{
				displayName: 'Document Content',
				name: 'documentContent',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				description: 'The text content of the document',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
					},
				},
				options: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'The title of the document',
					},
					{
						displayName: 'MIME Type',
						name: 'mime_type',
						type: 'string',
						default: '',
						description: 'The MIME type of the document',
					},
					{
						displayName: 'Source URL',
						name: 'source_url',
						type: 'string',
						default: '',
						description: 'The source URL for the document',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated list of tags to associate with the document',
					},
					{
						displayName: 'Async Upload',
						name: 'async',
						type: 'boolean',
						default: false,
						description: 'Whether to perform the upload asynchronously',
					},
					{
						displayName: 'Light Document Output',
						name: 'light_document_output',
						type: 'boolean',
						default: false,
						description:
							'Whether to return a lightweight version of the document (excluding text, chunks and vectors)',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('dustApi');
				const baseUrl = credentials.region === 'EU' ? 'https://eu.dust.tt' : 'https://dust.tt';
				
				const options = {
					method: 'GET' as IHttpRequestMethods,
					url: `${baseUrl}/api/v1/w/${credentials.workspaceId}/assistant/agent_configurations`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'Authorization': `Bearer ${credentials.apiKey}`,
					},
				};

				try {
					const response = await this.helpers.httpRequest(options);
					return response.agentConfigurations
						.map((ac: any) => ({
							name: ac.name,
							value: ac.sId,
						}))
						.sort((a: any, b: any) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
				} catch (error) {
					throw error;
				}
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const credentials = await this.getCredentials('dustApi');
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'talkToAssistant') {
					const message = this.getNodeParameter('message', i) as string;
					const assistantConfigurationId = this.getNodeParameter(
						'assistantConfigurationId',
						i,
					) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const baseUrl = credentials.region === 'EU' ? 'https://eu.dust.tt' : 'https://dust.tt';
					const fullUrl = `${baseUrl}/api/v1/w/${credentials.workspaceId}/assistant/conversations`;

					const body = {
						blocking: true,
						skipToolsValidation: true,
						title: null,
						visibility: 'unlisted',
						message: {
							content: message,
							context: {
								timezone: additionalFields.timezone || 'Europe/Paris',
								username: additionalFields.username || 'DustN8N',
								email: additionalFields.email || 'n8n@dust.tt',
								fullName: null,
								profilePictureUrl: null,
								origin: 'n8n',
							},
							mentions: [
								{
									configurationId: assistantConfigurationId,
								},
							],
						},
					};

					const requestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: fullUrl,
						body,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
							Authorization: `Bearer ${credentials.apiKey}`,
						},
					};

					try {
						const response = await this.helpers.httpRequest(requestOptions);

						const conversationUrl = `${baseUrl}/w/${response.conversation.owner.sId}/assistant/${response.conversation.sId}`;

						const agentMessages = response.conversation.content
							.flat()
							.filter((m: any) => m.type === 'agent_message')
							.map((am: any) => am.content);

						const agentMessageStr =
							agentMessages.length === 0 ? 'No message returned' : agentMessages.join('\n');
						const userMessage = response.conversation.content.flat()[0];

						returnData.push({
							agentMessage: agentMessageStr,
							conversationUrl,
							userMessage,
						});
					} catch (requestError) {
						throw requestError;
					}
				} else if (operation === 'uploadDocument') {
					const spaceId = this.getNodeParameter('spaceId', i) as string;
					const dataSourceName = this.getNodeParameter('dataSourceName', i) as string;
					const documentId = this.getNodeParameter('documentId', i) as string;
					const documentContent = this.getNodeParameter('documentContent', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const baseUrl = credentials.region === 'EU' ? 'https://eu.dust.tt' : 'https://dust.tt';
					const fullUrl = `${baseUrl}/api/v1/w/${credentials.workspaceId}/spaces/${spaceId}/data_sources/${dataSourceName}/documents/${encodeURIComponent(documentId)}`;

					const body: IDataObject = {
						text: documentContent,
					};

					// Add optional fields if they exist
					if (additionalFields.title) body.title = additionalFields.title;
					if (additionalFields.mime_type) body.mime_type = additionalFields.mime_type;
					if (additionalFields.async !== undefined) body.async = additionalFields.async;
					if (additionalFields.light_document_output !== undefined) {
						body.light_document_output = additionalFields.light_document_output;
					}
					if (additionalFields.source_url) body.source_url = additionalFields.source_url;
					if (additionalFields.tags) {
						body.tags = (additionalFields.tags as string)
							.split(',')
							.map((tag) => tag.trim())
							.filter((tag) => tag.length > 0);
					}

					const uploadRequestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: fullUrl,
						body,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
							Authorization: `Bearer ${credentials.apiKey}`,
						},
					};

					try {
						const response = await this.helpers.httpRequest(uploadRequestOptions);
						returnData.push(response);
					} catch (requestError) {
						throw requestError;
					}
				}
			} catch (error) {
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
