import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class DustApi implements ICredentialType {
	name = 'dustApi';
	displayName = 'Dust API';
	documentationUrl = 'https://dust.tt/docs';

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
		},
		{
			displayName: 'Workspace ID',
			name: 'workspaceId',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			options: [
				{
					name: 'EU',
					value: 'EU',
				},
				{
					name: 'US',
					value: 'US',
				},
			],
			default: 'US',
		},
	];
}
