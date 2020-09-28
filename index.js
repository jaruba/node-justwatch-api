
const needle = require('needle');
const QueryString = require('querystring');
const randomUseragent = require('random-useragent');

const API_DOMAIN = 'apis.justwatch.com';

class JustWatch {
	constructor(options) {
		this._options = Object.assign({locale:'en_US'}, options);
	}

	request(method, endpoint, params) {
		return new Promise((resolve, reject) => {
			params = Object.assign({}, params);
			// build request data
			const url = 'https://' + API_DOMAIN + '/content' + endpoint
			const opts = { headers: {} }

			if (this._options.proxy)
				opts.proxy = this._options.proxy;

			if (this._options.proxyType)
				opts.headers['proxy-type'] = this._options.proxyType;

 			opts.headers['user-agent'] = randomUseragent.getRandom()

			let body = null;
			// add query string if necessary
			if(method==='GET') {
				if(Object.keys(params) > 0) {
					url += '?'+QueryString.stringify(params);
				}
			}
			else {
				body = JSON.stringify(params);
				opts.headers['Content-Type'] = 'application/json';
			}

			// send request
			function callback(err, resp, body) {
				if (err || !body)
					reject(err || Error("request failed with status "+resp.statusCode+": "+resp.statusMessage))
				else if (body.error)
					reject(Error(body.error))
				else
					resolve(body)
			}

			if (method == 'POST')
				needle.post(url, body, opts, callback)
			else
				needle[method.toLowerCase()](url, opts, callback)
		});
	}

	async search(options={}) {
		if(typeof options === 'string') {
			options = {query: options};
		}
		else {
			options = Object.assign({}, options);
		}
		// build default params
		const params = {
			'content_types': null,
			'presentation_types': null,
			'providers': null,
			'genres': null,
			'languages': null,
			'release_year_from': null,
			'release_year_until': null,
			'monetization_types': null,
			'min_price': null,
			'max_price': null,
			'scoring_filter_types': null,
			'cinema_release': null,
			'query': null,
			'page': null,
			'page_size': null
		};
		const paramKeys = Object.keys(params);
		// validate options
		for(const key in options) {
			if(paramKeys.indexOf(key) === -1) {
				throw new Error("invalid option '"+key+"'");
			}
			else {
				params[key] = options[key];
			}
		}
		// send request
		const locale = encodeURIComponent(this._options.locale);
		return await this.request('POST', '/titles/'+locale+'/popular', params);
	}

	async getProviders() {
		const locale = encodeURIComponent(this._options.locale);
		return await this.request('GET', '/providers/locale/'+locale);
	}

	async getGenres() {
		const locale = encodeURIComponent(this._options.locale);
		return await this.request('GET', '/genres/locale/'+locale);
	}

	async getSeason(season_id) {
		season_id = encodeURIComponent(season_id);
		const locale = encodeURIComponent(this._options.locale);
		return await this.request('GET', '/titles/show_season/' + season_id + '/locale/' + locale);
	}

	async getEpisodes(show_id, page) {
		show_id = encodeURIComponent(show_id);
		const locale = encodeURIComponent(this._options.locale);
		const query = page && !isNaN(page) ? ('?page=' + page) : '';
		return await this.request('GET', '/titles/show/'+show_id+'/locale/'+locale+'/newest_episodes' + query);
	}

	async getTitle(content_type, title_id) {
		title_id = encodeURIComponent(title_id);
		content_type = encodeURIComponent(content_type);
		const locale = encodeURIComponent(this._options.locale);
		return await this.request('GET', '/titles/'+content_type+'/'+title_id+'/locale/'+locale);
	}

	async getPerson(person_id) {
		person_id = encodeURIComponent(person_id);
		const locale = encodeURIComponent(this._options.locale);
		return await this.request('GET', '/titles/person/'+person_id+'/locale/'+locale);
	}
}

module.exports = JustWatch;
