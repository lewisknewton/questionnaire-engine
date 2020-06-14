# Questionnaire Engine

A questionnaire engine coursework project for the Web Programming module (2019-2020).

For development and testing, the application was run on the University of Portsmouth's [Virtual Machine Service](https://uop-1-server-per-student-prod.appspot.com/instance/get).

## Directory Structure

The application consists of the following directories:

* [public/](public/) – contains front-end files to be served to clients
* [server/](server/)
  * [database/](server/database/) – contains files for configuring and accessing the PostgreSQL database
  * [questionnaires/](server/questionnaires/) – contains user-provided questionnaire files
  * [routes/](server/routes/) – contains endpoint definitions for the API and normal browser use
* [tests/](tests/) – contains automated test cases

## Set-up

Navigate to the installation directory and run:

```bash
npm run setup
npm start
```

These commands will create the database and start the web server (see below for detail).

## Database

The application uses a PostgreSQL database to store responses and basic questionnaire details.

The `npm run setup` command will create the database and its tables, using the parameters in the [config.json](config.json) file.

> **NOTE**: The `npm run setup` command does not specify the username and password. If required, these can be provided manually (e.g. with the `-U` flag or a `.pgpass` file).

The default `host` parameter is designed for use on the university VMs, which do not require the `user` and `password` parameters. If required, these parameters can be replaced in the `database` object of the [config.json](config.json) file.

For example, to run the application locally you might use something like:

```json
"database": {
  "host": "localhost",
  "user": "postgres",
  "password": "yourpassword"
}
```

The default database name is `up891791_questionnaire_engine`. If required, this can be replaced in the [schema.sql](database/schema.sql) and [config.json](config.json) files.

## Server
The `npm start` command will launch the application using an HTTP server running on port 8080, located in [app.js](app.js). To access the application, run `npm start` on your PC or running virtual machine and enter the address shown into your browser.

### Terms

Some key terms used throughout the application are defined as follows:

| Term        | Definition                                                                                    |
|-------------|-----------------------------------------------------------------------------------------------|
| Answer      | The value a user gives to a question.                                                         |
| Author      | A user who creates and manages questionnaires.                                                |
| ID          | The unique ID (UUID4) of a questionnaire or response, used as their primary keys.             |
| Participant | A user who takes a questionnaire, providing answers that form a response.                     |
| Response    | The collection of answers a participant gives when taking a questionnaire.                    |
| Short ID    | The shorter, more readable version of a questionnaire or response's identifier, used in URLs. |

## Features

The application caters to two main user types: *authors* and *participants*.

Authors can:

* add questionnaires
* share questionnaires
* delete questionnaires
* view responses
* download responses
* delete responses (together or individually)
* access basic guidance on how to do the above

Participants can:

* take questionnaires
* share questionnaires

### Questionnaires

The application uses JSON files to define the details and structures of questionnaires. Records of these files are also stored in the database, which include their unique ID, short ID, and file path. The short ID is used to view questionnaires, either on the [review.html](public/review.html) page for authors or the [take.html](public/take.html) page for participants.

