const template = document.createElement('template');
template.innerHTML = `
  <style>
  .input-hints-container {
    padding: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
      Arial, sans-serif;
  }
  
  input {
    width: 100%;
    min-width: 300px;
    font-size: 16px;
    padding: 4px;
  }
  
  .row {
    margin-top: 1em;
  }
  
  .row label {
    display: block;
    min-width: 10em;
  }
  
  .row input {
    width: 70%;
  }
  
  #searchVariants {
    display: none;
    width: 70%;
    min-width: 300px;
    background-color: rgb(241, 241, 241);
    position: absolute;
    border: 1px solid black;
  }
  .searchItem {
    padding: 0.5rem;
    margin: 0;
  }
  .searchItem:hover {
    cursor: pointer;
    background-color:  rgb(192, 192, 192);
  }
  @media only screen and (max-width: 600px) {
    .row {
      margin-top: 2em;
    }
  
    .row input {
      width: 100%;
    }
  
    .input-hints-container {
      margin: 0;
    }
    #searchVariants {
      width: 90%;
      font-weight: 600;
    }
  }
  </style>
  <section class="input-hints-container">
  <section class="container">
    <p><strong>Компания или ИП</strong></p>
    <input id="party" name="party" type="text" placeholder="Введите название, ИНН, ОГРН или адрес организации" list="searchVariants"/>
    <div id="searchVariants" >
    </div>
    </div>  
  </section>
  
  <section class="result">
    <p id="type"></p>
    <div class="row">
      <label>Краткое наименование</label>
      <input id="name_short">
    </div>
    <div class="row">
      <label>Полное наименование</label>
      <input id="name_full">
    </div>
    <div class="row">
      <label>ИНН / КПП</label>
      <input id="inn_kpp">
    </div>
    <div class="row">
      <label>Адрес</label>
        <input id="address">
    </div>
  </section>
  </section>
`;

class OrganizationInputHints extends HTMLElement {
  #url
  #token
  #options
  constructor() {
    super();
    // Private API fields
    this.#url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party"
    this.#token = "a904aff57c18d1aa551593db2e7526ca3ee3ccac";
    this.#options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Token " + this.#token
      }
    }
    this.searchOptions = []
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Shadow DOM elements
    this.nameShort = this.shadowRoot.querySelector('#name_short')
    this.nameFull = this.shadowRoot.querySelector('#name_full')
    this.innKpp = this.shadowRoot.querySelector('#inn_kpp')
    this.address = this.shadowRoot.querySelector('#address')
    this.queryInput = this.shadowRoot.querySelector('#party')
    this.hintsContainer = this.shadowRoot.querySelector('#searchVariants')
  }

  showVariants(data) {
    // Show search variants
    const createElement = (elementData) => {
      // Create elements and insert them into hintsContainer
      const element = document.createElement('p')
      element.innerText = elementData.value
      element.classList.add("searchItem")
      element.setAttribute("data-inn", elementData.data.inn);
      this.hintsContainer.appendChild(element)
    }

    this.resetVariants()
    if (data.suggestions.length > 0) {
      this.hintsContainer.style.display = 'block';
      this.searchOptions = data.suggestions
      this.searchOptions.map(createElement)
    }
  }

  resetVariants() {
    // clear hintsContainer
    console.log('reset');
    this.searchOptions = []
    this.hintsContainer.innerHTML = ""
    this.hintsContainer.style.display = 'none';
  }

  fillTheFields(data) {
    // Fill fields with data
    console.log('fillTheFields');
    this.resetVariants()
    data = data.suggestions[0].data
    this.queryInput.value = data.name.short_with_opf
    this.nameShort.value = data.name.short_with_opf
    this.nameFull.value = data.name.full_with_opf
    this.innKpp.value = `${data.inn} / ${data.kpp}`
    this.address.value = data.address.value
  }

  async getCompaniesInfo(query) {
    // Get data from an API
    try {
      let queryOptions = this.#options
      queryOptions.body = JSON.stringify({ query: query, count: 5 })
      const response = await fetch(this.#url, queryOptions)
      return await response.json()
    } catch (err) {
      console.log(err);
    }
  }

  connectedCallback() {
    const that = this
    this.hintsContainer.addEventListener("click", async function (event) {
      // When user choose the hint, fill fields with it's data
      if (event.target.classList.contains('searchItem')) {
        const query = event.target.getAttribute('data-inn')
        const data = await that.getCompaniesInfo(query, 1)
        that.fillTheFields(data)
      }
    })
    this.queryInput.addEventListener('keypress', async function (event) {
      // On enter fill the fields with corresponding data
      // In other cases provide user with search hints
      let data = await that.getCompaniesInfo(this.value)
      if (event.key === 'Enter' && this.value.length > 0) {
        console.log('Enter');
        that.fillTheFields(data)
      } else if (this.value.length > 1) {
        console.log('Anykey');
        that.showVariants(data)
      }
    })
  }
}

window.customElements.define('input-hints-organizations', InputHintsOrganizations);
