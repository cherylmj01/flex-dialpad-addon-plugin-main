import ApiService from './ApiService';

class TaskRouterService extends ApiService {

	async updateTaskAttributes(taskSid, attributesUpdate) {

		const result = await this.#updateTaskAttributes(taskSid, JSON.stringify(attributesUpdate))

		return result.success;
	}


	#updateTaskAttributes = (taskSid, attributesUpdate) => {

		const encodedParams = {
			Token: encodeURIComponent(this.manager.user.token),
			taskSid: encodeURIComponent(taskSid),
			attributesUpdate: encodeURIComponent(attributesUpdate)
		};

		return this.fetchJsonWithReject(
			`${this.serverlessDomain}/update-task-attributes`,
			{
				method: 'post',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: this.buildBody(encodedParams)
			}
		).then((response) => {
			return {
				...response,
			};
		});
	};
}


export default new TaskRouterService();
