import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

declare const setTimeout: (handler: () => void, ms: number) => unknown;
declare const Buffer: {
	from(data: unknown, encoding?: string): { length: number; toString(encoding?: string): string };
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

const TEXT_CONTENT_TYPE_HINTS = [
	'text/',
	'json',
	'xml',
	'javascript',
	'html',
	'csv',
	'markdown',
	'yaml',
	'x-yaml',
];

const isTextualContentType = (contentType: string | null | undefined): boolean => {
	if (!contentType) return false;
	const ct = contentType.toLowerCase();
	return TEXT_CONTENT_TYPE_HINTS.some((hint) => ct.includes(hint));
};

export class Dust implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dust',
		name: 'dust',
		icon: 'file:dust.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Dust API',
		defaults: {
			name: 'Dust',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'dustApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Agent',
						value: 'agent',
					},
					{
						name: 'Document',
						value: 'document',
					},
				],
				default: 'agent',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['agent'],
					},
				},
				options: [
					{
						name: 'Talk To',
						value: 'talkToAssistant',
						description: 'Send a message to an agent',
						action: 'Talk to an agent',
					},
				],
				default: 'talkToAssistant',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				options: [
					{
						name: 'Upload',
						value: 'uploadDocument',
						description: 'Upload a document to a data source',
						action: 'Upload a document',
					},
				],
				default: 'uploadDocument',
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
						resource: ['agent'],
						operation: ['talkToAssistant'],
					},
				},
			},
			{
				displayName: 'Agent Name or ID',
				name: 'assistantConfigurationId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getAgents',
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['agent'],
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
						resource: ['agent'],
						operation: ['talkToAssistant'],
					},
				},
				options: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
					},
					{
						displayName: 'Full Name',
						name: 'fullName',
						type: 'string',
						default: '',
						description: 'Display name of the caller (e.g. "Jane Doe"). Used for attribution in Dust.',
					},
					{
						displayName: 'Include Generated File Content',
						name: 'includeGeneratedFileContent',
						type: 'boolean',
						default: true,
						description:
							'Whether to download the content of each file the agent generates (Jira extracts, CSVs, HTML visualizations, …) and include it inline in the output. Turn off to keep only metadata (fileId, title, downloadUrl).',
					},
					{
						displayName: 'Max Generated File Size (Bytes)',
						name: 'maxGeneratedFileSizeBytes',
						type: 'number',
						default: 10000000,
						description:
							'Per-file size ceiling when downloading generated file content. Larger files are reported with `tooLarge: true` and their content is omitted. Ignored when Include Generated File Content is off.',
					},
					{
						displayName: 'Max Wait (Ms)',
						name: 'maxWaitMs',
						type: 'number',
						default: 120000,
						description:
							'Maximum total time to wait for the agent to finish, in milliseconds. Ignored when Wait For Completion is off.',
					},
					{
						displayName: 'Poll Interval (Ms)',
						name: 'pollIntervalMs',
						type: 'number',
						default: 1500,
						description:
							'Time between polling attempts when waiting for the agent to finish, in milliseconds',
					},
					{
						displayName: 'Timezone',
						name: 'timezone',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Username',
						name: 'username',
						type: 'string',
						default: '',
						description: 'Short identifier of the caller (e.g. "jane.doe"). Should not include the @domain part of an email.',
					},
					{
						displayName: 'Wait For Completion',
						name: 'waitForCompletion',
						type: 'boolean',
						default: true,
						description:
							'Whether to poll the conversation until the agent finishes and return its message. Turn off to return immediately with just the conversation ID.',
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
						resource: ['document'],
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
						resource: ['document'],
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
						resource: ['document'],
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
						resource: ['document'],
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
						resource: ['document'],
						operation: ['uploadDocument'],
					},
				},
				options: [
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
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'The title of the document',
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
						Accept: 'application/json',
					},
				};

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'dustApi',
						options,
					);
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

					const waitForCompletion =
						additionalFields.waitForCompletion === undefined
							? true
							: (additionalFields.waitForCompletion as boolean);
					const pollIntervalMs = Math.max(
						250,
						(additionalFields.pollIntervalMs as number) || 1500,
					);
					const maxWaitMs = Math.max(
						pollIntervalMs,
						(additionalFields.maxWaitMs as number) || 120000,
					);
					const includeGeneratedFileContent =
						additionalFields.includeGeneratedFileContent === undefined
							? true
							: (additionalFields.includeGeneratedFileContent as boolean);
					const maxGeneratedFileSizeBytes = Math.max(
						1,
						(additionalFields.maxGeneratedFileSizeBytes as number) || 10000000,
					);

					const body = {
						title: null,
						visibility: 'unlisted',
						message: {
							content: message,
							context: {
								timezone: additionalFields.timezone || 'Europe/Paris',
								username: additionalFields.username || 'DustN8N',
								email: additionalFields.email || 'n8n@dust.tt',
								fullName: (additionalFields.fullName as string) || null,
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
						},
					};

					const createResponse = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'dustApi',
						requestOptions,
					);

					const conversationId = createResponse.conversation.sId;
					const ownerSId = createResponse.conversation.owner.sId;
					const conversationUrl = `${baseUrl}/w/${ownerSId}/assistant/${conversationId}`;

					if (!waitForCompletion) {
						const userMessage = createResponse.conversation.content.flat()[0];
						returnData.push({
							json: {
								conversationId,
								conversationUrl,
								userMessage,
							},
							pairedItem: { item: i },
						});
						continue;
					}

					const pollUrl = `${baseUrl}/api/v1/w/${credentials.workspaceId}/assistant/conversations/${conversationId}`;
					const deadline = Date.now() + maxWaitMs;
					let lastAgent: any = null;

					while (Date.now() < deadline) {
						await sleep(pollIntervalMs);
						const poll = await this.helpers.httpRequestWithAuthentication.call(this, 'dustApi', {
							method: 'GET' as IHttpRequestMethods,
							url: pollUrl,
							headers: { Accept: 'application/json' },
						});

						const groups = (poll.conversation.content as any[][]) || [];
						lastAgent = [...groups]
							.reverse()
							.flat()
							.find((m: any) => m && m.type === 'agent_message');

						if (lastAgent?.status === 'succeeded') {
							const userMessage = poll.conversation.content.flat()[0];

							const seenFileIds = new Set<string>();
							const generatedFiles: IDataObject[] = [];

							const collectFile = (
								file: any,
								source: { actionSId?: string; toolName?: string },
							) => {
								if (!file?.fileId || seenFileIds.has(file.fileId)) return;
								seenFileIds.add(file.fileId);
								generatedFiles.push({
									fileId: file.fileId,
									title: file.title ?? null,
									contentType: file.contentType ?? null,
									snippet: file.snippet ?? null,
									downloadUrl: `${baseUrl}/api/w/${credentials.workspaceId}/files/${file.fileId}?action=download`,
									fromToolName: source.toolName ?? null,
									fromActionSId: source.actionSId ?? null,
								});
							};

							if (Array.isArray(lastAgent.generatedFiles)) {
								for (const file of lastAgent.generatedFiles) collectFile(file, {});
							}
							if (Array.isArray(lastAgent.actions)) {
								for (const action of lastAgent.actions) {
									if (Array.isArray(action.generatedFiles)) {
										for (const file of action.generatedFiles) {
											collectFile(file, {
												actionSId: action.sId,
												toolName: action.toolName,
											});
										}
									}
								}
							}

							if (includeGeneratedFileContent && generatedFiles.length > 0) {
								for (const file of generatedFiles) {
									try {
										const fileRes: any =
											await this.helpers.httpRequestWithAuthentication.call(
												this,
												'dustApi',
												{
													method: 'GET' as IHttpRequestMethods,
													url: file.downloadUrl as string,
													encoding: 'arraybuffer',
													returnFullResponse: true,
													headers: { Accept: '*/*' },
												},
											);

										const responseContentType =
											(fileRes.headers?.['content-type'] as string | undefined) ??
											(file.contentType as string | undefined) ??
											null;
										const body = fileRes.body;
										const size: number = body?.length ?? 0;

										file.size = size;
										file.responseContentType = responseContentType;

										if (size > maxGeneratedFileSizeBytes) {
											file.tooLarge = true;
											continue;
										}

										const buf = Buffer.from(body);
										if (isTextualContentType(responseContentType)) {
											file.content = buf.toString('utf-8');
										} else {
											file.contentBase64 = buf.toString('base64');
										}
									} catch (error) {
										file.downloadError = (error as Error).message ?? 'unknown error';
									}
								}
							}

							returnData.push({
								json: {
									agentMessage: lastAgent.content ?? '',
									chainOfThought: lastAgent.chainOfThought ?? null,
									conversationId,
									conversationTitle: poll.conversation.title ?? null,
									conversationUrl,
									generatedFiles,
									rawConversation: poll.conversation,
									userMessage,
								},
								pairedItem: { item: i },
							});
							break;
						}

						if (lastAgent?.status === 'failed' || lastAgent?.status === 'cancelled') {
							throw new NodeOperationError(
								this.getNode(),
								`Dust agent ${lastAgent.status}: ${lastAgent.error?.message ?? 'unknown error'}`,
								{ itemIndex: i },
							);
						}
					}

					if (lastAgent?.status !== 'succeeded') {
						throw new NodeOperationError(
							this.getNode(),
							`Dust agent did not complete within ${maxWaitMs}ms (last status: ${lastAgent?.status ?? 'unknown'}). Conversation: ${conversationUrl}`,
							{ itemIndex: i },
						);
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
						},
					};

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'dustApi',
						uploadRequestOptions,
					);
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
