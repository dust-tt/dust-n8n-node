import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestMethods,
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
		inputs: ['main'],
		outputs: ['main'],
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
					{
						displayName: 'Stream Events (SSE)',
						name: 'streamEvents',
						type: 'boolean',
						default: false,
						description:
							'Listen to conversation events via SSE until completion and include them in the output',
					},
					{
						displayName: 'Stream Timeout (seconds)',
						name: 'streamTimeoutSeconds',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 300,
						description:
							'Maximum time to wait for the conversation to complete when streaming events',
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

					const streamEvents = Boolean((additionalFields as any)?.streamEvents);
					const streamTimeoutSecondsRaw = (additionalFields as any)?.streamTimeoutSeconds;
					const streamTimeoutSeconds =
						typeof streamTimeoutSecondsRaw === 'number' && !isNaN(streamTimeoutSecondsRaw)
							? streamTimeoutSecondsRaw
							: 300;

					const body = {
						blocking: !streamEvents,
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
						},
					};

					try {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'dustApi',
							requestOptions,
						);

						const conversationUrl = `${baseUrl}/w/${response.conversation.owner.sId}/assistant/${response.conversation.sId}`;
						const flatContent = response.conversation?.content?.flat?.() ?? [];
						const userMessages = flatContent.filter((m: any) => m?.type === 'user_message');
						const userMessageObj = userMessages.length > 0 ? userMessages[userMessages.length - 1] : undefined;
						const userMessageId = userMessageObj?.sId as string | undefined;

						if (!streamEvents) {
							// Blocking to get response from agent
							const agentMessages = response.conversation.content
								.flat()
								.filter((m: any) => m.type === 'agent_message')
								.map((am: any) => am.content);

							const nonEmptyAgentMessages = agentMessages
								.map((m: any) => (typeof m === 'string' ? m.trim() : ''))
								.filter((m: string) => m.length > 0);
							const agentMessageStr =
								nonEmptyAgentMessages.length === 0
									? 'No message returned'
									: nonEmptyAgentMessages.join('\n');
							const userMessage = response.conversation.content.flat()[0];

							returnData.push({
								json: {
									agentMessage: agentMessageStr,
									conversationUrl,
									userMessage,
								},
								pairedItem: { item: i }
							});
						} else {
							// Stream SSE events until completion
							const conversationId = response.conversation.sId as string;
							const eventsUrl = `${baseUrl}/api/v1/w/${credentials.workspaceId}/assistant/conversations/${conversationId}/events`;

							const controller = new (globalThis as any).AbortController();
							const timeout = (globalThis as any).setTimeout(() => controller.abort(), streamTimeoutSeconds * 1000);

							try {
								const events: Array<any> = [];
								let completed = false;
								let lastEventId: string | undefined = undefined;
								let streamError: any = null;

								while (!completed) {
									const headers: Record<string, string> = {
										Accept: 'text/event-stream',
										Authorization: `Bearer ${credentials.apiKey}`,
									};
									if (lastEventId) {
										headers['Last-Event-ID'] = lastEventId;
									}

									const sseRes = await (globalThis as any).fetch(eventsUrl, {
										method: 'GET',
										headers,
										signal: controller.signal,
									} as any);

									if (!(sseRes as any).ok || !(sseRes as any).body) {
										throw new Error(
											`Failed to open SSE stream: ${(sseRes as any).status} ${(sseRes as any).statusText}`,
										);
									}

									const reader = (sseRes as any).body.getReader();
									const decoder = new (globalThis as any).TextDecoder('utf-8');

									let buffer = '';
									let shouldReconnect = false;

									while (true) {
										const { value, done } = await reader.read();
										if (done) break;

										buffer += decoder.decode(value, { stream: true });
										const chunks = buffer.split('\n\n');
										buffer = chunks.pop() || '';

										for (const chunk of chunks) {
											const lines = chunk.split('\n');
											let dataStr = '';

											for (const line of lines) {
												if (line.startsWith('data:')) dataStr += line.slice(5).trim();
											}

											if (!dataStr) continue;

											const trimmed = dataStr.trim();
											if (trimmed === 'done') {
												shouldReconnect = true;
												break; // exit inner read loop to reconnect
											}

											let parsed: any = undefined;
											try {
												parsed = JSON.parse(dataStr);
											} catch (error) {
												throw error;
											}

											const payload = parsed?.data;
											events.push(payload);

											// Track last event id for resume
											if (typeof parsed?.eventId === 'string') {
												lastEventId = parsed.eventId;
											}

											// Stop ONLY on agent_message_done
											const payloadType = payload?.type ?? "undefined";
											if (payloadType === 'agent_message_done') {
												// If the agent completion signals an error status, capture and stop
												const status = payload?.status ?? "undefined";
												if (typeof status === 'string' && status.toLowerCase() !== 'success') {
													streamError = {
														status,
														conversationId: payload?.conversationId,
														messageId: payload?.messageId,
														raw: parsed,
													};
												}
												completed = true;
												break;
											}
										}

										if (completed || shouldReconnect) break;
									}

									// If server said 'done', reconnect unless completed
									if (completed) break;
									if (!shouldReconnect) {
										// Connection ended without 'done' and without completion -> reconnect as well
										// Overall timeout will still govern the total wait
										continue;
									}
								}

								// If stream reported an error, fail the node with context
								if (streamError) {
									throw new Error(
										`Dust agent run failed (status=${streamError.status}) for conversationId=${streamError.conversationId || 'unknown'}, messageId=${streamError.messageId || 'unknown'}`,
									);
								}

								// Always fetch final conversation to read agent messages after completion
								let finalAgentMessage: string | null = null;
								const convGet = await this.helpers.httpRequestWithAuthentication.call(
									this,
									'dustApi',
									{
										method: 'GET' as IHttpRequestMethods,
										url: `${baseUrl}/api/v1/w/${credentials.workspaceId}/assistant/conversations/${conversationId}`,
										headers: {
											Accept: 'application/json',
										},
									},
								);
								try {
									const convFlat = convGet.conversation?.content?.flat?.() ?? [];
									const convAgentAll = convFlat.filter?.((m: any) => m?.type === 'agent_message') ?? [];
									const convAgentForThisUser =
										userMessageId
											? convAgentAll.filter((m: any) => m?.parentMessageId === userMessageId)
											: convAgentAll;
									const convAgentMessages = convAgentForThisUser
										.map?.((am: any) => am?.content)
										?.filter?.((c: any) => typeof c === 'string' && c.length > 0);
									if (Array.isArray(convAgentMessages) && convAgentMessages.length > 0) {
										finalAgentMessage = convAgentMessages.join('\n');
									}
								} catch (error) {
									throw error;
								}

								returnData.push({
									json: {
										agentMessage: finalAgentMessage ?? 'No message returned',
										conversationUrl,
										userMessage: userMessageObj ?? body.message,
										events,
									},
									pairedItem: { item: i }
								});
							} finally {
								(globalThis as any).clearTimeout(timeout);
							}
						}
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
						},
					};

					try {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'dustApi',
							uploadRequestOptions,
						);
						returnData.push({
							json: response,
							pairedItem: { item: i }
						});
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
