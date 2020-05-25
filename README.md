# Questionnaire Engine

A questionnaire engine coursework project for the Web Programming module (2019-2020).

For development and testing, the application was run on the University of Portsmouth's [Virtual Machine Service](https://uop-1-server-per-student-prod.appspot.com/instance/get).

## Set-up

Navigate to the installation folder and run:
```bash
npm run setup
npm start
```

### Database
`npm run setup` will create the database and its tables, using the parameters in the [database/config.json](database/config.json) file.

The default database name is `questionnaire_engine`. If you would prefer a different name, replace this in [database/schema.sql](database/schema.sql).

### Server
`npm start` will launch the application using an HTTP server running on port 8080, located in [server.js](server.js).

To access the application, run `npm start` on your running virtual machine and enter the address shown into your browser.

For testing purposes, the `example.json` file has been included in the questionnaires directory to provide an example questionnaire. Similar files—`another-example.json` and `without-questions.json`—have been included within a sub-folder for the same reason.

## Design

### Terms

To avoid ambiguity, the following terms used throughout the application have been defined here.

| Term     | Definition                                                 |
|----------|------------------------------------------------------------|
| Answer   | The value a user gives to a question.                      |
| Response | The collection of answers a user gives to a questionnaire. |

### Routing

The application uses two types of routes:

* *API* routes, designed for direct calls
* *Web* routes, designed to serve client files for normal browser use

Their endpoints are defined in [server.js](server.js). The functions called at these endpoints are defined in [api-routes.js](routes/api-routes.js) and [web-routes.js](routes/web-routes.js), respectively.

#### API

The following routes may be accessed after prepending `api` e.g. `xx.xxx.xxx.xx/api/questionnaires`.

| Resource                        | GET                                               | POST                                       |
|---------------------------------|---------------------------------------------------|--------------------------------------------|
| /questionnaires                 | Retrieve all questionnaires.                      |                                            |
| /questionnaires/:id             | Retrieve a given questionnaire.                   |                                            |
| /questionnaires/:id/responses   | Retrieve all responses for a given questionnaire. | Save a response for a given questionnaire. |

#### Web

The following routes may be accessed directly in the browser e.g. `xx.xxx.xxx.xx/`.

| Path        | Page                              | Purpose                                                                      |
|-------------|-----------------------------------|------------------------------------------------------------------------------|
| /           | [index.html](public/index.html)   | Display all questionnaires.                                                  |
| /take/:id   | [take.html](public/js/take.js)    | Display, and records responses for, a given questionnaire.                   |
| /review/:id | [review.html](public/review.html) | Display details and responses for a given questionnaire to support analysis. |

### Questionnaires

The questionnaire engine uses a JSON structure to define and read the details of questionnaires. 

All questionnaires must be stored in the [questionnaires](questionnaires) directory as `.JSON` files. Any sub-folders within this directory will be searched recursively to load questionnaires included within them.

#### Adding Questionnaires

To add a questionnaire, place its JSON file into the [questionnaires](questionnaires) directory. 

### Security

To avoid exposing their primary keys, 'URL-friendly' IDs are assigned to questionnaires and responses for sharing and review.

## Linting

During development, the following linters were used:

* [ESLint](https://eslint.org/) (extending [eslint-config-portsoc](https://github.com/portsoc/eslint-config-portsoc)) for JavaScript
* [stylelint](https://stylelint.io/) for CSS

Two scripts, `lint-js` and `lint-css`, were defined to lint all files of the respective types. Another script, `lint`, was created to run both and is used by running `npm run lint`.

## Testing

During development, [Jest](https://jestjs.io/) was used as the testing framework for the JavaScript files, along with the [SuperTest](https://www.npmjs.com/package/supertest) library. All test cases are in the tests directory and can be run using the `npm test` command.
