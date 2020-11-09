fs = require('fs');
commandLineArgs = require('command-line-args');

const RECONCILED_CELL = 'core/recon-judge-similar-cells';

// program parameters
const optionDefinitions = [
  { name: 'template', alias: 't', type: String },
  { name: 'input', alias: 'i', type: String },
  { name: 'output', alias: 'o', type: String }
];

const options = commandLineArgs(optionDefinitions);


const templatePath = options.template || 'ontology-template.owl';

if (!options.input) {
    console.log('No se especifico archivo GREL de entrada.');
    return;
}

// read files
const promises = [
    readFromFile(options.input),
    readFromFile(templatePath, 'utf8')
];

Promise.all(promises).then(result => {
    // open refine grel
    const grel = JSON.parse(result[0]);
    const template = result[1];
    let finalContent = '';
    let tagCount = 0;

    // iterate through the content
    grel.forEach(element => {
        if (element.op === RECONCILED_CELL) {
            finalContent += getSynonymTagForElement(element);
            tagCount++;
        }
    });

    const resultFilePath = options.output || 'extended-ontology.owl';
    // replace in template and write result
	fs.writeFile(resultFilePath, template.replace('{{content}}', finalContent), function (err,data) {
		if (err) {
			return console.log(err);
		}
        console.log(`Se agregaron ${tagCount} sinonimos.`);
		console.log(`Se creo el archivo ${resultFilePath}`);
	});
});


function readFromFile(file, format = '') {
    return new Promise((resolve, reject) => {
        fs.readFile(file, format, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// given an element from the GREL return a tag that represents a synonym in the ontology
function getSynonymTagForElement(element) {
    const synonymTag = '<AnnotationAssertion> <AnnotationProperty abbreviatedIRI=\"rdfs:label\"/> <IRI>{{iri}}</IRI> <Literal xml:lang=\"es\">{{value}}</Literal> </AnnotationAssertion>';
    return '\n' + synonymTag.replace('{{iri}}', element.match.id).replace('{{value}}', element.similarValue) + '\n';
}