All questionnaire files must be stored in the [questionnaires/](server/questionnaires/) directory, or in a sub-directory within this directory (see [Adding Questionnaires](#adding-questionnaires)). Any sub-directories will be searched recursively to load questionnaires included in them.

The server will fetch questionnaires in the background so that new questionnaires are available to authors and participants shortly after their respective files are uploaded. 

Changes made to the questionnaire files will be reflected to authors on the [index.html](public/index.html) (home) and [review.html](public/review.html) pages once fetched. However, to avoid confusion, participants taking questionnaires will not see the new changes unless they refresh the [take.html](public/js/take.js) page.

For testing purposes, the [example.json](server/questionnaires/example.json) file has been included to provide an example questionnaire. Similar files—[another-example.json](server/questionnaires/another-example/another-example.json) and [without-questions.json](server/questionnaires/another-example/without-questions.json)—have also been included within a sub-directory.

#### Adding Questionnaires

Authors can add questionnaires via an upload on the [index.html](public/index.html) (home) page. To do this, they need to click on the *Add Questionnaire* button, which will open an upload dialog. The authors can then upload the file(s), either by:

* dragging and dropping the file(s) into the upload dialog
* selecting the file(s) on their device, using the file input and upload button

At minimum, a questionnaire file should include a `name` with which to identify it.

##### Questions Types

Questions may be defined within the `questions` object of a questionnaire file. All question types require the following properties:

* `id`, to uniquely identify them
* `text`, to describe their content
* `type`, to define their type

Some question types support additional attributes specific to them. There are multiple question types are available, as shown in the following table:

| Type Property   | Use              | Input Type      | Selector                 | Additional Attributes |
|-----------------|------------------|-----------------|--------------------------|-----------------------|
| `free-form`     | Free-form text   | Multi-line text | `textarea`               |                       |
| `likert`        | Likert scales    | Radio button    | `input[type="radio"]`    | `options`             |
| `multi-select`  | Multiple choice  | Checkbox        | `input[type="checkbox"]` | `options`             |
| `number`        | Numerical values | Number          | `input[type="number"]`   |                       |
| `single-select` | Single choice    | Radio button    | `input[type="radio"]`    | `options`             |
| `text`          | Short text       | Mulit-line text | `input[type="text"]`     |                       |

To define questions of these types, use the appropriate *type property*.

The following is an example of a valid `single-select` question, taken from [example.json](server/questionnaires/example.json):

```json
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
```

This example contains all required attributes, as well as the additional required `options` attribute used for questions with more than one input (`multi-select` and `single-select` questions).

##### Required Questions

To make it mandatory to answer a question, give the question the `required` attribute and set it to `true`.

##### Quizzes

Questionnaires can be used to solely collect responses, or they can be made into quizzes to score the answers given by participants.

To make a quiz, add the `answer` property to at least one question in the questionnaire file, with the value being the correct answer for that question. By default, questions with the `answer` property will be scored out of 1, although you can specify a different number of points available using the `points` property.

Without these properties, the questionnaire will be treated as standard, with no scoring.

The following is an example of a valid scored question, taken from [another-example.json](server/questionnaires/another-example/another-example.json):

```json
{
  "id": "ostrich",
  "text": "What is bigger than an ostrich's brain?",
  "type": "single-select",
  "options": [
    "Its beak",
    "Its eye",
    "Its foot"
  ],
  "answer": "Its eye"
},
```

> **NOTE**: The `answer` property expects string or number values. When read, its value will be converted to a string.
> **NOTE**: The `points` property expects a number value. When read, its value will be converted to a number.

#### Deleting Questionnaires

Authors can delete questionnaires by clicking the *Delete* button of any questionnaire shown on the [index.html](public/index.html) (home) page.

#### Taking Questionnaires

Participants can take questionnaires on the [take.html](public/take.html) page, using the URL provided to them by the author. This URL would contain the short ID of the questionnaire e.g. `http://q-engine.com/take/xxx`.

The page displays all questions, including their respective input types and details. Participants fill in their answer(s) for each question and can then submit their response by clicking the *Submit* button.

#### Sharing Questionnaires

Authors and participants can share links for taking a questionnaire to gather more responses. The application supports sharing via their device's native or a fallback method.

Authors can share any questionnaire shown on the [index.html](public/index.html) (home) page by clicking its *Share* button. Participants can share a questionnaire they have taken after submitting their response on the [take.html](public/take.html) page.

> **NOTE**: Native sharing uses the `share()` method of the *Web Share API*, which can only run in secure contexts on supported devices.

### Responses

When a participant takes a questionnaire, their answers are collated to form a response for that questionnaire. This response is stored in the database, and the questionnaire author can then view the response on the [review.html](public/review.html) page, using the ID of the questionnaire e.g. `http://q-engine.com/review/xxx`.

The server will attempt to fetch responses in the background so that new responses are shown to authors shortly after they are recorded.

#### Viewing Responses

On the [review.html](public/review.html) page, authors can view the responses recorded for their questionnaires via two tab pabels:

* The *Aggregrated* view, showing a summary of all responses by question
* The *Individual* view, showing responses one-by-one

#### Downloading Responses

On the [review.html](public/review.html) page, authors can download responses by clicking the *Download Responses* button.

The application supports the following structured file formats:

* CSV (`.csv`)
* JSON (`.json`)
* TSV (`.tsv`)

#### Deleting Responses

On the [review.html](public/review.html) page, authors can delete responses they do not wish to keep. They can delete all responses at once by clicking the *Delete Responses* button, or an individual response by clicking its respective *Delete* button on the individual view.

## Help

A help section providing basic guidance is available at [help.html](public/help.html). This details how authors are able to use the application, from creating questionnaires to viewing responses.

## Routing

The application uses two types of routes:

* *API* routes, designed for direct calls
* *Web* routes, designed to serve client files for normal browser use

Their endpoints are defined in [app.js](app.js). The functions called at these endpoints are defined in [api-routes.js](routes/api-routes.js) and [web-routes.js](routes/web-routes.js), respectively.

### API Routes

The following routes may be accessed after prepending `api` e.g. `http://q-engine.com/api/questionnaires`.

| Resource                              | GET                                               | POST                                           | DELETE                                                          |
|---------------------------------------|---------------------------------------------------|------------------------------------------------|-----------------------------------------------------------------|
| `/questionnaires`                     | Retrieve all questionnaires.                      | Save a questionnaire, using a given JSON file. |                                                                 |
| `/questionnaires/:id`                 | Retrieve a given questionnaire.                   |                                                | Remove a questionnaire, including its records and stored file. |
| `/questionnaires/:id/responses`       | Retrieve all responses for a given questionnaire. | Save a response for a given questionnaire.     | Delete all responses for a given questionnaire.                |
| `/questionnaires/:id/responses/:rId` |                                                   |                                                | Delete a given response.                                       |

The parameters used in some routes, `:id:` and `:rId`, represent *questionnaire* and *response* short IDs, respectively.

Where necessary, details about related resources are included for context. For example, basic questionnaire details are returned alongside responses for clarity and error handling (e.g. when there is something preventing responses from being given).

#### Statuses

The success or failure of each request to these endpoints is provided in the form of common status codes and custom messages. In general: 

* successful *GET* requests return the requested resource
* unsuccessful *GET*, *POST*, or *DELETE* requests return an error or warning messsage

These status codes and error and warning messages can be found and configured in [status.js](server/status.js).

When viewed via the client files, additional success, error, and warning messages are occassionally shown to give context to general users. These can be found in their respective script files in the [js/](public/js/) directory.

### Web Routes

The following routes may be accessed directly in the browser e.g. `http://q-engine.com/`.

| Path        | Page                              | Purpose                                                                      |
|-------------|-----------------------------------|------------------------------------------------------------------------------|
| /           | [index.html](public/index.html)   | Display all questionnaires.                                                  |
| /take/:id   | [take.html](public/js/take.js)    | Display, and records responses for, a given questionnaire.                   |
| /review/:id | [review.html](public/review.html) | Display details and responses for a given questionnaire to support analysis. |

The parameter used in some routes, `:id`, represents *questionnaire* short IDs. This allows for more readable URLs, as opposed to using query strings e.g. `http://q-engine.com/take?id=xxx`.

### Static Files

All HTML files in the [public/](public/) folder can be served as static files. However, some have routes defined for them for handling parameters (see [Web Routes](#web-routes)).

## Accessibility

### Elements

Where possible, the application uses native elements. However, in the few places this was not possible due to certain layouts and dynamic content, additional accessibility information was provided using *ARIA*.

Recommendations were followed to make controls that are not yet standard as part of HTML more accessible. For example, a fallback was used for dialogs and keyboard navigation was configured for tabs. Semantic HTML is also used where possible, with less descriptive elements such as `<div>` being avoided except in scenarios where there are no suitable alternatives.

### Styling

The colours used conform to, at minimum, WCAG 2.0 Level AA. However, most satisfy WCAG 2.0 Level AAA. Button and input sizes were also kept consistent for easy access.

Where icons or symbols are used, alternative text is provided for users with screen readers. Titles are also defined where their meanings are not immediately obvious.

## Usability

### Simplicity

Since the application has a broad potential audience, naming has been kept as simple as possible throughout. This applies to both page content and URLs, which do not use fragments or query strings to be easier for novice users to use (see [Web Routes](#web-routes)).

Similarly, to promote recognition over recall, minimal navigation items were used, and input styles do not deviate far from their browser defaults. Icons are also used sparingly where they are likely familar (see [FontAwesome Icons](#fontawesome-icons)).

### Background Refresh

To limit the need for page refreshing, the application uses polling to periodically fetch data in the background and update the front-end shown to users. See [Questionnaires](#questionnaires) and [Responses](#responses) for more detail.

### User Preferences

The UI adapts to the user's preferences by:

* showing all or limited animations, depending on their `prefers-reduced-motion` feature
* showing a *light* or *dark* colour scheme, depending on their `prefers-color-scheme` feature

## Security

To avoid exposing their primary keys, short IDs are assigned to questionnaires and responses for sharing and review. These short IDs were not used as primary keys themselves, since they could be regenerated if desired.

Paths to questionnaire files are also hidden to avoid hinting at the server's contents to users on the client-side.

## Linting

During development, the following linters were used:

* [ESLint](https://eslint.org/) (extending [eslint-config-portsoc](https://github.com/portsoc/eslint-config-portsoc)) for JavaScript
* [stylelint](https://stylelint.io/) for CSS

Two commands, `lint-js` and `lint-css`, were defined to lint all files of the respective types. Another command, `lint`, was created to run both and is used by running `npm run lint`.

## Testing

During development, [Jest](https://jestjs.io/) was used as the testing framework for the JavaScript files, along with the [SuperTest](https://www.npmjs.com/package/supertest) library. All test cases are in the [tests/](tests/) directory and can be run using the `npm test` command.

## FontAwesome Icons

The application uses [FontAwesome](https://fontawesome.com/) SVG icons, found in the [img/](public/img) directory. These are licenced under [CC BY 4.0 Licence](https://creativecommons.org/licenses/by/4.0/).

A copy of the licence can be viewed in [fa-licence.txt](public/img/fa-licence.txt) or on the [FontAwesome Free License page](https://fontawesome.com/license/free).
