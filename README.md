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

For example, to run the application locally you might use something like:

```json
"host": "localhost",
"user": "postgres",
"password": "yourpassword"
```

The default database name is `questionnaire_engine`. If required, this can be replaced in the [schema.sql](database/schema.sql) and [config.json](database/config.json) files.

## Server
The `npm start` command will launch the application using an HTTP server running on port 8080, located in [server.js](server.js).

To access the application, run `npm start` on your PC or running virtual machine and enter the address shown into your browser.

### Terms

Some key terms used throughout the application are defined as follows:

| Term        | Definition                                                                                    |
|-------------|-----------------------------------------------------------------------------------------------|
| Answer      | The value a user gives to a question.                                                         |
| Author      | A user who creates questionnaires.                                                            |
| ID          | The unique ID (UUID4) of a questionnaire or response, used as their primary keys.             |
| Participant | A user who takes a questionnaire, providing answers that form a response.                     |
| Response    | The collection of answers a participant gives when taking a questionnaire.                    |
| Short ID    | The shorter, more readable version of a questionnaire or response's identifier, used in URLs. |

## Features

The application caters to two main user types: *authors* and *participants*.

Authors can:

* add questionnaires
* share questionnaires
* view responses
* download responses

Participants can:

* take questionnaires

### Questionnaires

The questionnaire engine uses JSON files to define the details and structures of questionnaires. Records of these files are also stored in the database, which include their unique ID, short ID, and file path.

All questionnaires must be stored in the [questionnaires/](questionnaires/) directory as `.JSON` files. Any sub-directories within this directory will be searched recursively to load questionnaires included within them.

For testing purposes, the [example.json](questionnaires/example.json) file has been included to provide an example questionnaire. Similar files—[another-example.json](questionnaires/another-example/another-example.json) and [without-questions.json](questionnaires/another-example/without-questions.json)—have also been included within a sub-directory.

#### Adding Questionnaires

To add a questionnaire, place its JSON file into the [questionnaires/](questionnaires/) directory, or a sub-directory within this directory.

#### Questions

The following question types are available:

| Input Type      | Property        | Selector                 | Use              | 
|-----------------|-----------------|--------------------------|------------------|
| Number          | `number`        | `input[type="number"]`   | Numerical values |
| Checkbox        | `multi-select`  | `input[type="checkbox"]` | Multiple choice  |
| Radio button    | `single-select` | `input[type="radio"]`    | Single choice    |
| Mulit-line text | `text`          | `textarea`               | Free-form text   |

To define questions of these types, use the appropriate *property*.

The following is an example of a valid `single-select` question, taken from [example.json](questionnaires/example.json):

```json
"questions": [
  {
    "id": "lord",
    "text": "Which is the best lord?",
    "type": "single-select",
    "options": [
      "Lord of the Rings",
      "Lord of the Flies",
      "Lord of the Dance",
      "Lorde"
    ]
  },
],
```

### Responses

When a participant takes a questionnaire, their answers are collated to form a response for that questionnaire. This response is stored in the database, and the questionnaire author can then view the response on the [review.html](public/review.html) page, using the ID of the questionnaire.

The server will attempt to fetch responses in the background so that new responses are shown to authors shortly after they are recorded.

#### Downloading Responses

Authors can download responses in one of the following file formats:

* CSV (`.csv`)
* JSON (`.json`)
* TSV (`.tsv`)

## Routing

The application uses two types of routes:

* *API* routes, designed for direct calls
* *Web* routes, designed to serve client files for normal browser use

Their endpoints are defined in [server.js](server.js). The functions called at these endpoints are defined in [api-routes.js](routes/api-routes.js) and [web-routes.js](routes/web-routes.js), respectively.

For simplicity and security, short IDs are used for all endpoints instead of unique IDs.

### API

The following routes may be accessed after prepending `api` e.g. `xx.xxx.xxx.xx/api/questionnaires`.

| Resource                        | GET                                               | POST                                       |
|---------------------------------|---------------------------------------------------|--------------------------------------------|
| /questionnaires                 | Retrieve all questionnaires.                      |                                            |
| /questionnaires/:id             | Retrieve a given questionnaire.                   |                                            |
| /questionnaires/:id/responses   | Retrieve all responses for a given questionnaire, as well as some details about the questionnaire for context. | Save a response for a given questionnaire. |

### Web

The following routes may be accessed directly in the browser e.g. `xx.xxx.xxx.xx/`.

| Path        | Page                              | Purpose                                                                      |
|-------------|-----------------------------------|------------------------------------------------------------------------------|
| /           | [index.html](public/index.html)   | Display all questionnaires.                                                  |
| /take/:id   | [take.html](public/js/take.js)    | Display, and records responses for, a given questionnaire.                   |
| /review/:id | [review.html](public/review.html) | Display details and responses for a given questionnaire to support analysis. |

These routes allow for more readable URLs, as opposed to using query strings e.g. `/take?id=xxx`.

## Accessibility

Where possible, the application uses native elements. However, in the few places this was not possible due to certain layouts and dynamic content, additional accessibility information was provided using ARIA.

Recommendations were followed to make controls that are not yet standard as part of HTML more accessible. For example, a fallback was used for dialogs and keyboard navigation was configured for tabs.

The colours used throughout conform to, at minimum, WCAG 2.0 Level AA. However, most satisfy WCAG 2.0 Level AAA. 

Button and other input sizes were also kept consistent for easy access.

## Usability

The UI adapts to the user's preferences by:

* showing all or limited animations, depending on their `prefers-reduced-motion` feature
* showing a *light* or *dark* colour scheme, depending on their `prefers-color-scheme` feature

## Security

To avoid exposing their primary keys, alternative short IDs are assigned to questionnaires and responses for sharing and review.

Paths to questionnaire files are also hidden to avoid hinting at the server's contents to users on the client-side.

## Linting

During development, the following linters were used:

* [ESLint](https://eslint.org/) (extending [eslint-config-portsoc](https://github.com/portsoc/eslint-config-portsoc)) for JavaScript
* [stylelint](https://stylelint.io/) for CSS

Two scripts, `lint-js` and `lint-css`, were defined to lint all files of the respective types. Another script, `lint`, was created to run both and is used by running `npm run lint`.

## Testing

During development, [Jest](https://jestjs.io/) was used as the testing framework for the JavaScript files, along with the [SuperTest](https://www.npmjs.com/package/supertest) library. All test cases are in the [tests/](tests/) directory and can be run using the `npm test` command.

## Icons

The application uses [FontAwesome](https://fontawesome.com/) SVG icons, found in the [img/](public/img) directory. These are licenced under [CC BY 4.0 Licence](https://creativecommons.org/licenses/by/4.0/).

A copy of the licence can be viewed in [fa-licence.txt](public/img/fa-licence.txt) or at [https://fontawesome.com/license/free](https://fontawesome.com/license/free).
