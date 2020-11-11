// will be used to insert labels into the ontology (ontology is just a huge string)
String.prototype.splice = function(start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

fs = require('fs');
commandLineArgs = require('command-line-args');

const RECONCILED_CELL = 'core/recon-judge-similar-cells';

// program parameters
const optionDefinitions = [
  { name: 'ontology', alias: 't', type: String },
  { name: 'input', alias: 'i', type: String },
  { name: 'output', alias: 'o', type: String }
];

const options = commandLineArgs(optionDefinitions);


const ontologyPath = options.ontology || 'ontology.owl';

if (!options.input) {
    console.log('No se especifico archivo GREL de entrada.');
    return;
}

// read files
const promises = [
    readFromFile(options.input),
    readFromFile(ontologyPath, 'utf8')
];

Promise.all(promises).then(result => {
    // open refine grel
    const grel = JSON.parse(result[0]);
    let ontology = result[1];
    let tagsCount = 0;
    let errorsCount = 0;

    // iterate through the content
    grel.forEach(element => {
        if (element.op === RECONCILED_CELL) {
            const modifiedOntology = insertLabelInOntology(ontology, element);
            if (modifiedOntology) {
                ontology = modifiedOntology;
                tagsCount++;
            } else {
                errorsCount++;
            }          
        }
    });

    const resultFilePath = options.output || 'modified-ontology.owl';
    // replace in ontology and write result
	fs.writeFile(resultFilePath, ontology, function (err,data) {
		if (err) {
			return console.log(err);
		}
        console.log(`\n\nSe agregaron ${tagsCount} sinonimos, ${errorsCount} errores.`);
		console.log(`Se creo el archivo ${resultFilePath}`);
	});
});

function insertLabelInOntology(ontology, element) {
    const classTag = `<owl:Class rdf:about="${element.match.id}">`;
    const label = getLabelTagForElement(element);
    const index = ontology.indexOf(classTag);
    if (index > -1) {
        // insert label into ontology owl:class
        return ontology.splice(index  + classTag.length, 0, label);
    } 
    // console.log(`No se encontro etiqueta para ${element.match.id} - ${element.match.name} en la ontologia.`)
}

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
function getLabelTagForElement(element) {
    const synonymTag = '<AnnotationAssertion> <AnnotationProperty abbreviatedIRI="rdfs:label"/> <AbbreviatedIRI>obo:{{id}}</AbbreviatedIRI> <Literal xml:lang="es">{{value}}</Literal> </AnnotationAssertion>';
    return '\n' + synonymTag.replace('{{id}}', getElementChebiId(element)).replace('{{value}}', element.similarValue) + '\n';
}

// returns the chebi id of a grel object
function getElementChebiId(element) {
    const id = element.match.id;
    const idIndex = id.indexOf('CHEBI_');
    return id.substring(idIndex);
}