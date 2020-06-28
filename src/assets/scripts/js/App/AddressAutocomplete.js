const axios = require('axios').default;

class AddressAutocomplete {

	constructor(props) {
		this.props = Object.assign({
			containerEl: '#address-container',
			inputEl: '#address',
			minCharsInputted: 5,
			maxResults: 10,
			auxText: 'Digite pelo menos {?int} caracteres para que as sujestões sejam carregadas',
			debounceWait: 1000
		}, props);

		this._listEl = (() => {
			let el = document.createElement('ul');
			
			el.classList.add('address-autocomplete-list');

			return el;
		})();

		this._listItems = [];

		this._start();
	}

	_start() {
		this.props.containerEl = document.querySelector(this.props.containerEl);
		this.props.inputEl = document.querySelector(this.props.inputEl);

		if(!this.props.containerEl || !this.props.inputEl) {
			console.error('Isn\'t possible to initiate, containerEl or inputEl are invalid!');
			return;
		}

		if(this.props.containerEl.style.position === '') this.props.containerEl.style.position = 'relative';

		this.props.containerEl.appendChild(this._listEl);

		this._listen();
	}

	_listen() {
		let timeout = null;

		const getRelatedAddresses = (event) => {
			let inputted = event.target.value;

			if(inputted.length === 0) {
				this._clearListItems();
				this._showList();
				this._hideList();

				return;
			} else if(inputted.length < this.props.minCharsInputted) {
				return;
			}
			
			this._clearListItems();
			this._addListItem('...', true);
			this._showList();

			clearTimeout(timeout);

			timeout = setTimeout(() => {
				axios.get(`http://cep.la/${encodeURIComponent(inputted)}`, {
					headers: {
						accept: 'application/json'
					}
				})
				.then((response) => {
					let addresses = response.data instanceof Array ? this.props.maxResults !== -1 ? response.data.slice(0, this.props.maxResults) : response.data : [response.data];

					this._hideList();
					this._clearListItems();

					addresses.forEach((address) => {
						let { logradouro, bairro, cidade, uf, cep } = address;

						this._addListItem(`${logradouro}, ${bairro} - ${cidade} / ${uf} - ${cep}`);
					});

					this._showList();
				})
				.catch((error) => {
					console.error(error);

					this._clearListItems();
					this._hideList();
				});
			}, this.props.debounceWait);
		};
		
		this.props.inputEl.addEventListener('focus', () => {
			if(this._isEmptyListItems()) {
				this._addListItem(this.props.auxText.replace('{?int}', this.props.minCharsInputted), true);
			}

			this._showList();
		});

		this.props.inputEl.addEventListener('focusout', () => {
			this._hideList();
		});

		this.props.inputEl.addEventListener('input', getRelatedAddresses);
	}

	_isEmptyListItems() {
		return this._listItems.length === 0;
	}

	_clearListItems() {
		this._listItems = [];
	}

	_addListItem(value, onlyView = false) {
		this._listItems.push(`<li data-only-view="${onlyView}">${value}</li>`);
	}

	_listenListItems() {
		this._listEl.querySelectorAll('li[data-only-view="false"]').forEach((el) => {
			el.onclick = (event) => {
				this.props.inputEl.value = event.target.innerText;
			};
		});
	}

	_showList() {
		this._listEl.innerHTML = this._listItems.join('');
		this._listEl.classList.add('show');

		this._listenListItems();
	}

	_hideList() {
		this._listEl.classList.remove('show');
	}

}

export default AddressAutocomplete;