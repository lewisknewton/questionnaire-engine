# Questionnaire Engine

A questionnaire engine coursework project for the Web Programming module (2019-2020).

Download a zip of this repository or clone it using:
```bash
git clone https://github.com/lewisknewton/webp-coursework
```

For development and testing, the application was run on the University of Portsmouth's [Virtual Machine Service](https://uop-1-server-per-student-prod.appspot.com/instance/get).

## Set-up

Navigate to the installation folder and run:
```bash
npm run setup
npm start
```

`npm run setup` will create the database and its tables. `npm start` will launch the application.

For testing purposes, the `example.json` file has been included in the questionnaires directory to provide an example questionnaire. A similar file, `another-example.json`, has been included within a sub-folder for the same reason.

## Loading Questionnaires

The questionnaire engine uses JSON files to structure and read the details of questionnaires. 

To load a questionnaire, place its JSON file into the questionnaires directory. Any sub-folders within this directory will be searched recursively to load questionnaires included within them.

## API

The following routes may be accessed after prepending `api`.

| Resource              | GET                      |
|-----------------------|--------------------------|
| /questionnaires       | Retrieve questionnaires  |
| /questionnaires/:name | Retrieve a questionnaire |

## Linting

During development, the following linters were used:

* [ESLint](https://eslint.org/) (extending [eslint-config-portsoc](https://github.com/portsoc/eslint-config-portsoc)) for JavaScript
* [stylelint](https://stylelint.io/) for CSS

Two scripts, `lint-js` and `lint-css`, were defined to lint all files of the respective types. Another script, `lint`, was created to run both and is used by running `npm run lint`.

## Testing

During development, [Jest](https://jestjs.io/) was used as the testing framework for the JavaScript files, along with the [SuperTest](https://www.npmjs.com/package/supertest) library. All test cases are in the tests directory and can be run using the `npm test` command.
