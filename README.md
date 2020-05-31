# Questionnaire Engine

A questionnaire engine coursework project for the Web Programming module (2019-2020).

For development and testing, the application was run on the University of Portsmouth's [Virtual Machine Service](https://uop-1-server-per-student-prod.appspot.com/instance/get).

## Directory Structure

The application consists of the following directories:

* [database/](database/) – containing files for configuring and accessing the PostgreSQL database
* [public/](public/) – containing front-end files to be served to clients
* [questionnaires/](questionnaires/) – containing user-provided questionnaire files
* [routes/](routes/) – containing endpoint definitions for the API and normal browser use
* [tests/](tests/) – containing automated test cases

## Set-up

Navigate to the installation directory and run:

```bash
npm run setup
npm start
```

These commands will create the database and start the web server (see below for detail).

## Database

The application uses a PostgreSQL database to store responses and basic questionnaire details.

The `npm run setup` command will create the database and its tables, using the parameters in the [config.json](database/config.json) file.

> **NOTE**: The `npm run setup` command does not specify the username and password. If required, these can be provided manually (e.g. with the `-U` flag or a `.pgpass` file).

The default `host` parameter is designed for use on the university VMs, which do not require the `user` and `password` parameters. If required, these parameters can be replaced in the [config.json](database/config.json) file.

For example, to run the application locally you might use:

```json
"host": "localhost",
"user": "postgres",
"password": "yourpassword"
```

The default database name is `questionnaire_engine`. If required, this can be replaced in the [schema.sql](database/schema.sql) and [config.json](database/config.json) files.

## Server
The `npm start` command will launch the application using an HTTP server running on port 8080, located in [server.js](server.js).

To access the application, run `npm start` on your running virtual machine and enter the address shown into your browser.

For testing purposes, the [example.json](questionnaires/example.json) file has been included to provide an example questionnaire. Similar files—[another-example.json](questionnaires/another-example/another-example.json) and [without-questions.json](questionnaires/another-example/without-questions.json)—have also been included within a sub-directory.

## Questionnaires

The questionnaire engine uses a JSON structure to define and read the details of questionnaires. 

All questionnaires must be stored in the [questionnaires/](questionnaires/) directory as `.JSON` files. Any sub-directories within this directory will be searched recursively to load questionnaires included within them.

### Adding Questionnaires

To add a questionnaire, place its JSON file into the [questionnaires/](questionnaires/) directory, or a sub-directory within this directory. 

## Design

### Terms

Some key terms used throughout the application are defined as follows:

| Term     | Definition                                                                                                                         |
|----------|------------------------------------------------------------------------------------------------------------------------------------|
| Answer   | The value a user gives to a question.                                                                                              |
| ID       | The unique ID (UUID4) of a questionnaire or response, used as their primary keys.                                                  |
| Response | The collection of answers a user gives to a questionnaire.                                                                         |
| Short ID | The shorter, more readable version of a questionnaire or response's identifier, used in URLs to avoid exposing their primary keys. |

### Routing

The application uses two types of routes:

* *API* routes, designed for direct calls
* *Web* routes, designed to serve client files for normal browser use

Their endpoints are defined in [server.js](server.js). The functions called at these endpoints are defined in [api-routes.js](routes/api-routes.js) and [web-routes.js](routes/web-routes.js), respectively.

For simplicity and security, short IDs are used for all endpoints instead of unique IDs.

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

### Security

To avoid exposing their primary keys, alternative short IDs are assigned to questionnaires and responses for sharing and review.

## Linting

During development, the following linters were used:

* [ESLint](https://eslint.org/) (extending [eslint-config-portsoc](https://github.com/portsoc/eslint-config-portsoc)) for JavaScript
* [stylelint](https://stylelint.io/) for CSS

Two scripts, `lint-js` and `lint-css`, were defined to lint all files of the respective types. Another script, `lint`, was created to run both and is used by running `npm run lint`.

## Testing

During development, [Jest](https://jestjs.io/) was used as the testing framework for the JavaScript files, along with the [SuperTest](https://www.npmjs.com/package/supertest) library. All test cases are in the [tests/](tests/) directory and can be run using the `npm test` command.
